import dateFormat from 'dateformat';

import {query as dbQuery} from './database.js';
import {UserNotFoundException} from "./exceptions.js";

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
    const result = await dbQuery(sql);
    if (result.rowsAffected[0] <= 0)
        throw new UserNotFoundException(`Could not find socio#${socioId}.`);
    const row = result.recordset[0];
    return {
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
    const query = await dbQuery(`SELECT SocioId
                                 FROM mUsers
                                 WHERE Id = ${userId};`);
    if (query.rowsAffected[0] <= 0)
        throw new UserNotFoundException(`Could not find user#${userId}.`);
    return query.recordset[0]['SocioId'];
};

/**
 * @typedef {Object} TableData
 * @property {number} responsible
 * @property {number} members
 */

/**
 * @typedef {Object} EventData
 * @property {number} id
 * @property {string} displayName
 * @property {string} date
 * @property {Object?} menu
 * @property {string?} contact
 * @property {string?} description
 * @property {number} category
 * @property {number[]} attending
 * @property {TableData[]} tables
 */

/**
 * Gets a list of all the available events.
 * @author Arnau Mora
 * @since 20221021
 * @return {Promise<EventData[]>}
 */
export const getEvents = async () => {
    const sql = `SELECT mEvents.*,
                        mA.UserId      as AttPerson,
                        mT.Responsible as TableResponsible,
                        mTP.UserId     as TableMember,
                        mT.Id          as TableId
                 FROM mEvents
                          LEFT JOIN mAssistance mA ON mEvents.id = mA.EventId
                          LEFT JOIN mTables mT on mEvents.id = mT.EventId
                          LEFT JOIN mTablesPeople mTP on mT.Id = mTP.TableId;`;
    const result = await dbQuery(sql);
    /**
     * @type {EventData[]}
     */
    let builder = [];
    /**
     * @type {Map<number, number[]>}
     */
    let attendants = new Map();
    /**
     * @type {Map<number, Map<number, TableData>>}
     */
    let tables = new Map();
    const size = result.rowsAffected[0];
    /**
     * @type {{'mEvents.id':number,DisplayName:string,Date:string,Menu:string?,Contact:string?,Description:string?,Category:number,'mA.Id':number?,'mA.Event':number?,'mA.Person':number?,'mT.Id':number?,Responsible:number?,'mT.Event':number?,'mTP.Id':number?,'mTP.Person':number?,'TableId':string?}}
     */
    const rows = result.recordset;
    for (let c = 0; c < size; c++) {
        const row = rows[c];
        const eventId = row['id'];
        const tableId = parseInt(row['TableId']);

        if (builder.hasOwnProperty(eventId)) {
            if (row['AttPerson'] != null) {
                const a = attendants[eventId] ?? [];
                a.push(row['AttPerson']);
                attendants[eventId] = a;
            }

            if (row['TableMember'] != null) {
                /** @type {Map<number, TableData>} */
                const t = tables.get(eventId) ?? new Map();
                /** @type {TableData} */
                const te = t.get(tableId) ?? {responsible: -1, members: []};
                te.members.push(row['TableMember']);
                t.set(tableId, te);
                tables.set(eventId, t);
            }
        } else {
            builder.push({
                id: row['id'],
                displayName: row['DisplayName'],
                date: row['Date'],
                menu: JSON.parse(row['Menu']),
                contact: row['Contact'],
                description: row['Description'],
                category: row['Category'],
                attending: [],
                tables: [],
            });
            const attendingPerson = row['AttPerson'];
            if (!!attendingPerson)
                attendants[eventId] = [attendingPerson];

            const tableResponsible = row['TableResponsible'];
            const tableMember = row['TableMember'];
            if (!!tableResponsible || !!tableMember)
                tables.set(eventId, new Map([[tableId, {responsible: tableResponsible, members: [tableMember]}]]));
        }
    }
    return builder.map((ev) => {
        ev.attending = attendants[ev.id];
        let eventTables = tables.get(ev.id) ?? new Map();
        ev.tables = Array.from(eventTables.values());
        return ev;
    });
}
