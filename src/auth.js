import {query} from './database.js';

/**
 * Tries to authorise in the system using the given credentials.
 * @param {string} dni The DNI of the authenticating user. With letter.
 * @param {string} password The password of the authenticating user.
 * @param {string} reqIp The IP address of the requester.
 * @returns {Promise<void>}
 */
export const login = async (dni, password, reqIp) => {
    let ip = reqIp === '::1' || '::ffff:127.0.0.1' ? '127.0.0.1' : reqIp;

    // First of all, register the attempt.
    const time = new Date();
    const queryStr = `INSERT INTO GesTro.dbo.mLoginAttempts (DNI, IP, Timestamp)
                      SELECT '${dni}', dbo.itvfBinaryIPv4('${ip}'), ${time.getTime()};`;
    console.info(queryStr);
    return await query(
        queryStr
    );
}
