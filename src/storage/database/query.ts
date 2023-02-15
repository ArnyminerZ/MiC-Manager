import {db} from "./init";

/**
 * Runs a SQL query that should give an answer.
 * @param sql The query to run.
 * @param params Parameters to replace in the query.
 */
export function query(sql: string, ...params: any): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
        let builder: any[] = [];
        db.each(sql, [...params], function (err, row) {
            if (err == null) builder.push(row);
        }, function (err) {
            if (err != null) reject(err);
            else resolve(builder);
        });
    });
}

/**
 * Creates an INSERT query into the given table of the database.
 * @param database The name of the database.
 * @param row The data of the row to insert. Keys indicate column names, and values their respective values.
 */
export function insert(database: string, row: Object): Promise<any[]> {
    const keys = Object.keys(row);
    const values = Object.values(row);
    const columns = keys.join(', ');
    const placeholderValues = [...Array(values.length).keys()];

    return query(`INSERT INTO ${database} (${columns}) VALUES (${placeholderValues})`, ...values);
}
