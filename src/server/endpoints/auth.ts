import {Request, Response} from "express";

import {requireBody} from "../utils";
import {successResponse} from "../response";
import {register} from "../../users/registration";
import {
    UserAlreadyExistsError,
    UserNotFoundError,
    UserNotVerifiedError,
    WrongCredentialsError
} from "../../users/errors";
import {
    illegalDateFormat,
    unknownError,
    userAlreadyExists,
    userNotFound,
    userNotVerifiedError,
    wrongCredentials
} from "../errors";
import {login} from "../../users/access";
import {IllegalDateFormatException} from "../../errors";

/**
 * @param req The express request.
 * @param res The express response.
 */
export async function registerEndpoint(req: Request, res: Response) {
    const allArgumentsOk = requireBody(req, res, ['password', 'string'], ['name', 'string'], ['surname', 'string'], ['nif', 'string'], ['email', 'string'], ['information', 'object']);
    if (!allArgumentsOk) return;

    const {password, name, surname, nif, email, information} = req.body;
    try {
        await register(password, name, surname, nif, email, JSON.stringify(information));

        successResponse('OK').send(res);
    } catch (e) {
        if (e instanceof UserAlreadyExistsError)
            userAlreadyExists().send(res);
        else if (e instanceof IllegalDateFormatException)
            illegalDateFormat('information.birthday').send(res);
        else
            unknownError(e).send(res);
    }
}

/**
 * @param req The express request.
 * @param res The express response.
 */
export const loginEndpoint = async (req: Request, res: Response) => {
    const allArgumentsOk = requireBody(req, res, ['password', 'string'], ['nif', 'string']);
    if (!allArgumentsOk) return;

    const {password, nif} = req.body;
    try {
        const token = await login(nif, password);
        successResponse(token).send(res);
    } catch (error) {
        if (error instanceof UserNotFoundError)
            userNotFound().send(res);
        else if (error instanceof WrongCredentialsError)
            wrongCredentials().send(res);
        else if (error instanceof UserNotVerifiedError)
            userNotVerifiedError().send(res);
        else
            unknownError(error).send(res);
    }
};
