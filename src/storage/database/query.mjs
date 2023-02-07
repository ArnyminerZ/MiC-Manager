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
