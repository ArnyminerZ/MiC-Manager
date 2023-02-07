import {successResponse} from "../response.mjs";

/**
 *
 * @param {import('express').Request} req The express request.
 * @param {import('express').Response} res The express response.
 */
export const pingEndpoint = async (req, res) => {
    res.status(200).send(successResponse('OK'));
};
