import https from "https";
import {error, warn} from "../../cli/logger.js";
import {ParseException} from "../exceptions.js";

/**
 * Fetches the latest available version from the Github API.
 * @author Arnau Mora
 * @since 20221208
 * @returns {Promise<string|null>} The latest available version
 */
export const getLatestRelease = () => new Promise((resolve, reject) => {
    const req = https.get({
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
        res.on('error', err => reject(err));
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
                    reject(new ParseException('Could not parse latest version JSON:' + json));
                else
                    reject(e);
            }
        });
    });
    req.on('error', err => reject(err));
});