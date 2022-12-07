import path from 'path';
import {fileURLToPath} from 'url';
import fs from "fs/promises";

/**
 * @param {string} ip The IP to parse.
 * @returns {number}
 */
export const ipToLong = (ip) => {
    let ipl = 0;
    ip.split('.').forEach(function (octet) {
        ipl <<= 8;
        ipl += parseInt(octet);
    });
    return (ipl >>> 0);
}

/**
 * Checks if a given value is a number.
 * @param {string} value The value to check against
 * @returns {boolean}
 */
export const isNumber = value => /^-?\d+$/.test(value);

/**
 * Capitalizes the first letter of each word.
 * @author Arnau Mora
 * @since 20221105
 * @param {string} text
 * @return {string}
 */
export const capitalize = text =>
    text.toLowerCase()
        .split(' ')
        .map(t => {
            const newChar = t.charAt(0).toUpperCase();
            return newChar + t.substring(1);
        })
        .join(' ');

/**
 * Checks using the fs/promises library whether a path exists or not.
 * @author Arnau Mora
 * @since 20221207
 * @param {string} path The path to check for. Can be both a file or a directory.
 * @returns {Promise<boolean>} *true* if the path exists, false otherwise.
 * @throws If there's another error while checking for the path's existence.
 */
export const pathExists = async path => {
    try {
        await fs.stat(path);
        return true;
    } catch(err) {
        if (err.code === 'ENOENT')
            return false;
        else
            throw err;
    }
}

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(path.join(__filename, '..'));
