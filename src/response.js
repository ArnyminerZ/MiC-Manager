/**
 * Generates an error response from the given code.
 * @param {"missing-parameters","wrong-credentials","invalid-key","passwordless"} code The error code to send.
 * @returns {{success: boolean, error: {code: string}}}
 */
export const errorResponse = (code) => {
    return {success: false, error: {code}};
};

/**
 * Generates a success response.
 * @returns {{success: boolean}}
 */
export const successResponse = () => {
    return {success: true};
};
