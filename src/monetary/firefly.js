import http from 'http';
import fs from "fs";

import {info} from "../../cli/logger.js";

const fireflyTokenFile = process.env.FIREFLY_TOKEN_FILE;

const getToken = () => fs.readFileSync(fireflyTokenFile);

/**
 * Runs a GET request to the Firefly API.
 * @author Arnau Mora
 * @since 20221120
 * @param {string} endpoint The endpoint to target. Excluding `/api/v1`, but must start with `/`.
 * @returns {Promise<Object,Array>}
 */
const get = (endpoint) => new Promise((resolve, reject) => {
    http.request({
        protocol: 'http:',
        host: process.env['FIREFLY_HOST'],
        port: process.env['FIREFLY_PORT'],
        path: `/api/v1${endpoint}`,
        headers: {
            'Accept': 'application/vnd.api+json',
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
        },
    }, response => {
        let data = '';
        response.on("data", chunk => data += chunk);
        response.on('error', err => reject(err));
        response.on('end', () => {
            const json = JSON.parse(data);
            resolve(json);
        });
    });
});

/**
 * Checks that the Firefly instance is correctly configured and running.
 * @author Arnau Mora
 * @since 20221120
 * @returns {Promise<boolean>}
 */
export const check = async () => {
    // Simply check that the instance is running
    const fireflyInfo = await get('/about');
    info('Firefly Info:', fireflyInfo);

    // Check that the user is the owner.
    const userInfo = await get('/about/user');
    if (!userInfo.hasOwnProperty('data') || userInfo.data.hasOwnProperty('attributes')) {

    }
};
