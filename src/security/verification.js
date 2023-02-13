/**
 * Provides some functions that allow verifying transactions made in the database. Those are all transactions in the
 * database that have the `TransactionHash` column.
 * @file verification.js
 */

/**
 * @callback VerificationFunction
 * @param {Object} data The data stored in the hash.
 * @return {Boolean} `true` if the data is correct, `false` otherwise.
 */

import {verify} from "./cryptography.mjs";

/**
 * Verifies that a transaction has a valid hash, and that it's valid.
 * @param {Object} row The row to verify.
 * @param {VerificationFunction} verification A function that verifies if the transaction is valid.
 */
const verifyTransaction = (row, verification = () => true) => {
    const decoded = verify(row.TransactionHash)
};
