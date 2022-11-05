'use strict';

import express from 'express';
import dotenv from 'dotenv';
import reqIp from 'request-ip';
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
import {getEvents} from "./src/data/events.js";
import {hasPermission} from "./src/permissions.js";
import {checkVariables} from './src/variables.js';
import {createClient as calCreateClient, getCards} from "./src/request/caldav.js";

dotenv.config();

checkVariables();

/**
 * The port number used for listening for http requests.
 * @type {number}
 */
const HTTP_PORT = process.env.HTTP_PORT ?? 3000;

console.info(`⏺️ Checking database...`);
if (!(await dbCheck(!!process.env.DEBUG))) {
    console.error(`❌  Could not connect to database. Host: ${process.env.DB_HOSTNAME}`)
    process.exitCode = 1;
} else
    console.info(`✅ Database connected.`);

console.info(`⏺️ Checking CalDAV server...`);
await calCreateClient();
await getCards();
console.info(`✅ CalDAV server ready.`);

if (process.exitCode === 1)
    throw Error('Could not initialize the server. Errors have occurred.');

const app = express();

// Middleware
app.use(reqIp.mw());
app.use(express.json({strict: false}));
app.use(express.urlencoded({extended: true}))

app.get('/ping', (req, res) => res.send('pong'));
app.get('/v1/info', async (req, res) => {
    const database = await dbInfo();
    res.json(successResponse({database}));
});
app.get('/v1/user/auth', async (req, res) => {
    // const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const query = req.query;
    /** @type {string|null} */
    const nif = query['nif'];
    /** @type {string|null} */
    const password = query['password'];

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
        else {
            console.error('❌ Could not authenticate. Error:', e);
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
        constrain = !(await hasPermission(userId, 'view-user-data'));
    } else {
        userId = tokenData['userId'];
    }
    const userData = await getUserData(userId);
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
        console.error(e);
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
});

// Fallback
app.get('*', (req, res) => res.status(404).json(errorResponse('invalid-request')));

app.listen(HTTP_PORT, () => console.info(`🖥️ Listening for requests on http://localhost:${HTTP_PORT}`));
