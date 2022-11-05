import {BgBlack, BgBlue, BgGreen, BgRed, BgYellow, FgWhite, Reset} from './colors.js';

export const error = (...objects) => {
    console.error(BgRed + FgWhite + " FAIL " + Reset, ...objects)
};

export const warn = (...objects) => {
    console.error(BgYellow + FgWhite + " WARN " + Reset, ...objects)
};

export const info = (...objects) => {
    console.error(BgBlue + FgWhite + " INFO " + Reset, ...objects)
};

export const infoSuccess = (...objects) => {
    console.error(BgGreen + FgWhite + "  OK  " + Reset, ...objects)
};

export const log = (...objects) => {
    console.error(BgBlack + FgWhite + " LOG  " + Reset, ...objects)
};
