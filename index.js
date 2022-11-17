'use strict';

import express from 'express';
import dotenv from 'dotenv';
import reqIp from 'request-ip';
import rateLimit from 'express-rate-limit';
import {errorResponse, successResponse} from './src/response.js';
import {check as dbCheck, info as dbInfo} from './src/request/database.js';
import {checkVariables, getProps} from './src/variables.js';
import {createClient as calCreateClient, getAddressBookUrl, getCards} from "./src/request/caldav.js";
import {error, info, infoSuccess} from './cli/logger.js';
import {addEndpoints as addMigrationEndpoints} from "./src/endpoints/migration.js";
import {addEndpoints as addTestingEndpoints} from "./src/endpoints/testing.js";
import {auth, changePassword, data} from "./src/endpoints/user.js";
import {create, join, list, setMenu} from "./src/endpoints/events.js";

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
const rateLimitOptions = {
    windowMs: 60 * 1000,
    max: props.includes('migration') || props.includes('testing') ? 500 : 10
};
const limiter = rateLimit(rateLimitOptions);
info('Per minute rate limit:', rateLimitOptions.max);

// Middleware
app.use(reqIp.mw());
app.use(express.json({strict: false}));
app.use(express.urlencoded({extended: true}));
app.use(limiter);

app.get('/ping', (req, res) => res.status(200).type('text/plain').send('pong'));
app.get('/v1/info', async (req, res) => {
    const database = await dbInfo();
    res.json(successResponse({database}));
});
app.post('/v1/user/auth', auth);
app.get('/v1/user/data', data);
app.post('/v1/user/change_password', changePassword);
app.get('/v1/events/list', list);
app.post('/v1/events/create', create);
app.post('/v1/events/:event_id/join', join);
app.post('/v1/events/:event_id/set_menu', setMenu);

// Extra endpoints
if (props.includes('migration')) addMigrationEndpoints(app);
if (props.includes('testing')) addTestingEndpoints(app);

// Fallback
app.get('*', (req, res) => res.status(404).json(errorResponse('invalid-request')));
app.post('*', (req, res) => res.status(404).json(errorResponse('invalid-request')));

app.listen(HTTP_PORT, () => info(`Listening for requests on http://localhost:${HTTP_PORT}`));
