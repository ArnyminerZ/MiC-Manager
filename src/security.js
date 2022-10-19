import jwt from 'jsonwebtoken';
import fs from 'fs';

const privateKey = fs.readFileSync('./private.key').toString();

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
    jwt.verify(token, privateKey, {}, (err) => {
        if (!err)
            resolve(true);
        else
            resolve(false);
    });
});
