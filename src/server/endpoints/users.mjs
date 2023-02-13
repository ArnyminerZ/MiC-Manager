import VCard from 'vcard-creator';

import {checkAuth} from "../../users/access.mjs";
import {
    invalidToken,
    missingAuthenticationHeader,
    MissingHeaderError,
    unsupportedAuthenticationMethod,
    userNotFound,
    userNotVerifiedError,
    wrongCredentials
} from "../errors.mjs";
import {
    InvalidTokenError,
    UnsupportedAuthenticationMethodError,
    UserNotFoundError,
    UserNotVerifiedError,
    WrongCredentialsError
} from "../../users/errors.mjs";
import {errorResponse, successResponseData} from "../response.mjs";
import {error} from "../../../cli/logger.mjs";

/**
 * @param {import('express').Request} req The express request.
 * @param {import('express').Response} res The express response.
 */
export const userDataEndpoint = async (req, res) => {
    const contentType = req.header("Content-Type") ?? 'application/json';

    try {
        const user = await checkAuth(req);
        delete user.Hash;
        // noinspection JSCheckFunctionSignatures
        user.Information = JSON.parse(user.Information);
        if (contentType === 'text/x-vcard') {
            const card = new VCard.default();

            // Add all the default parameters
            card.addName(user.Surname, user.Name)
                .addEmail(user.Email)
                .addNickname(user.NIF);

            // Add all the extra properties
            const birthday = user.Information.birthday;
            if (birthday != null) card.addBirthday(birthday);
            const phone = user.Information.phone;
            if (phone != null && phone.length > 0)
                for (const [type, number] of phone)
                    card.addPhoneNumber(number, type);

            // Return the resulting vCard
            res.status(200).contentType('text/x-vcard').send(card.toString());
        } else
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
        else if (e instanceof UserNotVerifiedError)
            res.status(412).send(userNotVerifiedError());
        else if (e instanceof UnsupportedAuthenticationMethodError)
            res.status(405).send(unsupportedAuthenticationMethod());
        else {
            error(e);
            res.status(500).send(errorResponse(-1, e.message));
        }
    }
};