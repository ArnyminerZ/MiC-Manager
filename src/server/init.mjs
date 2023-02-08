import express from 'express';
import {info, log} from '../../cli/logger.mjs';
import {pingEndpoint} from './endpoints/utils.mjs';
import {loginEndpoint, registerEndpoint} from "./endpoints/auth.mjs";
import {userDataEndpoint} from "./endpoints/users.mjs";

/**
 * Initializes the express web server.
 */
export const initServer = () => {
    info('Initializing web server...');
    const app = express();

    log('Adding middlewares...');
    app.use(express.json());

    app.get('/', (req, res) => res.status(200).send('ok'));
    app.get('/v1/ping', pingEndpoint);
    app.get('/v1/auth/register', registerEndpoint);
    app.get('/v1/auth/login', loginEndpoint);
    app.get('/v1/user/data', userDataEndpoint);

    log('Starting to listen for web server...');
    app.listen(3000, () => {
        info('Server listening on http://localhost:3000');
    });
};
