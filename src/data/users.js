import dateFormat from 'dateformat';

import {query as dbQuery} from '../request/database.js';
import {UserNotFoundException} from "../exceptions.js";

/**
 * Returns the given string as a formatted date following yyyy-MM-dd.
 * @author Arnau Mora
 * @since 20221021
 * @param {string} date The date to parse.
 * @return {string}
 */
const formatDayDate = (date) => dateFormat(new Date(date), 'yyyy-MM-dd');

/**
 * @typedef {Object} WheelData
 * @property {number} number
 * @property {boolean} locked
 */

/**
 * @typedef {Object} TrebuchetData
 * @property {boolean} shoots
 * @property {string} obtained
 * @property {string} expires
 */

/**
 * @typedef {Object} UserData
 * @property {string} name
 * @property {string} familyName
 * @property {string} address
 * @property {number} postalCode
 * @property {string} dni
 * @property {string} born Follows `formatDayDate`
 * @property {string} registration Follows `formatDayDate`
 * @property {string} workPhone
 * @property {string} homePhone
 * @property {string} mobilePhone
 * @property {string} email
 * @property {{whites:WheelData,blacks:WheelData}} wheel
 * @property {TrebuchetData} trebuchet
 */

/**
 * Fetches the data of a given user.
 * @author Arnau Mora
 * @since 20221024
 * @param {number} socioId The id of the user in the socios table.
 * @param {boolean} constrain If the whole user data should be returned, or just the public one.
 * @return {Promise<UserData>}
 */
export const getUserData = async (socioId, constrain = false) => {
    const sql = `SELECT *
                 FROM tbSocios
                 WHERE idSocio = '${socioId}';`;
    const rows = await dbQuery(sql);
    if (rows.length <= 0)
        throw new UserNotFoundException(`Could not find socio#${socioId}.`);
    const row = rows[0];
    return {
        id: row['idSocio'],
        name: row['Nombre'].trim(),
        familyName: row['Apellidos'].trim(),
        address: constrain ? null : row['Direccion'].trim(),
        postalCode: constrain ? null : row['idCodPostal'],
        dni: constrain ? null : row['Dni'],
        born: constrain ? null : row['FecNacimiento'],
        registration: constrain ? null : row['FecAlta'],
        workPhone: constrain ? null : row['TlfParticular'],
        homePhone: constrain ? null : row['TlfTrabajo'],
        mobilePhone: constrain ? null : row['TlfMovil'],
        email: constrain ? null : row['eMail'],
        wheel: constrain ? null : {
            whites: (!row['nrRodaBlancos'] || !row['bRodaBlancos']) ? null : {
                number: row['nrRodaBlancos'],
                locked: row['bRodaBlancos'],
            },
            blacks: (!row['nrRodaNegros'] || !row['bRodaNegros']) ? null : {
                number: row['nrRodaNegros'],
                locked: row['bRodaNegros'],
            },
        },
        trebuchet: constrain ? null : !row['bCarnetAvancarga'] ? null : {
            shoots: row['bDisparaAvancarga'],
            obtained: formatDayDate(row['FecExpedicionAvancarga']),
            expires: formatDayDate(row['FecCaducidadAvancarga']),
        },
        type: row['idTipoFestero'],
        payment: row['idFormaPago'],
    };
};

/**
 * Fetches the socioId of a given userId.
 * @author Arnau Mora
 * @since 20221025
 * @param {number} userId The userId to search for.
 * @throws UserNotFoundException If the given `userId` was not found.
 * @return {Promise<number>}
 */
export const getSocioId = async (userId) => {
    const rows = await dbQuery(`SELECT SocioId
                                FROM mUsers
                                WHERE Id = ${userId};`);
    if (rows.length <= 0)
        throw new UserNotFoundException(`Could not find user#${userId}.`);
    return rows[0]['SocioId'];
};
