import bcrypt from 'bcrypt';

import {query} from './request/database.js';
import {checkToken, generateToken} from "./security.js";
import {
    InvalidTokenException,
    LoginAttemptInsertException,
    PasswordlessUserException,
    SecurityException,
    UserNotFoundException,
    WrongPasswordException,
} from './exceptions.js';
import {findUserWithNif} from './data/users.js';

import securityPolicy from '../security-policy.json' assert {type: 'json'};
import {ipToLong} from "./utils.js";
import {SqlError} from "mariadb";

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
                   AND IP = ?;`;
    const q = await query(sql, true, '0x' + longIp.toString(16));
    return q.length ?? 0;
};

/**
 * Tries to authorise in the system using the given credentials.
 * @author Arnau Mora
 * @since 20221019
 * @param {string} nif The DNI of the authenticating user. With letter.
 * @param {string} password The password of the authenticating user.
 * @param {string} reqIp The IP address of the requester.
 * @throws {SecurityException} When a security policy is broken. Applies: `login.max-attempts-24h`
 * @throws {UserNotFoundException} If there isn't a matching user with the given DNI.
 * @throws {PasswordlessUserException} If the given user doesn't have a password. `changePassword` should be called.
 * @throws {WrongPasswordException} If the password introduced is not correct.
 * @throws {LoginAttemptInsertException} If the login attempt could not be registered.
 * @returns {Promise<string>}
 * @see changePassword
 */
export const login = async (nif, password, reqIp) => {
    const maxAttempts = securityPolicy.login["max-attempts-24h"];
    let ip = reqIp === '::1' || '::ffff:127.0.0.1' ? '127.0.0.1' : reqIp;
    const loginAttempts = await loginAttemptsCount(ip);

    if (loginAttempts >= maxAttempts)
        throw new SecurityException(`Max attempts count reached (${maxAttempts}).`);

    const user = await findUserWithNif(nif);
    if (user == null)
        throw new UserNotFoundException('Could not find any user with NIF ' + nif);
    const userHash = user.Hash;

    if (userHash == null)
        throw new PasswordlessUserException(`The user doesn't have any hash.`);

    let successful = await bcrypt.compare(password, userHash);

    // Register the attempt
    const longIp = ipToLong(ip);
    try {
        const queryStr = `INSERT INTO mLoginAttempts (UserId, IP, Successful)
                          SELECT ?, ${'0x' + longIp.toString(16)}, ?;`;
        await query(queryStr, true, user.Id, successful ? 1 : 0);
    } catch (e) {
        if (e instanceof SqlError && e.code === 'ER_DATA_TOO_LONG')
            throw new LoginAttemptInsertException(`Could not insert login attempt. Raw IP: ${ip}. Long: 0x${longIp.toString(16)}`);
        else throw e;
    }

    if (!successful)
        throw new WrongPasswordException('Wrong password introduced.');

    return await generateToken({nif, userId: user.Id});
};

/**
 * Changes the password of a user given its DNI and a new password. Optionally, an apiKey may be given for users that
 * already have a password.
 * @param {string|null} nif The NIF of the user.
 * @param {string} newPassword The new password to set.
 * @param {string?} apiKey If the user already has a password, the apiKey to use for authenticating.
 * @throws {UserNotFoundException} If there isn't a matching user with the given DNI.
 * @throws {InvalidTokenException} When the given apiKey is not valid or has expired.
 * @returns {Promise<void>}
 */
export const changePassword = async (nif, newPassword, apiKey) => {
    // Check if the user is registered
    const user = await findUserWithNif(nif);
    if (user == null) throw new UserNotFoundException('Could not find an user with NIF=' + nif);
    if (user.Hash == null) {
        // Trying to set a password
        const passwordHash = await bcrypt.hash(newPassword, securityPolicy.crypto["salt-rounds"]);
        const sql = `UPDATE mUsers
                     SET Hash=?
                     WHERE Id = ?;`;
        await query(sql, true, passwordHash, user.Id);
        return;
    }

    // Check if the provided token is valid
    const isTokenValid = await checkToken(apiKey);
    if (!isTokenValid)
        throw new InvalidTokenException('The given apiKey is not valid.');
    // TODO: Actually change password
};
