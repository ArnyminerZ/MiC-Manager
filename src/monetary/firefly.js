import http from 'http';
import fs from "fs";

import {error, info, infoSuccess, log} from "../../cli/logger.js";

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

/**
 * @typedef {Object} FireflyConfigurationOption
 * @property {string} title
 * @property {string|boolean} value
 * @property {boolean} editable
 */

/**
 * @typedef {Object} FireflyAccountAttributes
 * @property {string} created_at
 * @property {string} updated_at
 * @property {boolean|true} active
 * @property {number?} order
 * @property {string} name
 * @property {'asset','expense','import','revenue','cash','liability','liabilities','initial-balance','reconciliation'} type
 * @property {'defaultAsset','sharedAsset','savingAsset','ccAsset','cashWalletAsset',null} account_role
 * @property {number} currency_id
 * @property {number} currency_code
 * @property {string} currency_symbol
 * @property {number} currency_decimal_places
 * @property {string} current_balance
 * @property {string} current_balance_date
 * @property {string,null} iban
 * @property {string,null} bic
 * @property {string,null} account_number
 * @property {string,null} opening_balance
 * @property {string} current_debt
 * @property {string} opening_balance_date
 * @property {string} virtual_balance
 * @property {boolean,true} include_net_worth
 * @property {'monthlyFull',null} credit_card_type
 * @property {string} monthly_payment_date
 * @property {'loan','debt','mortgage',null} liability_type
 * @property {'credit','debit',null} liability_direction
 * @property {string,null} interest
 * @property {'credit','debit',null} interest_period
 * @property {string,null} notes
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} zoom_level
 */

/**
 * @typedef {Object} FireflyAccountData
 * @property {'accounts'} type
 * @property {string} id
 * @property {FireflyAccountAttributes} attributes
 */

/**
 * Fetches the Firefly token currently stored. Requires a prior check for `FIREFLY_TOKEN_FILE` to be set.
 * @author Arnau Mora
 * @since 20211121
 * @return {string}
 */
const getToken = () => fs.readFileSync(fireflyTokenFile).toString('utf8');

/**
 * Makes a http request to the Firefly server.
 * @author Arnau Mora
 * @since 20221121
 * @param {'GET','POST','PUT',string} method
 * @param {string} endpoint
 * @param {Object|null} body
 * @return {Promise<Object|Array|{data:Object|Object[]}>}
 */
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
            'Content-Length': body != null ? Buffer.byteLength(JSON.stringify(body)) : 0,
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
    if (body != null) req.write(JSON.stringify(body));

    log(`Firefly ${req.method} > ${req.protocol}//${req.host}${req.path}`);
    req.end();
});

/**
 * Runs a GET request to the Firefly API.
 * @author Arnau Mora
 * @since 20221120
 * @param {string} endpoint The endpoint to target. Excluding `/api/v1`, but must start with `/`.
 * @returns {Promise<Object|Array|{data:Object|Object[]}>}
 */
const get = endpoint => request('GET', endpoint, null);

/**
 * Runs a POST request to the Firefly API.
 * @author Arnau Mora
 * @since 20221121
 * @param {string} endpoint The endpoint to target. Excluding `/api/v1`, but must start with `/`.
 * @param {Object} body The request body to be sent.
 * @returns {Promise<Object|Array|{data:Object|Object[]}>}
 */
const post = (endpoint, body) => request('POST', endpoint, body);

/**
 * Runs a PUT request to the Firefly API.
 * @author Arnau Mora
 * @since 20221121
 * @param {string} endpoint The endpoint to target. Excluding `/api/v1`, but must start with `/`.
 * @param {Object} body The request body to be sent.
 * @returns {Promise<Object|Array|{data:Object|Object[]}>}
 */
const put = (endpoint, body) => request('PUT', endpoint, body);

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

        // Check proper configuration
        // noinspection JSValidateTypes
        /** @type {FireflyConfigurationOption} */
        const configuration = (await get('/configuration/configuration.single_user_mode')).data;
        if (configuration.value === true) {
            info('Single user mode is enabled for Firefly, disabling...');
            try {
                await put('/configuration/configuration.single_user_mode', {value: false});
            } catch (e) {
                error('Could not disable Single User Mode. Error:', e);
                process.exit(1);
            }
        }

        // Check that there's at least one registered account for the owner
        /** @type {FireflyAccountData[]} */
        const accounts = (await get('/accounts')).data;
        if (accounts.length <= 0) {
            info('There are no accounts created. Creating a default one...');
            const now = new Date();
            try {
                // TODO: Localize name
                await post(
                    '/accounts',
                    {
                        name: 'Default account',
                        type: 'asset',
                        account_role: 'defaultAsset',
                        opening_balance: '0.0',
                        opening_balance_date: `${now.getUTCFullYear()}/${now.getUTCMonth()}/${now.getUTCDate()}`,
                    },
                );
                infoSuccess('Created default account successfully.');
            } catch (e) {
                error('Could not create the default account. Error:', e);
                process.exit(1);
            }
        }
    } catch (e) {
        error('Firefly is not configured properly. Error:', e);
        process.exit(1);
    }
};

/**
 * Creates a new user in the accounting software.
 * @author Arnau Mora
 * @since 20221121
 * @param {string} email The email to give to the user.
 * @return {Promise<number>} The created user's UID.
 */
export const newUser = async email => {
    log('Registering a new Firefly user...');
    // noinspection JSValidateTypes
    /** @type {FireflyAboutUser} */
    const result = await post('/users', {email, blocked: true, blocked_code: 'email_changed'});
    return parseInt(result.data.id);
};
