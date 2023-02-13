import {getQueries as getTablesQueries} from "../../../db/tables.mjs";

import sqlite3 from 'sqlite3';
import {info, log} from "../../../cli/logger.mjs";

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
        for (const [_, queries] of getTablesQueries())
            for (const query of queries) {
                const promise = new Promise((resolve, reject) => db.run(
                    query,
                    function (err) {
                        if (err != null) reject(err);
                        else if (this.changes > 0) {
                            info('DATABASE > Updated', this.changes, 'fields.');
                            log('SQL >', query);
                        }
                    })
                );
                promise.catch(reject);
            }

        resolve();
    });
});
