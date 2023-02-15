import {findById, findByNif, hasScope} from "./management";
import {verify} from "../security/cryptography";
import {
    InvalidTokenError,
    UnsupportedAuthenticationMethodError,
    UserNotFoundError,
    UserNotVerifiedError,
    WrongCredentialsError
} from "./errors";
import {sign, validate} from "../security/tokens";
import {insert, query} from "../storage/database/query";
import {MissingHeaderError} from "../server/errors";
import {check, hash} from "../security/verifiers";
import {Request as ExpressRequest} from "express";
import {StateError} from "../errors";

/**
 * Creates a new access token for the given user.
 * @return The generated Access Token.
 */
export async function newAccessToken(user: User): Promise<string> {
    // Generate an access token
    const token = sign({NIF: user.NIF});

    // Sign the transaction
    const row = hash({AccessToken: token, UserId: user.Id});

    // Insert it into the database
    await insert('AccessTokens', row);

    return token;
}

/**
 * Checks that the nif-password combination is correct. And makes sure the user is confirmed.
 * @throws {UserNotFoundError} If there's no user with the given `nif`.
 * @throws {WrongCredentialsError} If the given NIF-password combination is not correct.
 * @throws {UserNotVerifiedError} If the user is not verified. This is, that doesn't have the `user:usage` scope.
 */
async function authorizeUser(nif: string, password: string): Promise<User> {
    const user = await findByNif(nif);

    if (user == null) throw new UserNotFoundError(`There's no registered user with NIF ${nif}`);
    if (user.Hash == null) throw new StateError('The user obtained did not have a valid hash.');

    // Check that the password is correct
    if (!verify(password, user.Hash)) throw new WrongCredentialsError("The given NIF-password combination is not correct.");

    // Check that the user has the `user:usage` scope
    if (!await hasScope(user.Id, 'user:usage')) throw new UserNotVerifiedError(`The user with id ${user.Id} doesn't have the "user:usage" scope.`);

    return user;
}

/**
 * Tries to log in with the given NIF and password. If the combination is correct, generates a new access token and
 * returns it.
 * @throws {UserNotFoundError} If there's no user with the given `nif`.
 * @throws {WrongCredentialsError} If the given NIF-password combination is not correct.
 * @throws {UserNotVerifiedError} If the user is not verified. This is, that doesn't have the `user:usage` scope.
 */
export async function login(nif: string, password: string): Promise<string> {
    const user = await authorizeUser(nif, password);
    return await newAccessToken(user);
}

/**
 * Checks that the given request has a valid authentication header, and that it is correct.
 * @param {import('express').Request} req The express request.
 * @return {User}
 * @throws {MissingHeaderError} If the Authentication header is not present.
 * @throws {InvalidTokenError} If the given token is not valid, or has expired.
 * @throws {UserNotFoundError} If the user that matches the given token doesn't exist.
 * @throws {WrongCredentialsError} If the given NIF-password combination is not correct.
 * @throws {UserNotVerifiedError} If the user is not verified. This is, that doesn't have the `user:usage` scope.
 * @throws {UnsupportedAuthenticationMethodError} If the authentication method given in the header is not valid.
 */
export async function checkAuth(req: ExpressRequest): Promise<User> {
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
        return await authorizeUser(nif, password);
    } else if (method.toUpperCase() === 'BEARER') {
        // Get the user id for the given token
        /** @type {AccessToken[]} */
        const data = await query("SELECT * FROM AccessTokens WHERE AccessToken=? LIMIT 1;", value);
        if (data == null || data.length <= 0) throw new InvalidTokenError(`The passed token is not valid.`);
        const token = data[0];

        // Check that the token has not expired
        let isValid;
        try {
            validate(token.AccessToken);
            isValid = true;
        } catch (e) {
            isValid = false;
        }

        // Check that the token row signature is correct
        if (isValid === true) isValid = check(token);

        // Check that the token is valid, or remove it and throw
        if (!isValid) {
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
}
