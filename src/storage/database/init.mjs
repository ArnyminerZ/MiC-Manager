import {getQueries as getTablesQueries} from "../../../db/tables.mjs";

import sqlite3 from 'sqlite3';
import {info} from "../../../cli/logger.mjs";

/** @type {sqlite3.Database} */
export let db;

/**
 * Initializes the database, creating all the required tables if necessary.
 * @return {Promise<unknown>}
 */
export const initDatabase = async () => new Promise((resolve, reject) => {
    db = new sqlite3.Database(process.env.SQLITE_FILE);
    db.serialize(() => {
        // Create all the tables if they don't exist
        for (const [name, query] of getTablesQueries()) {
            const promise = new Promise((resolve, reject) => db.run(
                query,
                function (err) {
                    if (err != null) reject(err);
                    else if (this.changes > 0)
                        info('Created table', name);
                })
            );
            promise.catch(reject);
        }

        resolve();
    });
});
