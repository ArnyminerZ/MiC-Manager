import {errorResponse} from "./response.mjs";

export class MissingHeaderError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MissingHeaderError';
    }
}

/**
 * Thrown when some required parameters are not present in the body.
 * @param {string[]} missingKeys The keys that should be present.
 * @return {Response}
 */
export const missingBodyParameters = (missingKeys) => errorResponse(1, `There are some arguments missing. Missing arguments: ${missingKeys.join(', ')}`)

/**
 * Thrown when a parameter has an invalid type.
 * @param {[key:string,expectedType:string,givenType:String][]} keys All the invalid keys
 * @return {Response}
 */
export const invalidParameterTypes = (keys) => errorResponse(2, keys.map(([k, et, gt]) => `The required type for "${k}" is ${et} but you gave ${gt}`).join('\n'));

/**
 * Thrown when the given NIF is already being used by another user.
 * @return {Response}
 */
export const userAlreadyExists = () => errorResponse(3, `An user already exists for the given NIF.`);

/**
 * Thrown when the Authentication header has an invalid method.
 * @return {Response}
 */
export const unsupportedAuthenticationMethod = () => errorResponse(4, `The given authentication method is not valid. Supported methods: Bearer, Login.`);

/**
 * Thrown when the NIF-password combination is not valid.
 * @return {Response}
 */
export const wrongCredentials = () => errorResponse(5, `The NIF-password combination is not valid.`);

/**
 * Thrown when the given NIF doesn't match a valid user.
 * @return {Response}
 */
export const userNotFound = () => errorResponse(6, `There's no user that matches the given NIF.`);

/**
 * Thrown when the given token has expired, or it's not valid.
 * @return {Response}
 */
export const invalidToken = () => errorResponse(7, `The given token is not valid or has expired.`);

/**
 * Thrown when the request doesn't have a valid Authentication header.
 * @return {Response}
 */
export const missingAuthenticationHeader = () => errorResponse(8, `There's no valid Authentication header.`);
