// noinspection ES6UnusedImports
import testcontainers, {DockerComposeEnvironment, Wait} from 'testcontainers';
import {faker} from '@faker-js/faker';

import chai from 'chai';
import chaiHttp from 'chai-http';

const __dirname = process.env['NODE_PATH'];

const expect = chai.expect;
chai.use(chaiHttp);

describe('API', function () {
    this.timeout(3 * 60000); // Timeout at 3 minutes

    /** @type {testcontainers.StartedDockerComposeEnvironment} */
    let docker;
    /** @type {string} */
    let host, port, protocol, server;

    // Utility functions
    const ping = endpoint => {
        return (done) => {
            chai.request(server)
                .get(endpoint)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200).and.to.be.text;
                    expect(res.text).to.be.eql('pong');
                    done();
                });
        };
    };
    /**
     * @callback PostCallback
     * @param {Object} err
     * @param {Object} res
     */
    /**
     * Creates a post request to the given endpoint.
     * @author Arnau Mora
     * @since 20221117
     * @param {string} endpoint
     * @param {Object} body
     * @param {PostCallback} assert
     * @return {(function(*): void)|*}
     */
    const post = (endpoint, body, assert) => {
        return (done) => {
            chai.request(server)
                .post(endpoint)
                .send(body)
                .end((err, res) => {
                    assert(err, res);
                    done();
                });
        };
    };
    const postForStatus = (endpoint, body, expectedStatus, invert = false) => post(endpoint, body, (err, res) => {
        if (invert)
            expect(res).to.not.have.status(expectedStatus);
        else
            expect(res).to.have.status(expectedStatus);
    })

    before('Run Docker', async () => {
        const environment = new DockerComposeEnvironment(__dirname, ['docker-compose.yml', 'docker-compose.override.yml'])
            .withBuild();
        docker = await environment
            .withEnvironmentFile('.test.env')
            .up();

        const container = docker.getContainer('mic_interface');
        host = container.getHost();
        port = container.getMappedPort(3000).toString();
        protocol = 'http:';
        server = `${protocol}//${host}:${port}`;
    });

    it('Ping (/ping)', ping('/ping'));
    it('Information (/v1/info)', (done) => {
        chai.request(`${server}`)
            .get('/v1/info')
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200).and.to.be.json;
                const body = res.body;
                expect(body).to.have.property('success', true);
                expect(body).to.have.property('data');
                const data = body.data;
                expect(data).to.have.property('database');
                done();
            });
    });
    it('Testing prop enabled', ping('/v1/testing/ping'));
    describe('User Authentication (/v1/user/auth)', () => {
        const nif = faker.random.numeric(8) + faker.random.alpha({casing: 'upper'});
        const password = faker.internet.password();
        const body = {password, nif};
        const uid = faker.datatype.string(24);
        const newUserBody = {
            NIF: nif,
            Uid: uid,
            Role: 1,
            Grade: 1,
            WhitesWheel: 0,
            BlacksWheel: 0,
            Associated: null,
        };

        describe('Required parameters', () => {
            it('Empty body', postForStatus('/v1/user/auth', {}, 400));
            it('No NIF', postForStatus('/v1/user/auth', {password}, 400));
            it('No Password', postForStatus('/v1/user/auth', {nif}, 400));
            it('Complete', postForStatus('/v1/user/auth', {nif}, 400, true));
        });
        describe('User not registered', () => {
            it('User not found', postForStatus('/v1/user/auth', body, 404));
            it('Create user', post('/v1/testing/new_user', newUserBody, (err, res) => {
                expect(res).to.have.status(200);
                const body = res.body;
                expect(body).to.have.property('result');
                const result = body.result;
                expect(result).to.have.property('affectedRows', 1);
            }));
            it('User found', postForStatus('/v1/user/auth', body, 404, true));
        });

        /*it('Create new user', (done) => {
            chai.request(server)
                .get('/v1/testing/new_user')
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200).and.to.be.json;
                    const body = res.body;
                    expect(body).to.have.property('success', true);
                    expect(body).to.have.property('data');
                    const data = body.data;
                    expect(data).to.have.property('database');
                    done();
                });
        });*/
    });

    after('Stop Docker', async () => {
        if (docker != null) await docker.stop();
    });
});
