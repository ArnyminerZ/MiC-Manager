/**
 * Contains some functions for generating new hashes for transactions with the database.
 * @file verifiers.mjs
 */

import {ONE_YEAR, sign, validate} from "./tokens.mjs";

/**
 * Updates the given data adding a new key called `TransactionHash`. This token expires in `10 000` years.
 * @param {Object} data The data of the other columns of the row.
 * @return {Object} The updated object.
 */
export const hash = (data) => {
    data['TransactionHash'] = sign(data, ONE_YEAR * 10_000);
    return data;
};

/**
 * Checks the contents of the given row to make sure that the column `TransactionHash` matches the contents of the row.
 * @param {Object} row The row fetched from the database.
 * @return {Boolean} `true` if the transaction is valid, `false` otherwise.
 */
export const check = (row) => {
    /** @type {string} */
    const hash = row['TransactionHash'];

    const decodedData = validate(hash);
    delete decodedData.iat;
    delete decodedData.exp;

    for (const key in decodedData)
        if (row[key] !== decodedData[key]) return false;
    return true;
};
