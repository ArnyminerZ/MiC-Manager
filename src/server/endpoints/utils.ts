import {successResponse} from "../response";

import {Request, Response} from "express";

/**
 * @param req The express request.
 * @param res The express response.
 */
export const pingEndpoint = async (req: Request, res: Response) => {
    res.status(200).send(successResponse('OK'));
};
