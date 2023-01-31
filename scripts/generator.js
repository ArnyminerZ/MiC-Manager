import fs from "fs";
import path from "path";
import {info} from "../cli/logger.js";

/**
 * Generates a random integer from the given interval (both inclusively).
 * @param {number} min The minimum number to generate.
 * @param {number} max The maximum number to generate.
 * @returns {number}
 */
const randomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

/**
 * Generates a random string with the given length.
 * @param {number} length
 * @returns {string}
 */
const generator = (length) => [...(new Array(length))].map(() => String.fromCharCode(randomIntFromInterval(33, 126))).join('');

export const generateSecrets = secretsDir => {
    if (!fs.existsSync(secretsDir)) fs.mkdirSync(secretsDir);

    const secrets = ['password', 'root-password', 'firefly-app-key', 'database', 'username'];

    for (const secret of secrets) {
        const file = path.join(secretsDir, `${secret}.txt`);
        if (!fs.existsSync(file)) {
            info('Generating random contents for', file);
            fs.writeFileSync(file, generator(32));
        }
    }

    const privateKey = path.join(secretsDir, 'private.key');
    if (!fs.existsSync(privateKey)) {
        info('Generating random contents for', privateKey);
        fs.writeFileSync(privateKey, generator(1024));
    }
};
