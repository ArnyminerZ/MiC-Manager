import {BgBlack, BgBlue, BgGreen, BgRed, BgYellow, FgWhite, Reset} from './colors.js';

/**
 * All the available log levels.
 * @readonly
 * @enum {string}
 */
const LogLevels = {ERROR: 'error', WARN: 'warn', INFO: 'info', DEBUG: 'debug'};

/**
 * Checks the currently set log level, in comparison with a desired one.
 * @param {LogLevels} level
 * @return {boolean|boolean}
 */
const checkLogLevel = (level) => {
    if (process.env.LOG_LEVEL == null) return true;

    const levelIndex = Object.keys(LogLevels).find(key => LogLevels[key] === level);
    const choseIndex = Object.keys(LogLevels).find(key => LogLevels[key] === process.env.LOG_LEVEL);
    return levelIndex >= 0 && choseIndex >= 0 ? choseIndex < levelIndex : true;
}

export const error = (...objects) => {
    if (!checkLogLevel(LogLevels.ERROR)) return;
    console.error(BgRed + FgWhite + " FAIL " + Reset, ...objects)
};

export const warn = (...objects) => {
    if (!checkLogLevel(LogLevels.WARN)) return;
    console.error(BgYellow + FgWhite + " WARN " + Reset, ...objects)
};

export const info = (...objects) => {
    if (!checkLogLevel(LogLevels.INFO)) return;
    console.error(BgBlue + FgWhite + " INFO " + Reset, ...objects)
};

export const infoSuccess = (...objects) => {
    if (!checkLogLevel(LogLevels.INFO)) return;
    console.error(BgGreen + FgWhite + "  OK  " + Reset, ...objects)
};

export const log = (...objects) => {
    if (!checkLogLevel(LogLevels.DEBUG)) return;
    console.error(BgBlack + FgWhite + " LOG  " + Reset, ...objects)
};
