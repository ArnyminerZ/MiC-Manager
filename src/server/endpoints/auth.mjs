import {requireBody} from "../utils.mjs";
import {errorResponse, successResponse} from "../response.mjs";
import {register} from "../../users/registration.mjs";
import {UserAlreadyExistsError} from "../../users/errors.mjs";
import {userAlreadyExists} from "../errors.mjs";
import {login} from "../../users/access.mjs";

/**
 * @param {import('express').Request} req The express request.
 * @param {import('express').Response} res The express response.
 */
export const registerEndpoint = async (req, res) => {
    const allArgumentsOk = requireBody(req, res, ['password', 'string'], ['name', 'string'], ['surname', 'string'], ['nif', 'string'], ['email', 'string'], ['information', 'object']);
    if (!allArgumentsOk) return;

    const {password, name, surname, nif, email, information} = req.body;
    try {
        await register(password, name, surname, nif, email, information);

        res.status(200).send(successResponse('OK'));
    } catch (e) {
        if (e instanceof UserAlreadyExistsError)
            res.status(406).send(userAlreadyExists);
        else
            res.status(500).send(errorResponse(-1, e.message));
    }
};

/**
 * @param {import('express').Request} req The express request.
 * @param {import('express').Response} res The express response.
 */
export const loginEndpoint = async (req, res) => {
    const allArgumentsOk = requireBody(req, res, ['password', 'string'], ['nif', 'string']);
    if (!allArgumentsOk) return;

    const {password, nif} = req.body;

    res.status(200).send(successResponse((await login(nif, password)).toString()))
};
