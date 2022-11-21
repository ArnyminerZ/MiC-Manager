import path from 'path';
import {fileURLToPath} from 'url';

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

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(path.join(__filename, '..'));
