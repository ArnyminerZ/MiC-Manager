import http from 'http';
import fs from "fs";

import {error, infoSuccess, log} from "../../cli/logger.js";

import packageJson from '../../package.json' assert {type: 'json'};

const fireflyTokenFile = process.env.FIREFLY_TOKEN_FILE;

/**
 * @typedef {Object} FireflyAbout
 * @property {{version:string,api_version:string,php_version:string,os:string,driver:string}} data
 */

/**
 * @typedef {Object} FireflyUserAttributes
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} email
 * @property {boolean} blocked
 * @property {string|null} blocked_code
 * @property {'owner'|string} role
 */

/**
 * @typedef {Object} FireflyAboutUser
 * @property {{type:string,id:string,attributes:FireflyUserAttributes}} data
 * @property {{'0':Object,self:string}[]} links
 */

const getToken = () => fs.readFileSync(fireflyTokenFile).toString('utf8');

const request = (method, endpoint, body) => new Promise((resolve, reject) => {
    const req = http.request({
        protocol: 'http:',
        host: process.env.FIREFLY_HOST,
        port: parseInt(process.env.FIREFLY_PORT),
        path: `/api/v1${endpoint}`,
        method,
        headers: {
            'Accept': 'application/vnd.api+json',
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
            'Content-Length': body != null ? Buffer.byteLength(body) : 0,
            'User-Agent': `MiC-Manager ${packageJson.version}`,
        },
    }, response => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('error', err => reject(err));
        response.on('end', () => {
            const statusCode = response.statusCode;
            try {
                const json = JSON.parse(data);
                if (statusCode >= 200 && statusCode < 300)
                    resolve(json);
                else
                    reject(`Error ${statusCode}: ${response.statusMessage}. Data: ${JSON.stringify(json)}`);
            } catch (e) {
                if (e instanceof SyntaxError)
                    reject(`Could not parse JSON response. Raw: ${data}`);
                else
                    reject(e);
            }
        });
    });
    if (body != null) req.write(body);

    log(`Firefly ${req.method} > ${req.protocol}//${req.host}${req.path}`);
    req.end();
});

/**
 * Runs a GET request to the Firefly API.
 * @author Arnau Mora
 * @since 20221120
 * @param {string} endpoint The endpoint to target. Excluding `/api/v1`, but must start with `/`.
 * @returns {Promise<Object|Array|{data:Object}>}
 */
const get = endpoint => request('GET', endpoint, null);

/**
 * Checks that the Firefly instance is correctly configured and running.
 * @author Arnau Mora
 * @since 20221120
 * @returns {Promise<boolean>}
 */
export const check = async () => {
    try {
        // Check that the token is valid
        const token = getToken();
        if (token.length <= 0 || !token.startsWith('ey')) {
            error('Check the Firefly token file, or the environment variable.');
            process.exit(1);
        }
        if (/.*[\n\r ]$/.test(token)) {
            error('Please, make sure there are no line breaks nor whitespaces at the end of the Firefly token.');
            process.exit(1);
        }
        infoSuccess('Firefly token is valid.');

        // Check that the instance is running
        // noinspection JSValidateTypes
        /** @type {FireflyAbout} */
        const fireflyInfo = await get('/about');
        infoSuccess('Firefly is available. Version:', fireflyInfo.data.version);

        // Check that the user is the owner.
        // noinspection JSValidateTypes
        /** @type {{data:FireflyAboutUser}} */
        const userInfo = await get('/about/user');
        const role = userInfo.data?.attributes?.role;
        const blocked = userInfo.data?.attributes?.blocked;
        if (role != null && role === 'owner' && !blocked)
            infoSuccess('Firefly User is properly configured.');
        else {
            error('Firefly user is not valid. Role:', role, 'blocked:', blocked);
            process.exit(1);
        }
    } catch (e) {
        error('Firefly is not configured properly. Error:', e);
        process.exit(1);
    }
};
