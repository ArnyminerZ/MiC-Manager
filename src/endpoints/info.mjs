import {dbInfo} from "../request/database.js";
import {decodeToken} from "../security.js";
import {errorResponse, successResponse} from "../response.js";
import {hasPermission} from "../permissions.js";
import packageJson from "../../package.json" assert {type: 'json'};
import {getLatestRelease} from "../info/release.js";
import {error} from "../../cli/logger.js";
import {compare as compareVersion} from "compare-versions";

export const infoEndpoints = async (req, res) => {
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
        let latestRelease;
        try {
            latestRelease = await getLatestRelease();
        }catch (err) {
            error('Could not get latest version information. Error:', err);
        }
        const newVersion = latestRelease != null ? compareVersion(latestRelease, version, '>') : null;
        res.json(successResponse({database, version: {name: version, update: newVersion}}));
    } catch (e) {
        error('Could not get version information. Error:', e);
        return res.status(500).send(errorResponse(e instanceof Error ? e.toString() : e));
    }
};