import bcrypt from 'bcrypt';

import {query} from './database.js';
import {checkToken, generateToken} from "./security.js";
import {
    InvalidTokenException,
    PasswordlessUserException,
    SecurityException,
    UserNotFoundException,
    WrongPasswordException,
} from './exceptions.js';

import securityPolicy from '../security-policy.json' assert {type: 'json'};
import {ipToLong} from "./utils.js";

/**
 * Queries the amount of login attempts made by the given IP in the last 24 hours.
 * @author Arnau Mora
 * @since 20221019
 * @param {string} ip The IP that is trying to log in.
 * @returns {Promise<number>}
 */
const loginAttemptsCount = async (ip) => {
    const longIp = ipToLong(ip);
    const sql = `SELECT Id, IP, UserId, Timestamp
                 FROM mLoginAttempts
                 WHERE Timestamp >= now() - interval 1 day
                   AND Successful = 0
                   AND IP = 0x${longIp.toString(16)};`;
    const q = await query(sql);
    return q.length ?? 0;
};

/**
 * Returns the IdSocio from `tbSocios` given its DNI.
 * @author Arnau Mora
 * @since 20221019
 * @param {string} dni The DNI of the user.
 * @throws {UserNotFoundException} If there isn't a matching user with the given DNI.
 * @returns {Promise<number>}
 */
const getSocioIdFromDni = async (dni) => {
    const rows = await query(`SELECT IdSocio
                              FROM tbSocios
                              WHERE Dni = '${dni}';`);
    if (rows.length <= 0)
        throw new UserNotFoundException(`Could not find socio with DNI ${dni}.`);
    return rows[0]['IdSocio'];
};

/**
 * @typedef {Object} UserData
 * @property {string} hash The hashed password of the user.
 * @property {number} id The user's id.
 */

/**
 * Returns the user data from a given socioId.
 * @author Arnau Mora
 * @since 20221019
 * @param {number} socioId The SocioId of the user to search for.
 * @throws {PasswordlessUserException} If the given user doesn't have a password. `changePassword` should be called.
 * @returns {Promise<UserData>} The hash of the user.
 */
const getUserFromSocioId = async (socioId) => {
    const sql = `SELECT Id, hash
                 FROM mUsers
                 WHERE SocioId = ${socioId}`;
    const rows = await query(sql);
    if (rows.length <= 0)
        throw new PasswordlessUserException(`The user with SocioId=${socioId} doesn't have a password defined, please, set.`);
    const data = rows[0];
    return {hash: data['hash'], id: data['id']};
};

/**
 * Tries to authorise in the system using the given credentials.
 * @author Arnau Mora
 * @since 20221019
 * @param {string} dni The DNI of the authenticating user. With letter.
 * @param {string} password The password of the authenticating user.
 * @param {string} reqIp The IP address of the requester.
 * @throws {SecurityException} When a security policy is broken. Applies: `login.max-attempts-24h`
 * @throws {UserNotFoundException} If there isn't a matching user with the given DNI.
 * @throws {PasswordlessUserException} If the given user doesn't have a password. `changePassword` should be called.
 * @throws {WrongPasswordException} If the password introduced is not correct.
 * @returns {Promise<string>}
 * @see changePassword
 */
export const login = async (dni, password, reqIp) => {
    const maxAttempts = securityPolicy.login["max-attempts-24h"];
    let ip = reqIp === '::1' || '::ffff:127.0.0.1' ? '127.0.0.1' : reqIp;
    const loginAttempts = await loginAttemptsCount(ip);

    if (loginAttempts >= maxAttempts)
        throw new SecurityException(`Max attempts count reached (${maxAttempts}).`);

    const socioId = await getSocioIdFromDni(dni);
    const user = await getUserFromSocioId(socioId);
    const userHash = user.hash;

    let successful = await bcrypt.compare(password, userHash);

    // Register the attempt
    const queryStr = `INSERT INTO mLoginAttempts (UserId, IP, Successful)
                      SELECT '${user.id}', 0x${ipToLong(ip).toString(16)}, ${successful ? 1 : 0};`;
    await query(queryStr);

    if (!successful)
        throw new WrongPasswordException('Wrong password introduced.');

    return await generateToken({dni, socioId});
};

/**
 * Changes the password of a user given its DNI and a new password. Optionally, an apiKey may be given for users that
 * already have a password.
 * @param {string} dni The DNI of the user.
 * @param {string} newPassword The new password to set.
 * @param {string?} apiKey If the user already has a password, the apiKey to use for authenticating.
 * @throws {UserNotFoundException} If there isn't a matching user with the given DNI.
 * @throws {InvalidTokenException} When the given apiKey is not valid or has expired.
 * @returns {Promise<void>}
 */
export const changePassword = async (dni, newPassword, apiKey) => {
    const socioId = await getSocioIdFromDni(dni);
    let error;
    try {
        // Check if the user has a hash
        await getUserFromSocioId(socioId);
        const isTokenValid = await checkToken(apiKey);
        if (!isTokenValid)
            error = new InvalidTokenException('The given apiKey is not valid.');
        // TODO: Actually change password
    } catch (e) {
        if (e instanceof PasswordlessUserException) {
            // Trying to set a password
            const passwordHash = await bcrypt.hash(newPassword, securityPolicy.crypto["salt-rounds"]);
            const sql = `INSERT INTO mUsers (SocioId, Hash)
                         VALUES (${socioId}, '${passwordHash}');`;
            await query(sql);
        } else
            throw e
    }
    if (error != null)
        throw error;
};
