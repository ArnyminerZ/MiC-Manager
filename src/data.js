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

export const getUserData = async (socioId) => {
    const sql = `SELECT *
                 FROM GesTro.dbo.tbSocios
                 WHERE idSocio = '${socioId}';`;
    const result = await dbQuery(sql);
    if (result.rowsAffected[0] <= 0)
        throw new UserNotFoundException(`Could not find socio#${socioId}.`);
    const row = result.recordset[0];
    return {
        name: row['Nombre'].trim(),
        familyName: row['Apellidos'].trim(),
        address: row['Direccion'].trim(),
        postalCode: row['idCodPostal'],
        dni: row['Dni'],
        born: row['FecNacimiento'],
        registration: row['FecAlta'],
        workPhone: row['TlfParticular'],
        homePhone: row['TlfTrabajo'],
        mobilePhone: row['TlfMovil'],
        email: row['eMail'],
        wheel: {
            whites: (!row['nrRodaBlancos'] || !row['bRodaBlancos']) ? null : {
                number: row['nrRodaBlancos'],
                locked: row['bRodaBlancos'],
            },
            blacks: (!row['nrRodaNegros'] || !row['bRodaNegros']) ? null : {
                number: row['nrRodaNegros'],
                locked: row['bRodaNegros'],
            },
        },
        trebuchet: !row['bCarnetAvancarga'] ? null : {
            shoots: row['bDisparaAvancarga'],
            obtained: formatDayDate(row['FecExpedicionAvancarga']),
            expires: formatDayDate(row['FecCaducidadAvancarga']),
        },
    };
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
 * @property {TableData?} table
 */

/**
 * Gets a list of all the available events.
 * @author Arnau Mora
 * @since 20221021
 * @return {Promise<EventData[]>}
 */
export const getEvents = async () => {
    const sql = `SELECT mEvents.*,
                        mA.Person      as AttPerson,
                        mT.Responsible as TableResponsible,
                        mTP.Person     as TableMember
                 FROM GesTro.dbo.mEvents
                          LEFT JOIN mAssistance mA ON mEvents.id = mA.Event
                          LEFT JOIN mTables mT on mEvents.id = mT.Event
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
     * @type {Map<number, {responsible:number,members:number[]}>}
     */
    let tables = new Map();
    const size = result.rowsAffected[0];
    /**
     * @type {{'mEvents.id':number,DisplayName:string,Date:string,Menu:string?,Contact:string?,Description:string?,Category:number,'mA.Id':number?,'mA.Event':number?,'mA.Person':number?,'mT.Id':number?,Responsible:number?,'mT.Event':number?,'mTP.Id':number?,'mTP.Person':number?,'TableId':number?}}
     */
    const rows = result.recordset;
    for (let c = 0; c < size; c++) {
        const row = rows[c];
        const eventId = row['id'];

        if (builder.hasOwnProperty(eventId)) {
            if (row['AttPerson'] != null) {
                const a = attendants[eventId] ?? [];
                a.push(row['AttPerson']);
                attendants[eventId] = a;
            }

            if (row['TableMember'] != null) {
                const t = tables[eventId] ?? {responsible: -1, members: []};
                t.members.push(row['TableMember']);
                tables[eventId] = t;
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
            });
            const attendingPerson = row['AttPerson'];
            if (!!attendingPerson)
                attendants[eventId] = [attendingPerson];

            const tableResponsible = row['TableResponsible'];
            const tableMember = row['TableMember'];
            if (!!tableResponsible || !!tableMember)
                tables[eventId] = {responsible: tableResponsible, members: [tableMember]};
        }
    }
    return builder.map((ev) => {
        ev.attending = attendants[ev.id];
        ev.table = tables[ev.id];
        return ev;
    });
}
