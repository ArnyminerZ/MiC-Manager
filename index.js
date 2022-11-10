'use strict';

import express from 'express';
import dotenv from 'dotenv';
import reqIp from 'request-ip';
import rateLimit from 'express-rate-limit';
import {errorResponse, successResponse} from './src/response.js';
import {check as dbCheck, info as dbInfo} from './src/request/database.js';
import {changePassword, login} from "./src/auth.js";
import {
    InvalidTokenException,
    PasswordlessUserException,
    SecurityException,
    UserNotFoundException,
    WrongPasswordException
} from './src/exceptions.js';
import {checkToken, decodeToken} from "./src/security.js";
import {getUserData} from "./src/data/users.js";
import {create as createEvent, getEvents, isEatEvent, setMenu} from "./src/data/events.js";
import {hasPermission} from "./src/permissions.js";
import {checkVariables, getProps} from './src/variables.js';
import {createClient as calCreateClient, getAddressBookUrl, getCard, getCards} from "./src/request/caldav.js";
import {error, info, infoSuccess, log, warn} from './cli/logger.js';
import {addEndpoints as addMigrationEndpoints} from "./src/endpoints/migration.js";

dotenv.config();

checkVariables();
const props = getProps();

/**
 * The port number used for listening for http requests.
 * @type {number}
 */
const HTTP_PORT = process.env.HTTP_PORT ?? 3000;

info(`Checking database...`);
if (!(await dbCheck(!!process.env.DEBUG))) {
    error(`Could not connect to database. Host: ${process.env.DB_HOSTNAME}`)
    process.exit(1);
} else
    infoSuccess(`Database connected.`);

info(`Checking CalDAV server...`);
if (!(await calCreateClient())) {
    error(`Could not connect to the CalDAV server.`)
    process.exit(1);
}
await getCards();
infoSuccess(`CalDAV server ready. AB Url:`, getAddressBookUrl());

const app = express();

// Limits the maximum amount of concurrent requests that can be made. If migration is enabled, the max rate is greatly
// increased for allowing quick data write.
const rateLimitOptions = {windowMs: 60 * 1000, max: props.includes('migration') ? 500 : 10};
const limiter = rateLimit(rateLimitOptions);
info('Per minute rate limit:', rateLimitOptions.max);

// Middleware
app.use(reqIp.mw());
app.use(express.json({strict: false}));
app.use(express.urlencoded({extended: true}));
app.use(limiter);

app.get('/ping', (req, res) => res.send('pong'));
app.get('/v1/info', async (req, res) => {
    const database = await dbInfo();
    res.json(successResponse({database}));
});
app.post('/v1/user/auth', async (req, res) => {
    const body = req.body;
    /** @type {string|null} */
    const nif = body['nif'];
    /** @type {string|null} */
    const password = body['password'];

    if (nif == null || password == null)
        return res.status(400).json(errorResponse('missing-parameters'));
    try {
        const token = await login(nif, password, req.clientIp);
        res.status(200).json(successResponse({token}));
    } catch (e) {
        if (e instanceof PasswordlessUserException)
            res.status(417).json(errorResponse('passwordless'));
        else if (e instanceof WrongPasswordException)
            res.status(403).json(errorResponse('wrong-credentials'));
        else if (e instanceof SecurityException)
            res.status(412).json(errorResponse('max-attempts-reached'));
        else if (e instanceof UserNotFoundException)
            res.status(404).json(errorResponse('not-found'));
        else {
            error('Could not authenticate. Error:', e);
            res.status(500).json({success: false, error: 'unknown', errorData: e});
        }
    }
});
app.get('/v1/user/data', async (req, res) => {
    const query = req.query;
    /** @type {string|null} */
    const apiKey = req.get('API-Key');
    /** @type {string|null} */
    const userIdParam = query['user_id'];

    if (apiKey == null || !(await checkToken(apiKey)))
        return res.status(406).send(errorResponse('invalid-key'));

    let tokenData;
    try {
        tokenData = await decodeToken(apiKey);
    } catch (e) {
        return res.status(401).send(errorResponse('invalid-key'));
    }

    let userId, constrain = false;
    if (userIdParam != null) {
        userId = parseInt(userIdParam);
        constrain = !(await hasPermission(userId, 'people_see'));
    } else {
        userId = tokenData['userId'];
    }

    const userData = await getUserData(userId);
    if (userData == null)
        return res.status(404).json(errorResponse('not-found'));

    const vCard = await getCard(userData.Uid);
    log('vCard:', vCard)
    if (vCard == null)
        warn(`Could not find vCard for user #${userId}. Uid:`, userData.Uid);
    else
        userData.vCard = vCard;

    if (constrain)
        res.json(successResponse(userData.vCard));
    else
        res.json(successResponse(userData));
});
app.post('/v1/user/change_password', async (req, res) => {
    const body = req.body;
    /** @type {string|null} */
    const nif = body['nif'];
    /** @type {string|null} */
    const password = body['password'];
    /** @type {string|null} */
    const apiKey = req.get('API-Key');

    if (nif == null || password == null)
        return res.status(400).json(errorResponse('missing-parameters'));
    try {
        await changePassword(nif, password, apiKey);
        res.status(200).json(successResponse());
    } catch (e) {
        if (e instanceof InvalidTokenException)
            res.status(406).json(errorResponse('invalid-key'));
        else if (e instanceof UserNotFoundException)
            res.status(406).json(errorResponse('not-found'));
        else
            res.status(500).json({error: e})
        error(e);
    }
});
app.get('/v1/events/list', async (req, res) => {
    /**
     * @type {string|null}
     */
    const apiKey = req.get('API-Key');
    if (apiKey == null || !(await checkToken(apiKey)))
        return res.status(406).send(errorResponse('invalid-key'));
    const events = await getEvents();
    res.json(successResponse(events));
});
app.post('/v1/events/join', async (req, res) => {
    const body = req.body;
    /** @type {string|null} */
    const eventId = body['event_id'];
    /** @type {string|null} */
    const apiKey = req.get('API-Key');

    if (eventId == null)
        return res.status(400).send(errorResponse('missing-parameters'));

    if (apiKey == null || !(await checkToken(apiKey)))
        return res.status(406).send(errorResponse('invalid-key'));

    // TODO: Join event
});
app.post('/v1/events/create', async (req, res) => {
    const body = req.body;
    /** @type {string|null} */
    const displayName = body['displayName'];
    /** @type {string|null} */
    const description = body['description'];
    /** @type {string|null} */
    const date = body['date'];
    /** @type {string|null} */
    const contact = body['contact'];
    /** @type {string|null} */
    const category = body['category'];
    /** @type {string|null} */
    const apiKey = req.get('API-Key');

    // Check for the mandatory parameters
    if (displayName == null || date == null || category == null)
        return res.status(400).json(errorResponse('missing-parameters'));

    // Check API key
    if (apiKey == null || !(await checkToken(apiKey)))
        return res.status(406).json(errorResponse('invalid-key'));

    /** @type {{nif: string, userId: number}} */
    let tokenData;
    try {
        tokenData = await decodeToken(apiKey);
    } catch (e) {
        return res.status(406).json(errorResponse('invalid-key'));
    }

    // Check if user has permission to add events
    if (!(await hasPermission(tokenData.userId, 'event_add'))) {
        error('User', tokenData.userId, 'tried to add a new event. Error: unauthorised');
        return res.status(401).json(errorResponse('unauthorised'));
    }

    // Create the event
    try {
        await createEvent(displayName, description, new Date(date), contact, category);
        res.json(successResponse());
    } catch (e) {
        res.status(500).json(errorResponse(e));
    }
});
app.post('/v1/events/:event_id/set_menu', async (req, res) => {
    const params = req.params;
    const body = req.body;
    /** @type {number} */
    const eventId = parseInt(params['event_id']);

    /** @type {string[]} */
    const firsts = body['firsts'];
    /** @type {string[]} */
    const seconds = body['seconds'];
    /** @type {string[]} */
    const thirds = body['thirds'];
    /** @type {string[]} */
    const desserts = body['desserts'];
    /** @type {boolean|null} */
    const drinkIncluded = body['drink_included'];
    /** @type {boolean|null} */
    const coffeeIncluded = body['coffee_included'];
    /** @type {boolean|null} */
    const teaIncluded = body['tea_included'];
    /** @type {{grade:string|null,price:number}[]|null} */
    const pricing = body['pricing'];

    /** @type {string|null} */
    const apiKey = req.get('API-Key');

    if (drinkIncluded == null || coffeeIncluded == null || teaIncluded == null || pricing == null)
        return res.status(400).json(errorResponse('missing-parameters'));

    if (isNaN(eventId)) return res.status(406).json(errorResponse('invalid-request'));

    // Check API key
    if (apiKey == null || !(await checkToken(apiKey)))
        return res.status(406).json(errorResponse('invalid-key'));

    /** @type {{nif: string, userId: number}} */
    let tokenData;
    try {
        tokenData = await decodeToken(apiKey);
    } catch (e) {
        return res.status(406).json(errorResponse('invalid-key'));
    }

    // Check if user has permission to add events
    if (!(await hasPermission(tokenData.userId, 'event_edit'))) {
        error('User', tokenData.userId, 'tried to add a new event. Error: unauthorised');
        return res.status(401).json(errorResponse('unauthorised'));
    }

    const events = await getEvents();
    /** @type {EventData,null} */
    const event = events.find(v => v.id === eventId);

    if (event == null) return res.status(404).json(errorResponse('not-found'));

    const eatEvent = isEatEvent(eventId);
    if (!eatEvent) return res.status(405).json(errorResponse('not-allowed'));

    await setMenu(eventId, {
        firsts: firsts ?? [],
        seconds: seconds ?? [],
        thirds: thirds ?? [],
        desserts: desserts ?? [],
        drinkIncluded,
        coffeeIncluded,
        teaIncluded,
        pricing,
    });

    res.json(successResponse());
});

// Extra endpoints
if (props.includes('migration')) addMigrationEndpoints(app);

// Fallback
app.get('*', (req, res) => res.status(404).json(errorResponse('invalid-request')));
app.post('*', (req, res) => res.status(404).json(errorResponse('invalid-request')));

app.listen(HTTP_PORT, () => info(`Listening for requests on http://localhost:${HTTP_PORT}`));
