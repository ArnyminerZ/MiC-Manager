import {db} from "./init.mjs";

/**
 * Runs a SQL query that should give an answer.
 * @param {string} sql The query to run.
 * @param {*} params Parameters to replace in the query.
 * @return {Promise<[]>}
 */
export const query = (sql, ...params) => new Promise((resolve, reject) => {
    let builder = [];
    db.each(sql, [...params], function (err, row) {
        if (err == null) builder.push(row);
    }, function (err) {
        if (err != null) reject(err);
        else resolve(builder);
    });
});

/**
 * Creates an INSERT query into the given table of the database.
 * @param {string} database The name of the database.
 * @param {Object} row The data of the row to insert. Keys indicate column names, and values their respective values.
 * @return {Promise<[]>}
 */
export const insert = async (database, row) => {
    const keys = Object.keys(row);
    const values = Object.values(row);
    const columns = keys.join(', ');
    const placeholderValues = [...Array(values.length).keys()];

    return await query(`INSERT INTO ${database} (${columns}) VALUES (${placeholderValues})`, ...values);
};
