/**
 * @param {string} ip The IP to parse.
 * @returns {number}
 */
export const ipToLong = (ip) => {
    let ipl = 0;
    ip.split('.').forEach(function (octet) {
        ipl <<= 8;
        ipl += parseInt(octet);
    });
    return (ipl >>> 0);
}

/**
 * Checks if a given value is a number.
 * @param {string} value The value to check against
 * @returns {boolean}
 */
export const isNumber = value => /^-?\d+$/.test(value);
