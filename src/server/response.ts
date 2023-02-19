import {Response as ExpressResponse} from 'express';

/**
 * Defines a response to be given by the server.
 */
export class Response {
    /** If the request has been successful. If `true`, `code` will always be `0`. */
    success: boolean
    /** The response code. Will be `0` if successful, or an error code otherwise. */
    code: number
    /** A http response code associated with the error. Usually `200` for successful responses. */
    httpCode: number
    /** Some feedback message of the request, can also be an explanation of the error if any. */
    message: string
    /** Some result data if any. Is usually none when an error occurs. */
    data: Object | null | undefined

    constructor(success: boolean, code: number, httpCode: number, message: string, data: Object | null | undefined) {
        this.success = success;
        this.code = code;
        this.httpCode = httpCode;
        this.message = message;
        this.data = data;
    }

    /**
     * Sends the response to the given
     * @param res The buffer for responding provided by the Express server.
     */
    send(res: ExpressResponse) {
        res.status(this.httpCode)
            .json({success:this.success, code: this.code, message: this.message, data: this.data});
    }
}

/**
 * Represents a success response.
 * @param message The response message.
 * @param httpCode The HTTP code associated with the response.
 */
export function successResponse(message: string, httpCode: number = 200): Response {
    return new Response(true, 0, httpCode, message, undefined);
}

/**
 * Represents a success response with some resulting data.
 * @param message The response message.
 * @param data The response data.
 * @param httpCode The HTTP code associated with the response.
 */
export function successResponseData(message: string, data: Object | null | undefined = null, httpCode: number = 200): Response {
    return new Response(true, 0, httpCode, message, data);
}

/**
 * Represents an error response message.
 * @param code The code of the error.
 * @param httpCode The HTTP code associated with the response.
 * @param message An auxiliary message that describes a bit about the error.
 */
export function errorResponse(code: number, httpCode: number, message: string|Error): Response {
    return new Response(false, code, httpCode, message instanceof Error ? message.message : message, undefined);
}
