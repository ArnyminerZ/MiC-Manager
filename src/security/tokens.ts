import jwt, {JwtPayload} from "jsonwebtoken";
import fs from "fs";
import {privateKeyFile} from "./cryptography";

/**
 * The amount of seconds in a day.
 * @type {number}
 */
export const ONE_DAY = 24 * 60 * 60;

/**
 * The amount of seconds in a month of 30 days.
 * @type {number}
 */
export const ONE_MONTH = 30 * ONE_DAY;

/**
 * The amount of seconds in a year of 365 days.
 * @type {number}
 */
export const ONE_YEAR = 365 * ONE_DAY;

/**
 * Signs the given payload with the private key.
 * @param payload The payload to encode.
 * @param expiresIn The amount of seconds until the token expires
 * @return {string}
 */
export function sign(payload: Object, expiresIn: number = (30 * ONE_DAY)) {
    const privateKey = fs.readFileSync(privateKeyFile);
    // @ts-ignore
    payload['exp'] = Math.floor(Date.now() / 1000) + expiresIn;
    return jwt.sign(payload, privateKey, {algorithm: 'RS256'});
}

/**
 * Checks that the given token is valid, and returns the decoded data.
 * @param token The token to decode.
 * @return The loaded data from the key.
 * @throws If the token is not valid.
 */
export function validate(token: string): string | JwtPayload {
    const privateKey = fs.readFileSync(privateKeyFile);
    return jwt.verify(token, privateKey, {algorithms: ['RS256']});
}
