/**
 * Generates an error response from the given code.
 * @param {"missing-parameters","wrong-credentials","invalid-key","passwordless","invalid-request"} code The error code to send.
 * @returns {{success: boolean, error: {code: string}}}
 */
export const errorResponse = (code) => {
    return {success: false, error: {code}};
};

/**
 * Generates a success response.
 * @param {Object} data The data to append to the response
 * @returns {{success: boolean}}
 */
export const successResponse = (data = null) => {
    if (data != null)
        return {success: true, data};
    return {success: true}
};
