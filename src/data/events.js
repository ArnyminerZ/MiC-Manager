/**
 * @typedef {Object} TableData
 * @property {number} responsible
 * @property {number} members
 */

/**
 * @typedef {Object} MenuData
 * @property {string[]} firsts
 * @property {string[]} seconds
 * @property {string[]} thirds
 * @property {string[]} desserts
 * @property {boolean} drinkIncluded
 * @property {boolean} coffeeIncluded
 * @property {boolean} teaIncluded
 * @property {{grade:string,price:number}[]} pricing
 */

/**
 * @typedef {Object} EventData
 * @property {number} id
 * @property {string} displayName
 * @property {string} date
 * @property {MenuData?} menu
 * @property {string?} contact
 * @property {string?} description
 * @property {number} category
 * @property {number[]} attending
 * @property {TableData[]} tables
 */

import {query as dbQuery, removeIfExists} from "../request/database.js";
import {SqlError} from "mariadb";
import {log} from "../../cli/logger.js";

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
    /** @type {EventData[]} */
    let builder = [];
    /** @type {Map<number, number[]>} */
    let attendants = new Map();
    /** @type {Map<number, Map<number, TableData>>} */
    let tables = new Map();
    for (let row of rows) {
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
            const event = {
                id: row['Id'],
                displayName: row['DisplayName'],
                date: row['Date'],
                contact: row['Contact'],
                description: row['Description'],
                category: row['Category'],
                attending: [],
                tables: [],
            }

            // Add menu if any
            const menuSearch = await dbQuery(
                `SELECT mMenus.*, mP.Price, mG.DisplayName as GradeDisplayName
                 FROM mMenus
                          LEFT JOIN mMenuPricing mP ON MenuId = mMenus.Id
                          LEFT JOIN mGrades mG ON mG.Id = mP.GradeId
                 WHERE EventId = '1';`
            );
            if (menuSearch.length > 0) {
                const menu = menuSearch[0];
                const pricing = menuSearch.map(row => {
                    return {
                        grade: row['GradeDisplayName'],
                        price: row['Price'],
                    };
                })
                event.menu = {
                    firsts: menu['Firsts'],
                    seconds: menu['Seconds'],
                    thirds: menu['Thirds'],
                    desserts: menu['Desserts'],
                    drinkIncluded: menu['DrinkIncluded'],
                    coffeeIncluded: menu['CoffeeIncluded'],
                    teaIncluded: menu['TeaIncluded'],
                    pricing,
                };
            }

            builder.push(event);

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
};

/**
 * Creates a new event.
 * @author Arnau Mora
 * @since 20221106
 * @param {string} displayName
 * @param {string,null} description
 * @param {Date} date
 * @param {string,null} contact
 * @param {string} category
 * @throws {SqlError}
 */
export const create = async (displayName, description, date, contact, category) => {
    const categoryQuery = await dbQuery(`SELECT Id
                                         FROM mCategories
                                         WHERE DisplayName = '${category}'
                                         LIMIT 1;`);
    const categoryId = categoryQuery[0].Id;
    await dbQuery(`INSERT INTO mEvents(DisplayName, Description, Date, Contact, Category)
                   VALUES ('${displayName}', ${description != null ? `'${description}'` : 'NULL'},
                           '${date.toISOString().slice(0, 19).replace('T', ' ')}',
                           ${contact != null ? `'${contact}'` : 'NULL'},
                           ${categoryId})`);
};

/**
 * Checks if the event is an eat event.
 * @author Arnau Mora
 * @since 20221108
 * @param {number} eventId The id of the event to check.
 * @return {Promise<boolean>}
 * @throws {SqlError}
 */
export const isEatEvent = async (eventId) => {
    const rows = await dbQuery(
        `SELECT mC.Eat as EatEvent
         FROM mEvents
                  LEFT JOIN mCategories mC on mEvents.Category = mC.Id
         WHERE mEvents.Id = ${eventId};`
    );
    if (rows.length <= 0)
        return false;
    const row = rows[0];
    return row['EatEvent'];
};

/**
 * Updates the menu of an event.
 * @author Arnau Mora
 * @since 20221109
 * @param {number} eventId
 * @param {MenuData} menu
 * @return {Promise<void>}
 */
export const setMenu = async (eventId, menu) => {
    const firsts = menu.firsts, seconds = menu.seconds, thirds = menu.thirds, desserts = menu.desserts;
    const firstsTxt = firsts.length > 0 ? `'${firsts.join(';')}'` : 'NULL',
        secondsTxt = seconds.length > 0 ? `'${seconds.join(';')}'` : 'NULL',
        thirdsTxt = thirds.length > 0 ? `'${thirds.join(';')}'` : 'NULL',
        dessertsTxt = desserts.length > 0 ? `'${desserts.join(';')}'` : 'NULL';
    /** @type {{Id:number}[]} */
    const menus = await dbQuery(`SELECT Id
                                 FROM mMenus
                                 WHERE EventId = '${eventId}'
                                 LIMIT 1;`);

    // If there's already a menu, remove it
    for (let menu of menus) {
        await removeIfExists('mMenuPricing', (new Map()).set('MenuId', menu.Id));
        await removeIfExists('mMenus', (new Map()).set('EventId', eventId));
        log('Removed menu with id', menu.Id, 'for event with id', eventId);
    }

    // Add the new menu
    const q = await dbQuery(`INSERT INTO mMenus (EventId, Firsts, Seconds, Thirds, Desserts, DrinkIncluded,
                                                 CoffeeIncluded,
                                                 TeaIncluded)
                             VALUES (${eventId}, ${firstsTxt}, ${secondsTxt}, ${thirdsTxt}, ${dessertsTxt},
                                     ${menu.drinkIncluded ? '1' : 0}, ${menu.coffeeIncluded ? '1' : '0'},
                                     ${menu.teaIncluded ? '1' : '0'})`);
    const menuId = parseInt(q.insertId);

    // Add the pricing
    for (let {grade, price} of menu.pricing) {
        let gradeId;
        if (grade == null)
            gradeId = 'null';
        else {
            const rows = await dbQuery(`SELECT Id
                                        FROM mGrades
                                        WHERE DisplayName = '${grade}'
                                        LIMIT 1;`);
            gradeId = rows[0]?.Id ?? 'null';
        }
        await dbQuery(`INSERT INTO mMenuPricing (MenuId, GradeId, Price)
                       VALUES (${menuId}, ${gradeId}, ${price})`);
    }
};
