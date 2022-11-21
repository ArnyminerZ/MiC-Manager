/**
 * Generates an error response from the given code.
 * @param {"missing-parameters","wrong-credentials","invalid-key","passwordless","invalid-request","max-attempts-reached","not-found","unauthorised","not-allowed","conflict","internal",Error} code The error code to send.
 * @param {string|null} message An additional message to give to the error.
 * @returns {{success: boolean, error: {code: string}}}
 */
export const errorResponse = (code, message = null) => {
    const r = {success: false, error: {code}};
    if (message != null) r.message = message;
    return r;
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
