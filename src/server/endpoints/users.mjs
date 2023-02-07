import {checkAuth} from "../../users/access.mjs";
import {
    invalidToken,
    missingAuthenticationHeader,
    MissingHeaderError,
    unsupportedAuthenticationMethod,
    userNotFound,
    wrongCredentials
} from "../errors.mjs";
import {
    InvalidTokenError,
    UnsupportedAuthenticationMethodError,
    UserNotFoundError,
    WrongCredentialsError
} from "../../users/errors.mjs";
import {errorResponse, successResponseData} from "../response.mjs";

/**
 * @param {import('express').Request} req The express request.
 * @param {import('express').Response} res The express response.
 */
export const userDataEndpoint = async (req, res) => {
    try {
        const user = await checkAuth(req);
        delete user.Hash;
        // noinspection JSCheckFunctionSignatures
        user.Information = JSON.parse(user.Information);
        res.status(200).send(successResponseData(JSON.stringify(user), user));
    } catch (e) {
        if (e instanceof MissingHeaderError)
            res.status(400).send(missingAuthenticationHeader());
        else if (e instanceof InvalidTokenError)
            res.status(403).send(invalidToken());
        else if (e instanceof UserNotFoundError)
            res.status(404).send(userNotFound());
        else if (e instanceof WrongCredentialsError)
            res.status(406).send(wrongCredentials());
        else if (e instanceof UnsupportedAuthenticationMethodError)
            res.status(405).send(unsupportedAuthenticationMethod());
        else
            res.status(500).send(errorResponse(-1, e.message));
    }
};