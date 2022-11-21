import {BgBlack, BgBlue, BgGreen, BgRed, BgYellow, FgWhite, Reset} from './colors.js';

const logLevels = ['error', 'warn', 'info', 'debug'];

const checkLogLevel = (level) => {
    const index = logLevels.indexOf(level);
    return index >= 0 ? process.env.LOG_LEVEL > index : true;
}

export const error = (...objects) => {
    if (!checkLogLevel('error')) return;
    console.error(BgRed + FgWhite + " FAIL " + Reset, ...objects)
};

export const warn = (...objects) => {
    if (!checkLogLevel('warn')) return;
    console.error(BgYellow + FgWhite + " WARN " + Reset, ...objects)
};

export const info = (...objects) => {
    if (!checkLogLevel('info')) return;
    console.error(BgBlue + FgWhite + " INFO " + Reset, ...objects)
};

export const infoSuccess = (...objects) => {
    if (!checkLogLevel('info')) return;
    console.error(BgGreen + FgWhite + "  OK  " + Reset, ...objects)
};

export const log = (...objects) => {
    if (!checkLogLevel('debug')) return;
    console.error(BgBlack + FgWhite + " LOG  " + Reset, ...objects)
};
