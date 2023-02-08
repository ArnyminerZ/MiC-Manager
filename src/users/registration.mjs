import {exists as userExists} from "./management.mjs";
import {UserAlreadyExistsError} from "./errors.mjs";
import {query} from "../storage/database/query.mjs";
import {hash} from "../security/cryptography.mjs";
import {IllegalDateFormatException} from "../errors.mjs";
import {isValidDate} from "../utils.mjs";

/**
 * Registers a new user in the database.
 * @param {string} password
 * @param {string} name
 * @param {string} surname
 * @param {string} nif
 * @param {string} email
 * @param {string} information
 * @throws {UserAlreadyExistsError} If there's already a user registered with the given `nif`.
 * @throws {IllegalDateFormatException} If the given birthday date does not follow the correct format.
 * @return {Promise<void>}
 */
export const register = async (password, name, surname, nif, email, information) => {
    if (await userExists(nif)) throw new UserAlreadyExistsError(`There's already an user registered with the NIF "${nif}"`);

    /** @type {UserInformation} */
    const info = JSON.parse(information);

    // Check that all phones have a prefix
    const phones = info.phone;
    if (phones != null && phones.length > 0) {
        for (const index in phones) {
            let [type, number] = phones[index];
            if (!number.startsWith('+')) number = '+' + process.env.PHONE_REGION + number;
            phones[index] = [type, number];
        }
    }

    // Check that the date format is correct
    const birthday = info.birthday;
    if (!isValidDate(birthday)) throw new IllegalDateFormatException(`The given birthday date is not valid: ${birthday}`);

    const passwordHash = hash(password);
    await query("INSERT INTO Users (Hash, Name, Surname, NIF, Email, Information) VALUES (?, ?, ?, ?, ?, ?)", passwordHash, name, surname, nif, email, JSON.stringify(info));
};
