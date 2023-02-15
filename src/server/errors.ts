import {errorResponse, Response} from "./response.js";

export class MissingHeaderError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MissingHeaderError';
    }
}

export class HttpRequestError extends Error {
    code: number;

    constructor(message: string, code: number) {
        super(`Got a non-successful response code from server. Code: ${code}`);
        this.code = code;
        this.name = 'HttpRequestError';
    }
}

export class InvalidContentTypeError extends Error {
    constructor(got: string, expected: string) {
        super(`Invalid content-type.\nExpected ${expected} but received ${got}`);
        this.name = 'InvalidContentTypeError';
    }
}

/**
 * Used by `invalidParameterTypes` to pass which parameters have not had a valid type.
 */
export type InvalidType = {
    /** The key of the parameter. */
    key: string,
    /** The type that was expected */
    expected: string,
    /** The type that was passed */
    given: string
}

/**
 * Used if the error thrown is not handled. Has http 500, and -1 as code.
 */
export function unknownError(error: Error|any): Response {
    return errorResponse(-1, 500, (error instanceof Error) ? error.message : error.toString());
}

/**
 * Thrown when some required parameters are not present in the body.
 * @param missingKeys The keys that should be present.
 */
export function missingBodyParameters(missingKeys: string[]) {
    return errorResponse(1, 400, `There are some arguments missing. Missing arguments: ${missingKeys.join(', ')}`);
}

/**
 * Thrown when a parameter has an invalid type.
 * @param keys All the invalid keys
 */
export function invalidParameterTypes(keys: InvalidType[]): Response {
    return errorResponse(2, 400, keys.map(({key, expected, given}) => `The required type for "${key}" is ${expected} but you gave ${given}`).join('\n'));
}

/** Thrown when the given NIF is already being used by another user. */
export function userAlreadyExists(): Response {
    return errorResponse(3, 409, `An user already exists for the given NIF.`);
}

/** Thrown when the Authentication header has an invalid method. */
export function unsupportedAuthenticationMethod(): Response {
    return errorResponse(4, 405, `The given authentication method is not valid. Supported methods: Bearer, Login.`);
}

/** Thrown when the NIF-password combination is not valid. */
export function wrongCredentials(): Response {
    return errorResponse(5, 406, `The NIF-password combination is not valid.`);
}

/** Thrown when the given NIF doesn't match a valid user. */
export function userNotFound(): Response {
    return errorResponse(6, 404, `There's no user that matches the given NIF.`);
}

/** Thrown when the given token has expired, or it's not valid. */
export function invalidToken(): Response {
    return errorResponse(7, 403, `The given token is not valid or has expired.`);
}

/** Thrown when the request doesn't have a valid Authentication header. */
export function missingAuthenticationHeader(): Response {
    return errorResponse(8, 400, `There's no valid Authentication header.`);
}

/**
 * Thrown when the request doesn't have a valid Authentication header.
 * @param {string} field The name of the field that has the wrong date format.
 * @param {string} format The format that it should have had.
 */
export function illegalDateFormat(field: string, format: string = 'YYYY-MM-dd'): Response {
    return errorResponse(9, 400, `The given format for the date at field ${field} is not valid. Valid format: ${format}`);
}

/** Thrown when the user is not verified, this is, that doesn't have the `user:usage` scope. */
export function userNotVerifiedError() {
    return errorResponse(10, 412, `The user is not verified.`);
}
