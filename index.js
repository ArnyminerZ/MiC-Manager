import express from 'express';
import dotenv from 'dotenv';
import reqIp from 'request-ip';
import {errorResponse, successResponse} from './src/response.js';
import {check as dbCheck} from './src/database.js';
import {changePassword, login, PasswordlessUserException} from "./src/auth.js";

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
app.use(express.json({strict: false}));
app.use(express.urlencoded())

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
    try {
        await login(dni, password, req.clientIp);
        res.status(200).send('ok');
    } catch (e) {
        if (e instanceof PasswordlessUserException)
            res.status(417).json(errorResponse('passwordless'));
        else {
            console.error('❌ Could not authenticate. Error:', e);
            res.status(500).json({success: false, error: 'unknown', errorData: JSON.stringify(e)});
        }
    }
});
app.post('/v1/user/change_password', async (req, res) => {
    const body = req.body;
    /**
     * @type {string|null}
     */
    const dni = body['dni'];
    /**
     * @type {string|null}
     */
    const password = body['password'];
    /**
     * @type {string|null}
     */
    const apiKey = req.headers['apiKey']

    console.log('dni:', dni, 'password:', password, 'body:', req.body);
    if (dni == null || password == null)
        return res.status(400).json(errorResponse('missing-parameters'));
    const passwordChanged = await changePassword(dni, password, apiKey);
    if (passwordChanged)
        return res.status(200).json(successResponse());
    return res.status(500).json({error: 'work in progress'});
});

app.listen(HTTP_PORT, () => console.info(`🖥️ Listening for requests on http://localhost:${HTTP_PORT}`));
