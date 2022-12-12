import {addEndpoints as addMigrationEndpoints} from "./migration.js";
import {addEndpoints as addTestingEndpoints} from "./testing.js";
import {infoEndpoints} from "./info.mjs";
import {auth, changePassword, data, newUser} from "./user.js";
import {create, join, list, setMenu} from "./events.js";
import {errorResponse} from "../response.js";

export const addEndpoints = (app, props) => {
    // Regular endpoints
    app.get('/ping', (req, res) => res.status(200).type('text/plain').send('pong'));
    app.get('/v1/info', infoEndpoints);
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

    // Fallback endpoints
    app.get('*', (req, res) => res.status(404).json(errorResponse('invalid-request')));
    app.post('*', (req, res) => res.status(404).json(errorResponse('invalid-request')));
};