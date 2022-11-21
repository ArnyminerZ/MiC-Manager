import {error, info, infoSuccess, log, warn} from "../../cli/logger.js";
import {errorResponse, successResponse} from "../response.js";
import {createClient, newCard} from "../request/caldav.js";
import {newUser} from "../data/users.js";
import {ParseException} from "../exceptions.js";
import {SqlError} from "mariadb";

export const addEndpoints = app => {
    warn('The "migration" prop is enabled. Do not keep enabled longer than needed.');

    app.get('/v1/migration/ping', (req, res) => res.send('pong'));

    app.post('/v1/migration/add_person', async (req, res) => {
        const body = req.body;

        /** @type {string|null} */
        const dataRaw = body.data;
        if (dataRaw == null) return res.status(400).json(errorResponse('missing-parameters'));
        /** @type {PersonData} */
        const data = JSON.parse(dataRaw);

        try {
            const [uuid, response] = await newCard(data);
            if (response.ok === true)
                return res.json(successResponse({uuid}));
            log('Could not add person. Response:', response);
            res.status(500).json(errorResponse('invalid-request'));
        } catch (e) {
            if (e instanceof ParseException)
                res.status(401).json(errorResponse('invalid-request'));
            else
                res.status(500).json(errorResponse(e));
        }
    });
    app.post('/v1/migration/add_user', async (req, res) => {
        const body = req.body;

        /** @type {string|null} */
        const dataRaw = body.data;
        if (dataRaw == null) return res.status(400).json(errorResponse('missing-parameters'));

        try {
            /** @type {UserRow} */
            const data = JSON.parse(dataRaw);

            if (data.Uid == null || data.Role == null || data.Grade == null || data.WhitesWheelNumber == null || data.BlacksWheelNumber == null || data.NIF == null)
                return res.status(401).json(errorResponse('invalid-request'));

            const r = await newUser(data);
            if (r instanceof SqlError) {
                log('Add user:', r.text);
                res.json(errorResponse(r));
            } else {
                infoSuccess(`Add user (${data.NIF}): OK`);
                res.json(successResponse());
            }
        } catch (e) {
            if (e instanceof SqlError)
                error('Could not add user. Error:', e.text);
            else
                error('Could not add user. Error:', e);
            res.status(500).json(errorResponse(e));
        }
    });
    app.post('/v1/migration/finish', async (req, res) => {
        info('Migration has finished. Updating vCards...');
        try {
            await createClient();
            infoSuccess('vCards updated.');
            res.json(successResponse());
        } catch (e) {
            error('Could not update vCards. Error:', e);
            res.json(errorResponse(e));
        }
    });
};
