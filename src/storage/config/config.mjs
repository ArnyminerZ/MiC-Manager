export const GENERATE_RANDOM_USERNAME = -1000;
export const GENERATE_RANDOM_PASSWORD = -1001;
export const GENERATE_RANDOM_UUID = -1002;

export const ACCEPTS_ALL = -2000;

export const TYPE_STRING = 'string';
export const TYPE_NUMBER = 'number';
export const TYPE_BOOLEAN = 'boolean';
/**
 * @returns {TypeFile}
 * @constructor
 */
export const TYPE_FILE = (baseDir, touch = false) => {
    return { baseDir, touch };
};

/**
 * @typedef {Object} AcceptsRange
 * @property {number} min
 * @property {number} max
 */

/** @typedef {GENERATE_RANDOM_USERNAME|GENERATE_RANDOM_PASSWORD|GENERATE_RANDOM_UUID} Generator */

/**
 * @typedef {Object} TypeFile
 * @since 20221213
 * @property {string} baseDir The base directory in which to find this file.
 * @property {boolean} touch If true, the file will be touched if doesn't exist.
 */

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
 * @typedef {Object} FileConfig
 * @property {string} key
 * @property {TypeFile} type An instance of `TYPE_FILE`
 * @property {string} generator The name of the file.
 * @property {ACCEPTS_ALL|string[]} accepts
 * @see {TYPE_FILE}
 */

/**
 * Stores all the available configuration options.
 * @type {(StringConfig|NumberConfig|BooleanConfig|FileConfig)[]}
 */
export const KeysAndValues = [
    {key: 'LOG_LEVEL', type: TYPE_STRING, generator: 'warn', accepts: ['debug', 'info', 'warn', 'error']},
    {key: 'LOG_FILE', type: TYPE_FILE('.', true), generator: 'mic_manager.log', accepts: ACCEPTS_ALL },
    {key: 'SQLITE_FILE', type: TYPE_FILE('.', true), generator: 'database.sqlite', accepts: ACCEPTS_ALL },
    {key: 'PHONE_REGION', type: TYPE_NUMBER, generator: 34, accepts: ACCEPTS_ALL},
];
