import http from "http";
import fs from "fs";
import path from "path";
import assert from "node:assert/strict";

import {create as createServer} from '../src/server/init.mjs'
import {HttpRequestError, InvalidContentTypeError} from "../src/server/errors.mjs";
import {__dirname} from "../src/utils.mjs";

/**
 * Makes a request to the server running on localhost at port 3000, targeting the given `path`.
 * @param {string} path The path to make the request to.
 * @param {?(string,Buffer,Uint8Array)} body The request body or `null`.
 * @param {string} method The method to use for making the request.
 * @return {Promise<string>}
 */
const request = (path, body = null, method = 'GET') => new Promise((resolve, reject) => {
    // console.debug('Making', method, 'request to', path);

    const options = {
        method,
        protocol: 'http:',
        host: 'localhost',
        port: 3000,
        path,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': body != null ? Buffer.byteLength(body) : 0,
        }
    };

    const req = http.request(options, res => {
        const {statusCode, statusMessage} = res;
        const contentType = res.headers['content-type'];

        let error;
        // Any 2xx status code signals a successful response but
        // here we're only checking for 200.
        if (statusCode !== 200)
            error = new HttpRequestError(statusMessage, statusCode);
        else if (!/^application\/json/.test(contentType))
            error = new InvalidContentTypeError(contentType, 'application/json');
        if (error) return reject(error);

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => rawData += chunk);
        res.on('end', () => resolve(rawData));
    });
    req.on('error', err => reject(err));
    if (body != null) req.write(body);
    req.end();
})

describe('API Testing', function () {
    this.timeout(30_000);

    /** @type {import(http).Server} */
    let server;
    before('Create server', (done) => {
        const app = createServer();
        console.log('Starting to listen on 3000...');
        server = app.listen(3000, done);
    });

    describe('Registration', () => {
        it('Empty register request throws error', async function () {
            await assert.rejects(request('/v1/auth/register'), { name: 'HttpRequestError' });
        });

        const newUserFile = path.join(__dirname, 'samples', 'new-user.json');
        const newUserBodyRaw = fs.readFileSync(newUserFile).toString();

        it('Check invalid combinations', async function () {
            const newUserBody = JSON.parse(newUserBodyRaw);
            let dyn;
            for (const key of Object.keys(newUserBody)) {
                dyn = newUserBody;
                delete dyn[key];
                await assert.rejects(request('/v1/auth/register', JSON.stringify(dyn)), { name: 'HttpRequestError' });
            }
        });

        it('Correct request get accepted', async function () {
            await assert.ok(request('/v1/auth/register', newUserBodyRaw));
        });

        it('Trying to register again throws error', async function () {
            // Now user already exists, so an error should be thrown
            await assert.rejects(request('/v1/auth/register', newUserBodyRaw), { name: 'HttpRequestError' });
        });
    });

    after('Stop server', async () => await new Promise((resolve, reject) => {
        if (server == null) resolve();

        console.log('Closing server...');
        server.close((err) => {
            if (err != null) reject(err);
            else resolve();
        });
    }));
});
