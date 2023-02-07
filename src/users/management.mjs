import {query} from "../storage/database/query.mjs";

/**
 * Checks if a user with the given NIF exists.
 * @param {string} nif The NIF to search for.
 * @return {Promise<boolean>} Whether the user exists.
 */
export const exists = async (nif) => {
    /** @type {User[]} */
    const u = await query('SELECT * FROM Users;');
    if (u.length <= 0) return false;
    return u.find(value => nif === value.NIF) != null;
};

/**
 * Tries searching for a user with the given NIF.
 * @param {string} nif The NIF of the user to search for.
 * @return {Promise<?User>}
 */
export const findByNif = async (nif) => {
    /** @type {User[]} */
    const users = await query('SELECT * FROM Users WHERE NIF=? LIMIT 1;', nif);
    if (users.length <= 0) return null;
    return users[0];
};

/**
 * Tries searching for a user with the given ID.
 * @param {number} id The ID of the user to search for.
 * @return {Promise<?User>}
 */
export const findById = async (id) => {
    /** @type {User[]} */
    const users = await query('SELECT * FROM Users WHERE Id=? LIMIT 1;', id);
    if (users.length <= 0) return null;
    return users[0];
};
