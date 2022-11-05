import {log, warn} from "../../cli/logger.js";
import {errorResponse, successResponse} from "../response.js";
import {newCard} from "../request/caldav.js";
import {ParseException} from "../exceptions.js";

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
};
