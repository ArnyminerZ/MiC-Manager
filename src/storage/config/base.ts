import fs from 'fs';
import path from 'path';

import {__dirname, merge} from '../../utils';
import {info, log} from "../../../cli/logger";
import {faker} from "@faker-js/faker";
import {ConfigurationParseError, IllegalConfigParameterError, MissingConfigParameterError} from "../../errors";
import {
    ACCEPTS_ALL,
    AcceptsRange,
    Generator,
    instanceOfTypeFile,
    KeysAndValues,
    TYPE_BOOLEAN,
    TYPE_NUMBER,
} from "./config";

let loadedConfig;

/**
 * Reads the configuration at the given path, and returns a built object with all the loaded values.
 *
 * Uses `{key}={value}` notation, and `#` for comments.
 *
 * Returns empty if the `path` doesn't exist.
 * @author Arnau Mora
 * @since 20221201
 * @param path The path where the configuration file is stored at.
 * @throws {ConfigurationParseError} If there's an invalid line in the given configuration file.
 */
function readConfig(path: string): Map<string, string> {
    // Don't do anything if the path doesn't exist
    if (!fs.existsSync(path)) return new Map<string, string>();

    // Read the file's contents, and convert the buffer to string
    const raw = fs.readFileSync(path).toString();
    /** @type {[string,string][]} */
    const rows: [string, string][] = raw
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
            if (pieces.length < 2)
                throw new ConfigurationParseError(index, line, 'Reason: missing required "=".');
            // The key matches the first element of the split
            const key = pieces[0];
            // The value matches the rest. Note that we use '=' as the glue for join, since split removed the character.
            const value = pieces.slice(1).join('=');
            // Return an entry
            return [key, value]
        });
    // Convert all the entries into an object.
    return new Map<string, string>(rows);
}

/**
 * Checks that a given value matches the predicate of the given accepts.
 * @author Arnau Mora
 * @since 20221201
 */
function checkValueIntegrity(value: string | number, accepts: typeof ACCEPTS_ALL | string[] | number[] | AcceptsRange): Boolean {
    if (accepts === ACCEPTS_ALL) return true;
    if (accepts.hasOwnProperty('min') && accepts.hasOwnProperty('max')) {
        const {min, max} = accepts as AcceptsRange;
        return value >= min && value <= max;
    }
    return (accepts as (string | number)[]).includes(value);
}

/**
 * Loads all the configuration parameters from `micmanager.conf`. Creates `.micmanager.conf` with all the missing
 * parameters. Returns the success status of the request.
 * @throws {ConfigurationParseError} If there's an invalid line in a configuration file.
 * @throws {IllegalConfigParameterError} If there's an invalid configuration parameter. This can be a wrong type, or a
 * non-existing file, for example. Error will tell more information.
 * @throws {MissingConfigParameterError} If a required configuration parameter is missing.
 */
export function loadConfig() {
    info('Loading configuration...');

    log('Loading main config file...');
    const configPath = path.join(__dirname, 'micmanager.conf');
    const configData = readConfig(configPath);
    // The configuration stored at the file is loaded correctly. Now set default values for the missing ones, or
    // break if required and no default value exists.

    log('Reading cached config file...');
    const auxConfigPath = path.join(__dirname, '.micmanager.conf');
    const auxConfig = readConfig(auxConfigPath);

    const config: Map<string, string | number | boolean> = merge(auxConfig, configData); // Place configData second since it has more importance

    log('Checking config data integrity and generating defaults...');
    let generatedKeys: string[] = [];
    for (const {key, type, generator, accepts} of KeysAndValues) {
        // If value already given, check if type matches
        if (config.hasOwnProperty(key)) {
            const value: string | number | boolean = config.get(key) as (string | number | boolean);
            if (type === TYPE_NUMBER) {
                const int = parseInt(value as string);
                if (isNaN(int))
                    throw new IllegalConfigParameterError(key, `Expected type ${type} and got NaN`);
            } else if (type === TYPE_BOOLEAN) {
                const valid = ['true', 'false', '0', '1', 'yes', 'no'].includes(value.toString().toLowerCase());
                if (!valid)
                    throw new IllegalConfigParameterError(key, `Expected a boolean value and got ${value}`);
            } else if (instanceOfTypeFile(type)) { // TYPE_FILE
                const fullPath = path.join(__dirname, type.baseDir, value as string);

                // Touch file if property touch is true
                if (type['touch']) {
                    log('Touching file for config:', fullPath);
                    const fd = fs.openSync(fullPath, 'a');
                    fs.closeSync(fd);
                }

                const valid = fs.existsSync(fullPath);
                if (!valid)
                    throw new IllegalConfigParameterError(key, `The given file does not exist. Path: ${fullPath}`);
            } else if (typeof value !== type)
                throw new IllegalConfigParameterError(key, `Expected type ${type} and got ${typeof value}`);
            if (!checkValueIntegrity(value as (string | number), accepts))
                throw new IllegalConfigParameterError(key, `The value "${value}" doesn't match the given predicate: ${accepts}`);
        } else {
            // If no value given, generate one, or drop
            generatedKeys.push(key);
            switch (generator) {
                case Generator.GENERATE_RANDOM_USERNAME:
                    config.set(key, faker.internet.userName());
                    break;
                case Generator.GENERATE_RANDOM_PASSWORD:
                    config.set(key, faker.internet.password(32));
                    break;
                case Generator.GENERATE_RANDOM_UUID:
                    config.set(key, faker.datatype.uuid());
                    break;
                case null:
                case undefined:
                    throw new MissingConfigParameterError(key, 'The field is required, but any value has been set.');
                default:
                    config.set(key, generator);
                    break;
            }
        }
    }

    log('Storing generated values...');
    const existingAux = fs.existsSync(auxConfigPath) ? fs.readFileSync(auxConfigPath).toString() : '';
    fs.writeFileSync(
        auxConfigPath,
        [existingAux, ...generatedKeys.map(function (key: string) {
            return key + '=' + config.get(key);
        })].join('\n'),
    );

    loadedConfig = config;

    log('Exporting config to environment...');
    for (const key in config)
        if (process.env[key] == null && process.env[key + "_FILE"] == null) {
            // @ts-ignore
            process.env[key] = config[key] as string;
        }

    info('Log level:', process.env.LOG_LEVEL);
}
