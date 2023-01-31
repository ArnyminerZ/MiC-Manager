import fs from "fs";
import path from "path";
import {info} from "../cli/logger.js";

const AlphaNum = [[48, 57], [65, 90], [97, 122]];

/**
 * Generates a random integer from the given interval (both inclusively).
 * @param {number} min The minimum number to generate.
 * @param {number} max The maximum number to generate.
 * @returns {number}
 */
const randomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

/**
 * Generates a random integer from the given intervals.
 * @param {[number,number]} intervals
 * @return {number}
 */
const randomIntFromIntervals = (...intervals) => {
    const intervalIndex = randomIntFromInterval(0, intervals.length - 1);
    const interval = intervals[intervalIndex];
    return randomIntFromInterval(interval[0], interval[1]);
}

/**
 * Generates a random string with the given length.
 *
 * Uses ASCII characters from the set `from`-`to`.
 * @param {number} length The length of the generated string.
 * @param {[start:number,end:number][]} intervals The intervals of characters to be used. Uses ASCII codes.
 * @returns {string}
 */
export const generator = (length, intervals = [[33, 126]]) =>
    [...(new Array(length))].map(() => String.fromCharCode(randomIntFromIntervals(...intervals))).join('');

export const generateSecrets = secretsDir => {
    if (!fs.existsSync(secretsDir)) fs.mkdirSync(secretsDir);

    const passwordSecrets = ['password', 'root-password', 'firefly-app-key', 'firefly-user-password'];
    const alphaNumSecrets = ['database', 'username'];
    const emailSecrets = ['firefly-user-email'];

    for (const secret of passwordSecrets) {
        const file = path.join(secretsDir, `${secret}.txt`);
        if (!fs.existsSync(file)) {
            info('Generating random contents for', file);
            fs.writeFileSync(file, generator(32));
        }
    }
    for (const secret of alphaNumSecrets) {
        const file = path.join(secretsDir, `${secret}.txt`);
        if (!fs.existsSync(file)) {
            info('Generating random contents for', file);
            fs.writeFileSync(file, generator(32, AlphaNum));
        }
    }
    for (const secret of emailSecrets) {
        const file = path.join(secretsDir, `${secret}.txt`);
        if (!fs.existsSync(file)) {
            info('Generating random contents for', file);
            fs.writeFileSync(
                file,
                `${generator(32, AlphaNum)}@${generator(5, AlphaNum)}.com`,
            );
        }
    }

    const privateKey = path.join(secretsDir, 'private.key');
    if (!fs.existsSync(privateKey)) {
        info('Generating random contents for', privateKey);
        fs.writeFileSync(privateKey, generator(1024));
    }
};
