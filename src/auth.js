import {query} from './database.js';

import securityPolicy from '../security-policy.json' assert {type: 'json'};

export class SecurityException extends Error {
    constructor(message) {
        super(message);
        this.name = "SecurityException";
    }
}

export class UserNotFoundException extends Error {
    constructor(message) {
        super(message);
        this.name = 'UserNotFoundException';
    }
}

export class PasswordlessUserException extends Error {
    constructor(message) {
        super(message);
        this.name = 'PasswordlessUserException';
    }
}

/**
 * Queries the amount of login attempts made by the given IP in the last 24 hours.
 * @author Arnau Mora
 * @since 20221019
 * @param {string} ip The IP that is trying to log in.
 * @returns {Promise<number>}
 */
const loginAttemptsCount = async (ip) => {
    const sql = `SELECT Id, dbo.fnDisplayIPv4(IP), DNI, Timestamp
                 FROM mLoginAttempts
                 WHERE Timestamp >= DATEADD(day, -1, getdate());`;
    const q = await query(sql);
    return q?.recordset?.length ?? 0;
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
    const socioIdQuery = await query(`SELECT IdSocio
                                      FROM GesTro.dbo.tbSocios
                                      WHERE Dni = '${dni}';`);
    if (socioIdQuery.rowsAffected[0] <= 0 || socioIdQuery.recordset == null)
        throw new UserNotFoundException(`Could not find socio with DNI ${dni}.`);
    return socioIdQuery.recordset[0]['IdSocio'];
}

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
 * @returns {Promise<void>}
 * @see changePassword
 */
export const login = async (dni, password, reqIp) => {
    const maxAttempts = securityPolicy.login["max-attempts-24h"];
    let ip = reqIp === '::1' || '::ffff:127.0.0.1' ? '127.0.0.1' : reqIp;
    const loginAttempts = await loginAttemptsCount(ip);

    if (loginAttempts >= maxAttempts)
        throw new SecurityException(`Max attempts count reached (${maxAttempts}).`);

    let successful = false;

    const socioId = await getSocioIdFromDni(dni);

    // const passwordHash = await bcrypt.hash(password, securityPolicy.crypto["salt-rounds"]);

    const sql = `SELECT hash
                 FROM GesTro.dbo.mUsers
                 WHERE SocioId = ${socioId}`;
    const hashQuery = await query(sql);
    if (hashQuery.rowsAffected[0] <= 0)
        throw new PasswordlessUserException(`The user with DNI ${dni} doesn't have a password defined, please, set.`);

    // Register the attempt
    const queryStr = `INSERT INTO GesTro.dbo.mLoginAttempts (DNI, IP, Successful)
                      SELECT '${dni}', (SELECT bin FROM dbo.itvfBinaryIPv4('${ip}')), ${successful ? 1 : 0};`;
    return await query(queryStr);
};

export const changePassword = async (dni, newPassword, apiKey) => {
    const socioId = await getSocioIdFromDni(dni);
};
