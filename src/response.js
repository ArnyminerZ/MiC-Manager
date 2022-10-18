/**
 * Generates an error response from the given code.
 * @param {"missing-parameters","wrong-credentials"} code The error code to send.
 * @returns {{success: boolean, error: {code: string}}}
 */
export const errorResponse = (code) => {
    return {success: false, error: {code: 'missing-parameters'}};
};
