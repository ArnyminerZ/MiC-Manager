import express from 'express';
import dotenv from 'dotenv';
import reqIp from 'request-ip';
import {errorResponse} from './src/response.js';
import {check as dbCheck} from './src/database.js';
import {login} from "./src/auth.js";

dotenv.config();

/**
 * The port number used for listening for http requests.
 * @type {number}
 */
const HTTP_PORT = process.env.HTTP_PORT ?? 3000;

console.info(`⏺️ Checking database...`);
if (!(await dbCheck())) {
    console.error(`❌  Could not connect to database. Host: ${process.env.DB_HOSTNAME}`)
    process.exitCode = 1;
} else
    console.info(`✅ Database connected.`);

if (process.exitCode === 1)
    throw Error('Could not initialize the server. Errors have occurred.');

const app = express();

// Middleware
app.use(reqIp.mw());

app.get('/v1/user/auth', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const query = req.query;
    /**
     * @type {string|null}
     */
    const dni = query['dni'];
    /**
     * @type {string|null}
     */
    const password = query['password'];

    if (dni == null || password == null)
        return res.status(400).json(errorResponse('missing-parameters'));
    console.info(await login(dni, password, req.clientIp));
    res.status(200).send('ok');
});

app.listen(HTTP_PORT, () => console.info(`🖥️ Listening for requests on http://localhost:${HTTP_PORT}`));
