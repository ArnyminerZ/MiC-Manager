import {error, warn} from "../../cli/logger.js";
import {newUser} from "../data/users.js";
import {query} from "../request/database.js";

export const addEndpoints = app => {
    warn('The "testing" prop is enabled. Do not keep enabled longer than needed.');

    app.get('/v1/testing/ping', (req, res) => res.status(200).type('text/plain').send('pong'));

    app.post('/v1/testing/new_user', async (req, res) => {
        const body = req.body;
        try {
            const result = await newUser(body);
            res.json({
                result: JSON.parse(JSON.stringify(result, (key, value) =>
                    typeof value === 'bigint'
                        ? value.toString()
                        : value // return everything else unchanged
                ))
            });
        } catch (e) {
            error('Could not create new user. Error:', e);
            res.status(500).json({error: e})
        }
    });

    app.post('/v1/testing/drop_attempts', async (req, res) => {
        try {
            await query('DELETE FROM mLoginAttempts WHERE 1;');
            res.json({success: true});
        } catch (e) {
            error('Could not create new user. Error:', e);
            res.status(500).json({error: e})
        }
    });
};
