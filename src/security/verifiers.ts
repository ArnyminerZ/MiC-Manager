/**
 * Contains some functions for generating new hashes for transactions with the database.
 * @file verifiers.mjs
 */

import {JwtPayload} from "jsonwebtoken";

import {ONE_YEAR, sign, validate} from "./tokens";

type HashedRow = {
    TransactionHash: string,
}

/**
 * Updates the given data adding a new key called `TransactionHash`. This token expires in `10 000` years.
 * @param {Object} data The data of the other columns of the row.
 * @return {Object} The updated object.
 */
export function hash(data: Object): Object {
    // @ts-ignore
    data['TransactionHash'] = sign(data, ONE_YEAR * 10_000);
    if (data.hasOwnProperty('exp')) {
        // @ts-ignore
        delete data['exp'];
    }
    return data;
}

/**
 * Checks the contents of the given row to make sure that the column `TransactionHash` matches the contents of the row.
 * @param row The row fetched from the database.
 * @return `true` if the transaction is valid, `false` otherwise.
 */
export function check(row: HashedRow): Boolean {
    const hash = row.TransactionHash;

    const decodedData = validate(hash) as JwtPayload;
    delete decodedData.iat;
    delete decodedData.exp;

    for (const key in decodedData) {
        // @ts-ignore
        if (row[key] !== decodedData[key]) return false;
    }
    return true;
}
