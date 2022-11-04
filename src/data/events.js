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

import {query as dbQuery} from "../database.js";

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
    const rows = await dbQuery(sql);
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
    const size = rows.length;
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
