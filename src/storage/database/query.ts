import {db} from "./init";
import {error, log} from "../../../cli/logger";

/**
 * Runs a SQL query that should give an answer.
 * @param sql The query to run.
 * @param params Parameters to replace in the query.
 */
export function query(sql: string, ...params: any): Promise<any[]> {
    log('SQL >', sql);
    return new Promise<any[]>((resolve, reject) => {
        let builder: any[] = [];
        db.each(sql, [...params], function (err, row) {
            if (err == null) builder.push(row);
            else error('SQL >', err);
        }, function (err) {
            if (err != null) reject(err);
            else {
                log('SQL >', builder);
                resolve(builder);
            }
        });
    });
}

/**
 * Creates an INSERT query into the given table of the database.
 * @param database The name of the database.
 * @param row The data of the row to insert. Keys indicate column names, and values their respective values.
 * @return A promise that runs the query, and returns the amount of updated rows.
 */
export function insert(database: TablesNames, row: Object): Promise<number> {
    const keys = Object.keys(row);
    const values = Object.values(row);
    const columns = keys.join(', ');
    const placeholderValues = [...Array(values.length).keys()].map(() => '?');

    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO ${database} (${columns}) VALUES (${placeholderValues})`, values, function (err) {
            if (err == null) resolve(this.changes);
            else reject(err);
        });
    });
}
