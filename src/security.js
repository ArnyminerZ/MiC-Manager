import jwt from 'jsonwebtoken';
import fs from 'fs';

const privateKeyFilePath = process.env.PRIVATE_KEY_FILE ?? './secrets/private.key';

if (!fs.existsSync(privateKeyFilePath)) {
    console.warn('❌ Private key file is required but doesn\'t exist.');
    process.exitCode = 1;
    throw Error(`Private key file is required but doesn't exist. Path: ` + privateKeyFilePath);
}

const privateKey = fs.readFileSync(privateKeyFilePath).toString();

/**
 * Generates a new JSON Web Token with the given payload.
 * @author Arnau Mora
 * @since 20221019
 * @param {Object} payload The data to encode.
 * @param {string} expiresIn The amount of time until the token is considered expired.
 * @returns {Promise<string>}
 */
export const generateToken = (payload, expiresIn = '7d') => new Promise((resolve, reject) => {
    jwt.sign(payload, privateKey, {expiresIn}, (err, token) => {
        if (!err)
            resolve(token);
        else
            reject(err);
    });
});

/**
 * Checks whether a token is valid.
 * @author Arnau Mora
 * @since 20221019
 * @param {string} token The token to check for.
 * @returns {Promise<boolean>}
 */
export const checkToken = (token) => new Promise((resolve) => {
    jwt.verify(token, privateKey, {}, (err, payload) => {
        if (!err)
            if (!payload.hasOwnProperty('nif') || !payload.hasOwnProperty('userId'))
                resolve(false);
            else
                resolve(true);
        else
            resolve(false);
    });
});

/**
 * Returns the payload contained in a token.
 * @author Arnau Mora
 * @since 20221021
 * @param {string} token The token to check for.
 * @returns {Promise<{nif:string,userId:string}>}
 */
export const decodeToken = (token) => new Promise((resolve, reject) => {
    jwt.verify(token, privateKey, {}, (err, payload) => {
        if (!err)
            if (payload.hasOwnProperty('nif') && payload.hasOwnProperty('userId'))
                resolve(payload);
            else
                reject('Payload missing data.');
        else
            reject(err);
    });
});
