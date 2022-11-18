/**
 * @callback PostCallback
 * @param {Object} err
 * @param {Object} res
 */

import chai from "chai";
import chaiHttp from "chai-http";

let server;

const expect = chai.expect;
chai.use(chaiHttp);

export const init = (reqServer) => server = reqServer;

/**
 * Creates a post request to the given endpoint.
 * @author Arnau Mora
 * @since 20221117
 * @param {string} endpoint
 * @param {Object} body
 * @param {PostCallback?} assert
 * @param {Map<string, string>} headers
 * @return {(function(*): void)|*}
 */
export const post = (endpoint, body, assert, headers = new Map()) => {
    return (done) => {
        let request = chai.request(server)
            .post(endpoint);
        for (let [key, value] of headers)
            request = request.set(key, value);
        request
            .send(body)
            .end((err, res) => {
                if (assert != null) assert(err, res);
                done();
            });
    };
};

/**
 * Creates a get request to the given endpoint.
 * @author Arnau Mora
 * @since 20221117
 * @param {string} endpoint
 * @param {PostCallback?} assert
 * @param {Map<string, string>} headers
 * @return {(function(*): void)|*}
 */
export const get = (endpoint, assert, headers = new Map()) => {
    return (done) => {
        let request = chai.request(server)
            .get(endpoint);
        for (let [key, value] of headers)
            request = request.set(key, value);
        request
            .send()
            .end((err, res) => {
                if (assert != null) assert(err, res);
                done();
            });
    };
};

/**
 * Makes a post request to the given endpoint adding authorisation headers.
 * @author Arnau Mora
 * @since 20221118
 * @param {string} endpoint
 * @param {Object} body
 * @param {string} token
 * @param {PostCallback?} assert
 * @return {(function(*): void)|*}
 * @see token
 * @see post
 */
export const authPost = (endpoint, body, token, assert) => {
    expect(token).to.not.be.null;
    expect(token).to.not.be.undefined;
    return post(endpoint, body, assert, new Map([['API-Key', token]]));
};

/**
 * Makes a get request to the given endpoint adding authorisation headers.
 * @author Arnau Mora
 * @since 20221118
 * @param {string} endpoint
 * @param {string} token
 * @param {PostCallback?} assert
 * @return {(function(*): void)|*}
 * @see token
 * @see post
 */
export const authGet = (endpoint, token, assert) => {
    expect(token).to.not.be.null;
    expect(token).to.not.be.undefined;
    return get(endpoint, assert, new Map([['API-Key', token]]));
};

export const postForStatus = (endpoint, body, expectedStatus, invert = false) => post(endpoint, body, (err, res) => {
    if (invert)
        expect(res).to.not.have.status(expectedStatus);
    else
        expect(res).to.have.status(expectedStatus);
});

export const authPostForStatus = (endpoint, body, token, expectedStatus, invert = false) => {
    expect(token).to.not.be.null;
    expect(token).to.not.be.undefined;
    return authPost(endpoint, body, token, (err, res) => {
        if (invert)
            expect(res).to.not.have.status(expectedStatus);
        else
            expect(res).to.have.status(expectedStatus);
    });
};

export const getForStatus = (endpoint, expectedStatus, invert = false) => get(endpoint, (err, res) => {
    if (invert)
        expect(res).to.not.have.status(expectedStatus);
    else
        expect(res).to.have.status(expectedStatus);
});

export const authGetForStatus = (endpoint, token, expectedStatus, invert = false) => {
    expect(token).to.not.be.null;
    expect(token).to.not.be.undefined;
    return authGet(endpoint, token, (err, res) => {
        if (invert)
            expect(res).to.not.have.status(expectedStatus);
        else
            expect(res).to.have.status(expectedStatus);
    });
};
