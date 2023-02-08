import express from 'express';
import rateLimit from 'express-rate-limit';

import {info, log} from '../../cli/logger.mjs';
import {pingEndpoint} from './endpoints/utils.mjs';
import {loginEndpoint, registerEndpoint} from "./endpoints/auth.mjs";
import {userDataEndpoint} from "./endpoints/users.mjs";

/**
 * Creates a new express server with all the required middleware and endpoints.
 * @return {import(express).core.Express}
 */
export const create = () => {
    info('Initializing web server...');
    const app = express();

    log('Adding middlewares...');
    app.use(express.json());

    const limiter = rateLimit({
        windowMs: 60*1000, // 1 minute
        max: 5
    });
    // noinspection JSCheckFunctionSignatures
    app.use(limiter);

    app.get('/', (req, res) => res.status(200).send('ok'));
    app.get('/v1/ping', pingEndpoint);
    app.get('/v1/auth/register', registerEndpoint);
    app.get('/v1/auth/login', loginEndpoint);
    app.get('/v1/user/data', userDataEndpoint);

    return app;
};

/**
 * Initializes the express web server.
 */
export const initServer = () => {
    const app = create();

    log('Starting to listen for web server...');
    app.listen(3000, () => {
        info('Server listening on http://localhost:3000');
    });
};
