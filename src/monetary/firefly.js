import http from 'http';
import fs from "fs";

import {error, info, infoSuccess, log, warn} from "../../cli/logger.js";

import packageJson from '../../package.json' assert {type: 'json'};
import {getAllUsers as getAllRegisteredUsers} from "../data/users.js";
import {UserNotFoundException} from "../exceptions.js";

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
 * @typedef {Object} FireflyUserData
 * @property {string} type
 * @property {string} id
 * @property {FireflyUserAttributes} attributes
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
 * @param {'GET','POST','PUT','DELETE',string} method
 * @param {string} endpoint
 * @param {Object|null} body
 * @param {URLSearchParams|null} searchParams
 * @param {boolean} isJson If the response is JSON
 * @return {Promise<Object|Array|{data:Object|Object[]}|string>}
 */
const request = (method, endpoint, body, searchParams = null, isJson = true) => new Promise((resolve, reject) => {
    const req = http.request({
        protocol: 'http:',
        host: process.env.FIREFLY_HOST,
        port: parseInt(process.env.FIREFLY_PORT),
        path: `/api/v1${endpoint}`,
        method,
        searchParams,
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
                if (!isJson) return resolve(data);

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
 * @param {URLSearchParams|null} searchParams Parameters to append as query.
 * @returns {Promise<Object|Array|{data:Object|Object[]}>}
 */
const get = (endpoint, searchParams = null) => request('GET', endpoint, null, searchParams);

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
        /** @type {{data:FireflyUserData}} */
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
                // noinspection JSCheckFunctionSignatures
                await newAccount(
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

        // Check that all users have accounts
        const accountsList = await getAccounts();
        let checkedAccounts = [], checkedUsers = [];
        try {
            const dbUsers = await getAllRegisteredUsers();
            info('There are', dbUsers.length, 'registered users. Checking that all of them are registered in Firefly...');
            const fireflyUsers = await getAllUsers();
            for (/** @type {UserData} */ let user of dbUsers) {
                /** @type {FireflyUserData|null} */
                const fireflyUser = fireflyUsers.find(entry => entry.attributes.email === user.Email);
                if (fireflyUser == null) {
                    log('Registering user', user.Id, 'in Firefly...');
                    const userResult = await newUser(user.Email, user.NIF);
                    checkedUsers.push(userResult);
                } else
                    checkedUsers.push(fireflyUser.id);
                const userAccount = accountsList.find(entry => entry.attributes.name.endsWith(user.NIF));
                if (userAccount == null) {
                    log('Creating account for user', user.Id, 'in Firefly...');
                    const accountResult = await newAccount({
                        name: `User - ${user.NIF}`,
                        type: 'liability',
                        account_role: 'sharedAsset',
                        liability_type: 'debt',
                        liability_direction: 'debit',
                        interest: '0',
                        interest_period: 'quarterly',
                        notes: `Contact email: ${user.Email}.`,
                    });
                    checkedAccounts.push(accountResult.data.id);
                } else
                    checkedAccounts.push(userAccount.id);
            }
            infoSuccess('All the users are available in Firefly.');
        } catch (e) {
            if (e instanceof UserNotFoundException)
                info('There are no registered users. Skipping Firefly check.');
            else {
                error('Could not get users list. Error:', e);
                process.exit(1);
            }
        }

        info('Searching for dangling Firefly users...');
        const fireflyUsers = await getAllUsers();
        for (/** @type {FireflyUserData} */ let user of fireflyUsers) {
            if (user.attributes.role === 'owner') continue;
            if (checkedUsers.includes(user.id)) continue;
            warn(`There's a loose user. ID=${user.id}. Deleting...`);
            try {
                await request('DELETE', `/users/${user.id}`, null, null, false);
                infoSuccess('Deleted user', user.id, 'successfully.');
            } catch (e) {
                error(`Could not delete dangling user #${user.id}. Error:`, e);
            }
        }

        info('Searching for loose Firefly accounts...');
        for (/** @type {FireflyAccountData} */ let account of accountsList) {
            if (!account.attributes.name.startsWith('User')) continue;
            if (checkedAccounts.includes(account.id)) continue;
            warn(`There's a loose account. ID=${account.id}. Deleting...`);
            try {
                await request('DELETE', `/accounts/${account.id}`, null, null, false);
                infoSuccess('Deleted account', account.id, 'successfully.');
            } catch (e) {
                error(`Could not delete loose account #${account.id}. Error:`, e);
            }
        }
    } catch (e) {
        error('Firefly is not configured properly. Error:', e);
        process.exit(1);
    }
};

/**
 * Gets all the registered accounts.
 * @author Arnau Mora
 * @since 20221121
 * @return {Promise<FireflyAccountData[]>}
 */
const getAccounts = async () => {
    /** @type {FireflyAccountData[]} */
    let accounts = [];
    let page = 0, result;
    do {
        page++;
        /** @type {FireflyAccountData[]} */
        result = await get('/accounts', new URLSearchParams([['page', page]]));
        accounts.push(...result.data);
    } while (result['meta']['pagination']['current_page'] < result['meta']['pagination']['total_pages']);
    return accounts;
};

/**
 * Creates a new account.
 * @author Arnau Mora
 * @since 20221121
 * @param {FireflyAccountData} data
 * @return {Promise<{data:FireflyAccountData}>}
 */
const newAccount = async data => await post('/accounts', data);

/**
 * Creates a new user in the accounting software.
 * @author Arnau Mora
 * @since 20221121
 * @param {string} email The email to give to the user.
 * @param {string} nif The nif of the user.
 * @return {Promise<number>} The created user's UID.
 */
export const newUser = async (email, nif) => {
    log('Registering a new Firefly user...');
    // noinspection JSValidateTypes
    /** @type {{data:FireflyUserData}} */
    const result = await post('/users', {email, blocked: true, blocked_code: 'email_changed'});
    log('Creating account for Firefly user', result.data.id);
    await newAccount({
        name: `User - ${nif}`,
        type: 'liability',
        account_role: 'sharedAsset',
        liability_type: 'debt',
        liability_direction: 'debit',
        interest: '0',
        interest_period: 'quarterly',
        notes: `Contact email: ${email}.`,
    });
    return parseInt(result.data.id);
};

/**
 * Returns an array of all the Firefly registered users.
 * @author Arnau Mora
 * @since 20221121
 * @return {Promise<FireflyUserData[]>}
 */
export const getAllUsers = async () => {
    /** @type {FireflyUserData[]} */
    let users = [];
    let page = 0, result;
    do {
        page++;
        result = await get('/users', new URLSearchParams([['page', page]]));
        users.push(...result.data);
    } while (result['meta']['pagination']['current_page'] < result['meta']['pagination']['total_pages']);
    return users;
};

/**
 * Searches for a user in Firefly.
 * @author Arnau Mora
 * @since 20221121
 * @param {string} email The email of the user.
 * @return {Promise<FireflyUserData|null>}
 */
export const findUser = async (email) => {
    // Get all the users
    const users = await getAllUsers();
    // Search for the desired one
    return users.find(entry => entry.attributes.email === email);
};
