import fs from 'fs';
import path from "path";

import {__dirname} from '../utils.js';
import {error, info} from "../../cli/logger.js";
import {faker} from "@faker-js/faker";

export const GENERATE_RANDOM_USERNAME = -1000;
export const GENERATE_RANDOM_PASSWORD = -1001;
export const GENERATE_RANDOM_UUID = -1002;

export const ACCEPTS_ALL = -2000;

export const TYPE_STRING = 'string';
export const TYPE_NUMBER = 'number';
export const TYPE_BOOLEAN = 'boolean';

/**
 * @typedef {Object} AcceptsRange
 * @property {number} min
 * @property {number} max
 */

/** @typedef {GENERATE_RANDOM_USERNAME|GENERATE_RANDOM_PASSWORD|GENERATE_RANDOM_UUID} Generator */

/**
 * @typedef {Object} StringConfig
 * @property {string} key
 * @property {TYPE_STRING} type
 * @property {string|Generator|null} generator
 * @property {ACCEPTS_ALL|string[]} accepts
 */

/**
 * @typedef {Object} NumberConfig
 * @property {string} key
 * @property {TYPE_NUMBER} type
 * @property {number|null} generator
 * @property {ACCEPTS_ALL|number[]|AcceptsRange} accepts
 */

/**
 * @typedef {Object} BooleanConfig
 * @property {string} key
 * @property {TYPE_BOOLEAN} type
 * @property {boolean|null} generator
 * @property {ACCEPTS_ALL|boolean} accepts
 */

/**
 * Stores all the available configuration options.
 * @type {(StringConfig|NumberConfig|BooleanConfig)[]}
 */
const KeysAndValues = [
    {key: 'LOG_LEVEL', type: TYPE_STRING, generator: 'warn', accepts: ['debug', 'info', 'warn', 'error']},
    {key: 'DB_USERNAME', type: TYPE_STRING, generator: GENERATE_RANDOM_USERNAME, accepts: ACCEPTS_ALL},
    {key: 'DB_PASSWORD', type: TYPE_STRING, generator: GENERATE_RANDOM_PASSWORD, accepts: ACCEPTS_ALL},
    {key: 'DB_DATABASE', type: TYPE_STRING, generator: 'MiCManager', accepts: ACCEPTS_ALL},
    {key: 'DB_HOSTNAME', type: TYPE_STRING, generator: 'mariadb', accepts: ACCEPTS_ALL},
    {key: 'CALDAV_HOSTNAME', type: TYPE_STRING, generator: 'radicale', accepts: ACCEPTS_ALL},
    {key: 'CALDAV_USERNAME', type: TYPE_STRING, generator: GENERATE_RANDOM_USERNAME, accepts: ACCEPTS_ALL},
    {key: 'CALDAV_PASSWORD', type: TYPE_STRING, generator: GENERATE_RANDOM_PASSWORD, accepts: ACCEPTS_ALL},
    {key: 'CALDAV_AB_UUID', type: TYPE_STRING, generator: GENERATE_RANDOM_UUID, accepts: ACCEPTS_ALL},
    {key: 'CALDAV_DISPLAY_NAME', type: TYPE_STRING, generator: 'MiC Manager', accepts: ACCEPTS_ALL},
    {key: 'CALDAV_DESCRIPTION', type: TYPE_STRING, generator: 'The MiC Manager collection.', accepts: ACCEPTS_ALL},
    {key: 'CALDAV_PORT', type: TYPE_NUMBER, generator: 5232, accepts: ACCEPTS_ALL},
    {key: 'CALDAV_SSL_ENABLE', type: TYPE_BOOLEAN, generator: false, accepts: ACCEPTS_ALL},
    {key: 'BILLING_CYCLE_DAY', type: TYPE_NUMBER, generator: 26, accepts: {min: 1, max: 31}},
    {key: 'BILLING_CYCLE_MONTH', type: TYPE_NUMBER, generator: 4, accepts: {min: 1, max: 12}},
    {key: 'FIREFLY_HOST', type: TYPE_STRING, generator: 'firefly', accepts: ACCEPTS_ALL},
    {key: 'FIREFLY_PORT', type: TYPE_NUMBER, generator: 8080, accepts: ACCEPTS_ALL},
    {key: 'STRIPE_SECRET', type: TYPE_STRING, generator: null, accepts: ACCEPTS_ALL},
];

let loadedConfig;

/**
 * Reads the configuration at the given path, and returns a built object with all the loaded values.
 * Uses `{key}={value}` notation, and `#` for comments.
 * @author Arnau Mora
 * @since 20221201
 * @param {string} path The path where the configuration file is stored at.
 * @returns {Object}
 */
const readConfig = (path) => {
    // Don't do anything if the path doesn't exist
    if (!fs.existsSync(path)) return {};

    // Read the file's contents, and convert the buffer to string
    const raw = fs.readFileSync(path).toString();
    /** @type {[string,string][]} */
    const rows = raw
        // Split lines
        .split('\n')
        // Trim whitespaces
        .map(l => l.trim())
        // Filter all comments and empty lines
        .filter(l => l.length > 0 && !l.startsWith('#'))
        // Parse each line
        .map((line, index) => {
            // Divide the key and the value
            const pieces = line.split('=');
            // If there are not at least two components (value might contain =), drop the load
            if (pieces.length < 2) {
                error(`Invalid configuration at line #${index}:`, line);
                error('Reason: missing required "=".');
                throw Error();
            }
            // The key matches the first element of the split
            const key = pieces[0];
            // The value matches the rest. Note that we use '=' as the glue for join, since split removed the character.
            const value = pieces.slice(1).join('=');
            // Return an entry
            return [key, value]
        });
    // Convert all the entries into an object.
    return Object.fromEntries(rows);
};

/**
 * Checks that a given value matches the predicate of the given accepts.
 * @author Arnau Mora
 * @since 20221201
 * @param {string|number} value
 * @param {ACCEPTS_ALL,string[],number[],AcceptsRange} accepts
 */
const checkValueIntegrity = (value, accepts) => {
    if (accepts === ACCEPTS_ALL) return true;
    if (accepts.hasOwnProperty('min') && accepts.hasOwnProperty('max')) {
        const {min, max} = accepts;
        return value >= min && value <= max;
    }
    return accepts.includes(value);
}

export const load = () => {
    try {
        info('Loading main config file...');
        const configPath = path.join(__dirname, 'micmanager.conf');
        const configData = readConfig(configPath);
        // The configuration stored at the file is loaded correctly. Now set default values for the missing ones, or
        // break if required and no default value exists.

        info('Reading cached config file...');
        const auxConfigPath = path.join(__dirname, '.micmanager.conf');
        const auxConfig = readConfig(auxConfigPath);
        /** @type {Object} */
        const config = {...auxConfig,...configData}; // Place configData second since it has more importance

        info('Checking config data integrity and generating defaults...');
        let generatedKeys = [];
        KeysAndValues.forEach(({key, type, generator, accepts}) => {
            // If value already given, check if type matches
            if (config.hasOwnProperty(key)) {
                /** @type {string|number|boolean} */
                const value = config[key];
                if (type === TYPE_NUMBER) {
                    const int = parseInt(value);
                    if (isNaN(int)) {
                        error(`Invalid configuration for`, key);
                        error('Reason: expected type', type, 'and got NaN');
                    }
                } else if (type === TYPE_BOOLEAN) {
                    const valid = ['true','false','0','1','yes','no'].includes(value.toString().toLowerCase());
                    if (!valid) {
                        error(`Invalid configuration for`, key);
                        error('Reason: expected a boolean value and got', value);
                    }
                } else if (typeof value !== type) {
                    error(`Invalid configuration for`, key);
                    error('Reason: expected type', type, 'and got', typeof value);
                    throw Error();
                }
                if (!checkValueIntegrity(value, accepts)) {
                    error(`Invalid configuration for`, key);
                    error(`Reason: the value "${value}" doesn't match the given predicate:`, accepts);
                    throw Error();
                }
            } else {
                // If no value given, generate one, or drop
                generatedKeys.push(key);
                switch (generator) {
                    case GENERATE_RANDOM_USERNAME:
                        config[key] = faker.internet.userName();
                        break;
                    case GENERATE_RANDOM_PASSWORD:
                        config[key] = faker.internet.password(32);
                        break;
                    case GENERATE_RANDOM_UUID:
                        config[key] = faker.datatype.uuid();
                        break;
                    case null:
                    case undefined:
                        error(`Invalid configuration for`, key);
                        error(`Reason: the field is required, and any value has been set.`);
                        throw Error();
                    default:
                        config[key] = generator;
                        break;
                }
            }
        });

        info('Storing generated values...');
        const existingAux = fs.existsSync(auxConfigPath) ? fs.readFileSync(auxConfigPath).toString() : '';
        fs.writeFileSync(
            auxConfigPath,
            [existingAux, ...generatedKeys.map(key => key + '=' + config[key])]
                .join('\n'),
        );

        loadedConfig = config;

        info('Exporting config to environment...');
        for (const key in config) process.env[key] = config[key];

        return true;
    } catch (e) {
        process.exit(1);
        return false;
    } finally {
        info('Log level:', process.env.LOG_LEVEL);
    }
};

export const get = (key) => {

};
