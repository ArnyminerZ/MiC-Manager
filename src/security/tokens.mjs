import jwt from "jsonwebtoken";
import fs from "fs";
import {privateKeyFile} from "./cryptography.mjs";

/**
 * Signs the given payload with the private key.
 * @param payload
 * @param {string|number} expiresIn
 * @return {string}
 */
export const sign = (payload, expiresIn = '30d') => {
    const privateKey = fs.readFileSync(privateKeyFile);
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn });
};

/**
 * Checks that the given token is valid.
 * @param {string} token
 * @return {*}
 */
export const validate = (token) => {
    const privateKey = fs.readFileSync(privateKeyFile);
    return jwt.verify(token, privateKey, { algorithm: 'RS256' });
}
