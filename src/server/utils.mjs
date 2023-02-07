import {invalidParameterTypes, missingBodyParameters} from "./errors.mjs";

/**
 * Makes sure the body of the request contain the given arguments.
 * @param {import('express').Request} req The express request.
 * @param {import('express').Response} res The express response.
 * @param {[key:string,type:string]} args The keys of the required arguments.
 * @return {boolean} `true` if all the arguments are present, `false` otherwise.
 */
export const requireBody = (req, res, ...args) => {
    const body = req.body;
    const missingKeys = [], invalidKeys = [];

    for (const [key, type] of args) {
        if (!body.hasOwnProperty(key))
            missingKeys.push(key);
        else if (typeof body[key] !== type)
            invalidKeys.push([key, type, typeof body[key]]);
    }

    if (missingKeys.length > 0) {
        res.status(400).send(missingBodyParameters(missingKeys));
        return false;
    }
    if (invalidKeys.length > 0) {
        res.status(400).send(
            invalidParameterTypes(invalidKeys.map(([k,et,gt]) => [k, et, gt]))
        );
        return false;
    }
    return true;
};
