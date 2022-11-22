'use strict';

import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import reqIp from 'request-ip';
import rateLimit from 'express-rate-limit';
import {compare as compareVersion} from 'compare-versions';
import https from 'https';

import {errorResponse, successResponse} from './src/response.js';
import {check as dbCheck, info as dbInfo} from './src/request/database.js';
import {checkFiles, checkVariables, getProps} from './src/environment.js';
import {createClient as calCreateClient, getAddressBookUrl, getCards} from "./src/request/caldav.js";
import {error, info, infoSuccess, warn} from './cli/logger.js';
import {addEndpoints as addMigrationEndpoints} from "./src/endpoints/migration.js";
import {addEndpoints as addTestingEndpoints} from "./src/endpoints/testing.js";
import {auth, changePassword, data, newUser} from "./src/endpoints/user.js";
import {create, join, list, setMenu} from "./src/endpoints/events.js";
import {check as checkFirefly} from './src/monetary/firefly.js';

import packageJson from './package.json' assert {type: 'json'};
import {decodeToken} from "./src/security.js";
import {hasPermission} from "./src/permissions.js";
import {SqlError} from "mariadb";
import {checkPayments} from "./src/monetary/transactions.js";

dotenv.config();

checkVariables();
checkFiles();
const props = getProps();

/**
 * The port number used for listening for http requests.
 * @type {number}
 */
const HTTP_PORT = process.env.HTTP_PORT ?? 3000;

info(`Checking database...`);
const dbCheckResult = await dbCheck(!!process.env.DEBUG);
if (dbCheckResult != null) {
    error(`Could not connect to database. Host: ${process.env.DB_HOSTNAME}`);
    if (dbCheckResult instanceof SqlError)
        error('Database error:', dbCheckResult.code, '-', dbCheckResult.text);
    else
        error('Error:', dbCheckResult);
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

info(`Checking Firefly server...`);
await checkFirefly();

info('Checking Stripe connection...');
await checkPayments();

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
app.use(bodyParser.json({strict: false}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(limiter);

app.get('/ping', (req, res) => res.status(200).type('text/plain').send('pong'));
app.get('/v1/info', async (req, res) => {
    /** @type {string|null} */
    const apiKey = req.get('API-Key');

    try {
        const database = await dbInfo();

        let unauthorised = true;
        if (apiKey != null) {
            let tokenData;
            try {
                tokenData = await decodeToken(apiKey);
            } catch (e) {
                return res.status(400).send(errorResponse('invalid-key'));
            }
            if (!(await hasPermission(tokenData.userId, 'admin/version_view')))
                return res.status(401).send(errorResponse('unauthorised'));
            unauthorised = false;
        }
        if (unauthorised) return res.json(successResponse({database}));

        const version = packageJson.version;
        const latestRelease = await new Promise((resolve) => https.get({
            protocol: 'https:',
            host: 'api.github.com',
            path: '/repos/ArnyminerZ/MiC-Manager/releases/latest',
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': 'Bearer de24b6a7b50bd3b3cd5cc29eee14100a83fa14e0',
            },
        }, res => {
            res.setEncoding('utf8');

            let rawData = '';
            res.on('data', chunk => rawData += chunk);
            res.on('end', () => {
                let json;
                try {
                    if (res.statusCode === 200) {
                        json = JSON.parse(rawData);
                        resolve(json['tag_name']);
                    } else {
                        warn(`Version information response: (${res.statusCode}): ${res.statusMessage}`);
                        resolve(null);
                    }
                } catch (e) {
                    if (e instanceof SyntaxError)
                        error('Could not parse latest version JSON:', json);
                    else
                        error('Could not get latest version. Error:', e);
                    resolve(null);
                }
            });
        }));
        const newVersion = latestRelease != null ? compareVersion(latestRelease, version, '>') : null;
        res.json(successResponse({database, version: {name: version, update: newVersion}}));
    } catch (e) {
        error('Could not get version information. Error:', e);
        return res.status(500).send(errorResponse(e instanceof Error ? e.toString() : e));
    }
});
app.post('/v1/user/auth', auth);
app.get('/v1/user/data', data);
app.post('/v1/user/change_password', changePassword);
app.put('/v1/user/new', newUser);
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
