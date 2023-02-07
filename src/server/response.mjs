/**
 * @typedef {string} Response
 * @property {boolean} success Whether the request was successful or not.
 * @property {number} code The response code. It's 0 for successful responses.
 * @property {string} message The response message.
 */

/**
 * Represents a success response.
 * @param {string} message The response message.
 * @return {Response}
 */
export const successResponse = (message) => {
    return { success: true, code: 0, message };
};

/**
 * Represents a success response with some resulting data.
 * @param {string} message The response message.
 * @param {Object} data The response data.
 * @return {Response}
 */
export const successResponseData = (message, data) => {
    return { success: true, code: 0, message, data };
};

/**
 * Represents an error response message.
 * @param {number} code The code of the error.
 * @param {string} message An auxiliary message that describes a bit about the error.
 * @return {Response}
 */
export const errorResponse = (code, message) => {
    return { success: false, code, message };
};
