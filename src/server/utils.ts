import {invalidParameterTypes, InvalidType, missingBodyParameters} from "./errors";

import {Request, Response} from "express";

/**
 * Makes sure the body of the request contain the given arguments.
 * @param req The express request.
 * @param res The express response.
 * @param args The keys of the required arguments.
 * @return {boolean} `true` if all the arguments are present, `false` otherwise.
 */
export const requireBody = (req: Request, res: Response, ...args: [key:string,type:string][]) => {
    const body = req.body;
    const missingKeys = [], invalidKeys: InvalidType[] = [];

    for (const [key, type] of args) {
        if (!body.hasOwnProperty(key))
            missingKeys.push(key);
        else if (typeof body[key] !== type)
            invalidKeys.push({key, expected: type, given: typeof body[key]});
    }

    if (missingKeys.length > 0) {
        missingBodyParameters(missingKeys).send(res);
        return false;
    }
    if (invalidKeys.length > 0) {
        invalidParameterTypes(invalidKeys).send(res);
        return false;
    }
    return true;
};
