import {getQueries as getTablesQueries} from "../../../db/tables";

import sqlite3, {Database} from 'sqlite3';
import {info} from "../../../cli/logger";

export let db: Database;

/** Initializes the database, creating all the required tables if necessary. */
export async function initDatabase() {
    return new Promise<void>((resolve, reject) => {
        if (db != null) return resolve();

        const file = process.env.SQLITE_FILE ?? ':memory:';
        info('DATABASE > Booting into', file);
        db = new sqlite3.Database(file);
        db.serialize(() => {
            // Create all the tables if they don't exist
            for (const {queries} of getTablesQueries())
                for (const query of queries) {
                    const promise = new Promise((resolve, reject) => db.run(
                        query,
                        function (err) {
                            if (err != null) reject(err);
                            else if (this.changes > 0) {
                                info('DATABASE > Updated', this.changes, 'fields.');
                                // log('SQL >', query);
                            }
                        })
                    );
                    promise.catch(reject);
                }

            resolve();
        });
    });
}
