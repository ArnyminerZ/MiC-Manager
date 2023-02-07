import {exists as userExists} from "./management.mjs";
import {UserAlreadyExistsError} from "./errors.mjs";
import {query} from "../storage/database/query.mjs";
import {hash} from "../security/cryptography.mjs";

/**
 * Registers a new user in the database.
 * @param password
 * @param name
 * @param surname
 * @param nif
 * @param email
 * @param information
 * @throws {UserAlreadyExistsError} If there's already a user registered with the given `nif`.
 * @return {Promise<void>}
 */
export const register = async (password, name, surname, nif, email, information) => {
    if (await userExists(nif)) throw new UserAlreadyExistsError(`There's already an user registered with the NIF "${nif}"`);

    const passwordHash = hash(password);
    await query("INSERT INTO Users (Hash, Name, Surname, NIF, Email, Information) VALUES (?, ?, ?, ?, ?, ?)", passwordHash, name, surname, nif, email, JSON.stringify(information));
};
