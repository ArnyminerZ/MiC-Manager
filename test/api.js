// noinspection ES6UnusedImports
import testcontainers, {DockerComposeEnvironment, Wait} from 'testcontainers';
import {faker} from '@faker-js/faker';

import chai from 'chai';
import chaiHttp from 'chai-http';
import fs from "fs";

const __dirname = process.env['NODE_PATH'];

const expect = chai.expect;
chai.use(chaiHttp);

describe('API', function () {
    this.timeout(3 * 60000); // Timeout at 3 minutes

    /** @type {testcontainers.StartedDockerComposeEnvironment} */
    let docker;
    /** @type {string} */
    let dbUsername, dbDatabase;
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

    before('Generate parameters', () => {
        dbUsername = faker.internet.userName();
        dbDatabase = faker.internet.userName();
    });

    before('Run Docker', async () => {
        const environment = new DockerComposeEnvironment(__dirname, ['docker-compose.yml', 'docker-compose.override.yml'])
            .withBuild();
        if (fs.existsSync('.test.env'))
            docker = await environment
                .withEnvironmentFile('.test.env')
                .up();
        else
            docker = await environment
                .withEnvironment({
                    DB_USERNAME: dbUsername,
                    DB_DATABASE: dbDatabase,
                    CALDAV_USERNAME: 'radicale',
                    CALDAV_PASSWORD: '',
                    CALDAV_AB_UUID: '',
                    PROPS: 'testing',
                })
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
            it('Empty body', post('/v1/user/auth', {}, (err, res) => {
                expect(res).to.have.status(400);
            }));
            it('No NIF', post('/v1/user/auth', {password}, (err, res) => {
                expect(res).to.have.status(400);
            }));
            it('No Password', post('/v1/user/auth', {nif}, (err, res) => {
                expect(res).to.have.status(400);
            }));
            it('Complete', post('/v1/user/auth', body, (err, res) => {
                expect(res).to.not.have.status(400);
            }));
        });
        describe('User not registered', () => {
            it('User not found', post('/v1/user/auth', body, (err, res) => {
                expect(res).to.have.status(404);
            }));
            it('Create user', post('/v1/testing/new_user', newUserBody, (err, res) => {
                expect(res).to.have.status(200);
                const body = res.body;
                expect(body).to.have.property('result');
                const result = body.result;
                expect(result).to.have.property('affectedRows', 1);
            }));
            it('User found', post('/v1/user/auth', body, (err, res) => {
                expect(res).to.not.have.status(404);
            }));
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
