import http from 'http';
import fs from "fs";
import fsp from "fs/promises";
import puppeteer from "puppeteer";
import path from "path";

import {error, info, infoSuccess, log, warn} from "../../cli/logger.js";

import packageJson from '../../package.json' assert {type: 'json'};
import {getAllUsers as getAllRegisteredUsers} from "../data/users.js";
import {UserNotFoundException} from "../exceptions.js";
import {delay, pathExists} from "../utils.mjs";

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
const getToken = () => fs.readFileSync(process.env.FIREFLY_TOKEN_FILE).toString('utf8');

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
    /** @type {[string,*][]} */
    const bodyEntries = body != null ? [...Object.entries(body)]
            .map(function ([key, value], index) {
                if (value instanceof Date)
                    return [key, `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1, 2)}-${pad(value.getUTCDate(), 2)}`];
                else
                    return [key, value];
            })
        : null;
    const newBody = bodyEntries != null ? Object.fromEntries(bodyEntries) : null;
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
            'Content-Length': newBody != null ? Buffer.byteLength(JSON.stringify(newBody)) : 0,
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
    if (newBody != null) req.write(JSON.stringify(newBody));

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
 * Initializes the Firefly server, and fetches the default access token.
 * @author Arnau Mora
 * @since 20221212
 * @param {string} email The email to give to the default user.
 * @param {string} password The password to give to the default user.
 * @param {string} secretsDir The directory where all the secrets are stored.
 * @param {?string>} screenshotsDir The directory where to store screenshots. Can be null, and no screenshots will
 * be made.
 * @param {'http:','https:'} protocol The protocol to use for making the requests.
 * @param {string} hostname The hostname associated with the Firefly server.
 * @param {string|number} port The port number of the Firefly server.
 */
export const configure = async (
    email,
    password,
    secretsDir,
    screenshotsDir = null,
    protocol = 'http:',
    hostname = process.env.FIREFLY_HOST,
    port = process.env.FIREFLY_PORT,
) => {
    const tokenFile = path.join(secretsDir, 'firefly-token.txt');

    if (await pathExists(tokenFile))
        return log('Won\'t configure Firefly since already loaded.');

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const fireflyServer = `${protocol}//${hostname}:${port}`;

    info('Configuring Firefly server on', fireflyServer);

    // noinspection JSCheckFunctionSignatures
    if (screenshotsDir != null && !(await pathExists(screenshotsDir))) await fsp.mkdir(screenshotsDir);

    const takeScreenshot = async name => {
        if (screenshotsDir != null) {
            const screenshotPath = path.join(screenshotsDir, `${name}.jpg`);
            if (await pathExists(screenshotPath)) await fsp.rm(screenshotPath);
            await page.screenshot({path: screenshotPath});
        }
    };

    const waitAndClick = async (selector) => {
        await page.waitForSelector(selector);
        await page.click(selector);
    };
    const waitAndType = async (selector, text) => {
        await page.waitForSelector(selector);
        await page.type(selector, text);
    };

    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(`${fireflyServer}/register`);

    await page.waitForSelector('form');
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);
    await page.type('input[name="password_confirmation"]', password);
    await takeScreenshot('registration');
    await page.click('button');
    await page.waitForNavigation();

    await page.goto(`${fireflyServer}/login`);
    await page.goto(`${fireflyServer}/profile`);

    await takeScreenshot('profile');

    await waitAndClick('.nav.nav-tabs li:nth-of-type(3)');
    await waitAndClick('#oauth div:has(> #modal-create-token) a.btn');

    await page.waitForSelector('#modal-create-token[style="display: block;"]');
    await delay(200);
    await waitAndType('#modal-create-token input[name="name"]', 'MiC-Manager');
    await takeScreenshot('create_token_modal');
    await waitAndClick('#modal-create-token .btn-primary');

    await page.waitForSelector('#modal-access-token[style="display: block;"]');
    await delay(200);
    await takeScreenshot('token_modal');
    const token = await page.evaluate(selector => document.querySelector(selector).value, '#modal-access-token textarea');

    // await page.click('Create new token');
    await fsp.writeFile(tokenFile, token)

    await browser.close()
};

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
            infoSuccess('Firefly Owner User is properly configured.');
        else {
            error('Firefly owner user is not valid. Role:', role, 'blocked:', blocked);
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
                        opening_balance_date: `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`,
                    },
                );
                infoSuccess('Created default account successfully.');
            } catch (e) {
                error('Could not create the default account. Error:', e);
                process.exit(1);
            }
        }

        // Check that all users have accounts
        let accountsList = await getAccounts();
        const /** @type {number[]} */ checkedAccounts = [];
        const /** @type {number[]} */ checkedUsers = [];
        try {
            const dbUsers = await getAllRegisteredUsers();
            info('There are', dbUsers.length, 'registered users. Checking that all of them are registered in Firefly...');

            const fireflyUsers = await getAllUsers(true);
            for (/** @type {UserData} */ let user of dbUsers) {
                /** @type {FireflyUserData|null} */
                const fireflyUser = fireflyUsers.find(entry => entry.attributes.email === user.Email);
                if (fireflyUser == null) try {
                    log('Registering user', user.Id, `(${user.Email}) in Firefly...`);
                    const createdUser = await newUser(user.Email, user.NIF);
                    accountsList = await getAccounts(); // Update accounts list after adding user
                    checkedUsers.push(
                        parseInt(createdUser.id)
                    );
                } catch (e) {
                    error('Could not create user', user.Id, 'Error:', e);
                    continue
                } else
                    checkedUsers.push(
                        parseInt(fireflyUser.id)
                    );

                const userAccount = accountsList.find(entry => entry.attributes.name.endsWith(user.NIF));
                if (userAccount == null)
                    try {
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
                        checkedAccounts.push(
                            parseInt(accountResult.data.id)
                        );
                    } catch (e) {
                        error('Could not create account for user', user.Id, 'Error:', e);
                    }
                else
                    checkedAccounts.push(
                        parseInt(userAccount.id)
                    );
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

        log('Checked users:', checkedUsers);
        info('Searching for dangling Firefly users...');
        const fireflyUsers = await getAllUsers(true);
        for (/** @type {FireflyUserData} */ let user of fireflyUsers) {
            if (user.attributes.role === 'owner') continue;
            const userId = parseInt(user.id);
            if (checkedUsers.includes(userId)) continue;
            warn(`There's a loose user. ID=${user.id}. Deleting...`);
            try {
                await request('DELETE', `/users/${user.id}`, null, null, false);
                infoSuccess('Deleted user', user.id, 'successfully.');
            } catch (e) {
                error(`Could not delete dangling user #${user.id}. Error:`, e);
            }
        }

        log('Checked accounts:', checkedAccounts);
        info('Searching for loose Firefly accounts...');
        for (/** @type {FireflyAccountData} */ let account of accountsList) {
            if (!account.attributes.name.startsWith('User')) continue;
            if (checkedAccounts.includes(parseInt(account.id))) continue;
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
 * @return {Promise<FireflyUserData>} The created user's UID.
 */
export const newUser = async (email, nif) => {
    log('Registering a new Firefly user...');
    // noinspection JSValidateTypes
    /** @type {{data:FireflyUserData}} */
    const result = await post('/users', {email, blocked: true, blocked_code: 'email_changed'});

    // Add account only if it doesn't exist
    const accounts = await getAccounts();
    const accountName = `User - ${nif}`;
    const userAccount = accounts.find(entry => entry.attributes.name === accountName);
    if (userAccount == null) {
        log('Creating account for Firefly user', result.data.id);
        await newAccount({
            name: accountName,
            type: 'liability',
            account_role: 'sharedAsset',
            liability_type: 'debt',
            liability_direction: 'debit',
            interest: '0',
            interest_period: 'quarterly',
            notes: `Contact email: ${email}.`,
        });
    }

    infoSuccess('Created user', result.data.id, 'on Firefly. Email:', email);
    return result.data;
};

/**
 * Returns an array of all the Firefly registered users.
 * @author Arnau Mora
 * @since 20221121
 * @param {boolean} ignoreOwner If true, the owner user won't be included in the list.
 * @return {Promise<FireflyUserData[]>}
 */
export const getAllUsers = async (ignoreOwner = false) => {
    /** @type {FireflyUserData[]} */
    let users = [];
    let page = 0, result;
    do {
        page++;
        result = await get('/users', new URLSearchParams([['page', page]]));
        users.push(...result.data);
    } while (result['meta']['pagination']['current_page'] < result['meta']['pagination']['total_pages']);

    return ignoreOwner ? users.filter(user => user.attributes.role !== 'owner') : users;
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
