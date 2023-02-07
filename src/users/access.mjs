import {findById, findByNif} from "./management.mjs";
import {verify} from "../security/cryptography.mjs";
import {
    InvalidTokenError,
    UnsupportedAuthenticationMethodError,
    UserNotFoundError,
    WrongCredentialsError
} from "./errors.mjs";
import {sign, validate} from "../security/tokens.mjs";
import {query} from "../storage/database/query.mjs";
import {MissingHeaderError} from "../server/errors.mjs";

/**
 * Tries to log in with the given password. Checks that the NIF exists, and that the password is correct.
 * @param {string} nif
 * @param {string} password
 * @throws {UserNotFoundError} If there's no user with the given `nif`.
 * @throws {WrongCredentialsError} If the given NIF-password combination is not correct.
 * @return {Promise<User>}
 */
const tryToLogin = async (nif, password) => {
    const user = await findByNif(nif);

    if (user == null) throw new UserNotFoundError(`There's no registered user with NIF ${nif}`);

    // Check that the password is correct
    if (!verify(password, user.Hash)) throw new WrongCredentialsError("The given NIF-password combination is not correct.");

    return user;
};

/**
 * Tries to log in with the given NIF and password.
 * @param {string} nif
 * @param {string} password
 * @throws {UserNotFoundError} If there's no user with the given `nif`.
 * @throws {WrongCredentialsError} If the given NIF-password combination is not correct.
 */
export const login = async (nif, password) => {
    const user = await tryToLogin(nif, password);

    // Generate an access token
    const token = sign({nif});

    // Insert it into the database
    await query('INSERT INTO AccessTokens (AccessToken, UserId) VALUES (?, ?)', token, user.Id);

    return token;
};

/**
 * Checks that the given request has a valid authentication header, and that it is correct.
 * @param {import('express').Request} req The express request.
 * @return {User}
 * @throws {MissingHeaderError} If the Authentication header is not present.
 * @throws {InvalidTokenError} If the given token is not valid, or has expired.
 * @throws {UserNotFoundError} If the user that matches the given token doesn't exist.
 * @throws {WrongCredentialsError} If the given NIF-password combination is not correct.
 * @throws {UnsupportedAuthenticationMethodError} If the authentication method given in the header is not valid.
 */
export const checkAuth = async (req) => {
    const authHeader = req.header("Authorization");
    if (authHeader == null) throw new MissingHeaderError(`It's required to give the Authentication header.`);

    const auth = authHeader.trimStart().split(' ');
    const method = auth[0];
    const value = auth.slice(1).join(' ');

    if (method.toUpperCase() === 'LOGIN') {
        // Divide the credentials
        const separatorPos = value.indexOf(':');
        const [nif, password] = [value.substring(0, separatorPos), value.substring(separatorPos + 1)];

        // Check if credentials are valid
        return await tryToLogin(nif, password);
    } else if (method.toUpperCase() === 'BEARER') {
        // Get the user id for the given token
        /** @type {AccessToken[]} */
        const data = await query("SELECT * FROM AccessTokens WHERE AccessToken=? LIMIT 1;", value);
        if (data == null || data.length <= 0) throw new InvalidTokenError(`The passed token is not valid.`);
        const token = data[0];

        // Check that the token has not expired
        if (!validate(token.AccessToken)) {
            // If the token is not valid, remove it
            await query("DELETE FROM AccessTokens WHERE Id=?;", token.Id);
            // And throw an exception
            throw new InvalidTokenError('The token has expired.');
        }

        // Get the user data
        const user = await findById(token.UserId);
        if (user == null) throw new UserNotFoundError(`Could not find an user with id ${token.UserId}`);
        return user;
    } else
        throw new UnsupportedAuthenticationMethodError(`The given authentication method (${method}) is not supported. Supported methods: Login, Bearer.`);
};
