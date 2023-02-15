import {UserAlreadyExistsError} from "./errors";
import {isValidDate} from "../utils";
import {IllegalDateFormatException} from "../errors";
import {create, exists} from "./management";

/**
 * Registers a new user in the database.
 * @throws {UserAlreadyExistsError} If there's already a user registered with the given `nif`.
 * @throws {IllegalDateFormatException} If the given birthday date does not follow the correct format.
 */
export async function register(password: string, name: string, surname: string, nif: string, email: string, information: string) {
    if (await exists(nif)) throw new UserAlreadyExistsError(`There's already an user registered with the NIF "${nif}"`);

    const info: UserInformation = JSON.parse(information);

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
    if (birthday != null && !isValidDate(birthday)) throw new IllegalDateFormatException(`The given birthday date is not valid: ${birthday}`);

    await create(password, name, surname, nif, email, info);
}
