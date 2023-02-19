import vCardsJS from 'vcards-js';

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
    CategoryNotFoundError,
    InvalidTokenError,
    UnsupportedAuthenticationMethodError,
    UserNotFoundError,
    UserNotVerifiedError,
    WrongCredentialsError
} from "../../users/errors";
import {successResponseData} from "../response";
import {error} from "../../../cli/logger";

import {Request, Response} from "express";
import {setCategory} from "../../users/management";
import {requireBody} from "../utils";

function handleCheckAuth(e: unknown, res: Response): Boolean {
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
    else return false;
    return true;
}

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
            const card = vCardsJS();

            // Add all the default parameters
            card.firstName = user.Name;
            card.lastName = user.Surname;
            card.email = user.Email;
            card.nickname = user.NIF;

            // Add all the extra properties
            const information = user.Information as UserInformation
            const birthday = information.birthday;
            if (birthday != null) card.birthday = new Date(birthday);
            const phone = information.phone;
            if (phone != null && phone.length > 0)
                for (const [type, number] of phone)
                    switch (type) {
                        case PhoneType.cell: {
                            card.cellPhone = number;
                            break;
                        }
                        case PhoneType.home: {
                            card.homePhone = number;
                            break;
                        }
                        case PhoneType.pager: {
                            card.pagerPhone = number;
                            break;
                        }
                        case PhoneType.voice: {
                            card.workPhone = number;
                            break;
                        }
                        default: {
                            if (card.otherPhone == null)
                                card.otherPhone = [number];
                            else {
                                let phones = card.otherPhone;
                                if (phones instanceof String)
                                    phones = [phones as string, number]
                                else
                                    (phones as string[]).push(number);
                                card.otherPhone = phones;
                            }
                            break;
                        }
                    }

            // Return the resulting vCard
            res.status(200).contentType('text/x-vcard').send(card.getFormattedString());
        } else
            successResponseData(JSON.stringify(user), user).send(res);
    } catch (e) {
        if (!handleCheckAuth(e, res)) {
            error(e as any);
            unknownError(e).send(res);
        }
    }
};

export async function setUserCategoryEndpoint(req: Request, res: Response) {
    if (!requireBody(req, res, ['category', 'string'])) return;
    const {category} = req.body;

    try {
        const user: User = await checkAuth(req);
        await setCategory(user.Id, category);
        successResponseData('Changed user category').send(res);
    } catch (e) {
        if (handleCheckAuth(e, res)) return
        if (e instanceof CategoryNotFoundError)
            userNotFound().send(res);
        else {
            error(e as any);
            unknownError(e).send(res);
        }
    }
}
