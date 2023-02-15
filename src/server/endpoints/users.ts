import VCard from 'vcard-creator';

import {checkAuth} from "../../users/access";
import {
    invalidToken,
    missingAuthenticationHeader,
    MissingHeaderError,
    unknownError,
    unsupportedAuthenticationMethod,
    userNotFound,
    userNotVerifiedError,
    wrongCredentials
} from "../errors";
import {
    InvalidTokenError,
    UnsupportedAuthenticationMethodError,
    UserNotFoundError,
    UserNotVerifiedError,
    WrongCredentialsError
} from "../../users/errors";
import {successResponseData} from "../response";
import {error} from "../../../cli/logger";

import {Request, Response} from "express";

/**
 * @param req The express request.
 * @param res The express response.
 */
export const userDataEndpoint = async (req: Request, res: Response) => {
    const contentType = req.header("Content-Type") ?? 'application/json';

    try {
        const user = await checkAuth(req);
        delete user.Hash;
        if (user.Information instanceof String)
            user.Information = JSON.parse(user.Information as string);
        if (contentType === 'text/x-vcard') {
            const card = new VCard();

            // Add all the default parameters
            card.addName(user.Surname, user.Name)
                .addEmail(user.Email)
                .addNickname(user.NIF);

            // Add all the extra properties
            const information = user.Information as UserInformation
            const birthday = information.birthday;
            if (birthday != null) card.addBirthday(birthday);
            const phone = information.phone;
            if (phone != null && phone.length > 0)
                for (const [type, number] of phone)
                    card.addPhoneNumber(number, type);

            // Return the resulting vCard
            res.status(200).contentType('text/x-vcard').send(card.toString());
        } else
            successResponseData(JSON.stringify(user), user).send(res);
    } catch (e) {
        if (e instanceof MissingHeaderError)
            missingAuthenticationHeader().send(res);
        else if (e instanceof InvalidTokenError)
            invalidToken().send(res);
        else if (e instanceof UserNotFoundError)
            userNotFound().send(res);
        else if (e instanceof WrongCredentialsError)
            wrongCredentials().send(res);
        else if (e instanceof UserNotVerifiedError)
            userNotVerifiedError().send(res);
        else if (e instanceof UnsupportedAuthenticationMethodError)
            unsupportedAuthenticationMethod().send(res);
        else {
            error(e as any);
            unknownError(e).send(res);
        }
    }
};