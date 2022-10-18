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
