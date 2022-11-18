// noinspection ES6UnusedImports
import testcontainers, {DockerComposeEnvironment, Wait} from 'testcontainers';
import {faker} from '@faker-js/faker';

import chai from 'chai';
import chaiHttp from 'chai-http';

import {authGet, init, post, postForStatus} from "./utils/requests.js";

const __dirname = process.env['NODE_PATH'];

const expect = chai.expect;
chai.use(chaiHttp);

describe('API', function () {
    this.timeout(3 * 60000); // Timeout at 3 minutes

    /** @type {testcontainers.StartedDockerComposeEnvironment} */
    let docker;
    /** @type {string} */
    let host, port, protocol, server;
    let token;

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

    const newUser = (newUserBody) => it('Create user', post('/v1/testing/new_user', newUserBody, (err, res) => {
        expect(res).to.have.status(200);
        const body = res.body;
        expect(body).to.have.property('result');
        const result = body.result;
        expect(result).to.have.property('affectedRows', 1);
    }));

    const typeNullCheck = (object, type) => expect(object).to.be.an(type).and.to.not.be.null;

    before('Run Docker', async () => {
        const environment = new DockerComposeEnvironment(__dirname, ['docker-compose.yml', 'docker-compose.testing.yml'])
            .withBuild();
        docker = await environment
            .withEnvironmentFile('.test.env')
            .up();

        const container = docker.getContainer('mic_interface');
        host = container.getHost();
        port = container.getMappedPort(3000).toString();
        protocol = 'http:';
        server = `${protocol}//${host}:${port}`;
        init(server);
    });

    it('Ping (/ping)', ping('/ping'));
    it('Information (/v1/info)', (done) => {
        chai.request(server)
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
        const body = {nif, password};
        const bodyWrongPassword = {nif, password: faker.internet.password()};
        const uid = faker.datatype.string(24);
        const newUserBody = {
            Id: 1,
            NIF: nif,
            Uid: uid,
            Role: 1,
            Grade: 1,
            WhitesWheel: 0,
            BlacksWheel: 0,
            Associated: null,
        };
        const otherNif = faker.random.numeric(8) + faker.random.alpha({casing: 'upper'});
        const newUid = faker.datatype.string(24);
        const otherUserBody = {
            Id: 2,
            NIF: otherNif,
            Uid: newUid,
            Role: 1,
            Grade: 1,
            WhitesWheel: 0,
            BlacksWheel: 0,
            Associated: 1,
        };

        describe('Required parameters', () => {
            it('Drop attempts', postForStatus('/v1/testing/drop_attempts', {}, 200));
            it('Empty body', postForStatus('/v1/user/auth', {}, 400));
            it('No NIF', postForStatus('/v1/user/auth', {password}, 400));
            it('No Password', postForStatus('/v1/user/auth', {nif}, 400));
            it('Complete', postForStatus('/v1/user/auth', body, 400, true));
        });
        describe('User not registered', () => {
            it('Drop attempts', postForStatus('/v1/testing/drop_attempts', {}, 200));
            it('User not found', postForStatus('/v1/user/auth', body, 404));
            newUser(newUserBody);
            it('User found', postForStatus('/v1/user/auth', body, 404, true));
        });
        describe('Password-less user', () => {
            it('Drop attempts', postForStatus('/v1/testing/drop_attempts', {}, 200));
            it('User without password', postForStatus('/v1/user/auth', body, 417));
            it('Assign password', postForStatus('/v1/user/change_password', body, 200));
            it('User with password', postForStatus('/v1/user/auth', body, 417, true));
        });
        describe('User management', () => {
            it('Drop attempts', postForStatus('/v1/testing/drop_attempts', {}, 200));
            it('Wrong password', postForStatus('/v1/user/auth', bodyWrongPassword, 403));
            it('Correct password', post('/v1/user/auth', body, (err, res) => {
                expect(res).to.have.status(200);
                const body = res.body;
                expect(body).to.have.property('data');
                const data = body.data;
                expect(data).to.have.property('token');
                token = data.token;
                expect(token).to.be.an('string');
            }));
            it('Max attempts', () => {
                for (let c = 0; c < 3; c++) postForStatus('/v1/user/auth', bodyWrongPassword, 403);
                postForStatus('/v1/user/auth', bodyWrongPassword, 412);
            });

            newUser(otherUserBody);
            it('Correct user data', (done) => {
                authGet('/v1/user/data', token, (err, res) => {
                    expect(res).to.have.status(200);
                    const body = res.body;
                    expect(body).to.have.property('data');
                    const data = body.data;
                    expect(data).to.have.keys(['Id', 'Hash', 'Uid', 'NIF', 'Role', 'Grade', 'WhitesWheelNumber', 'BlacksWheelNumber', 'AssociatedTo', 'Registration', 'vCard']);

                    typeNullCheck(data.Id, 'number');
                    expect(data.Id).to.be.eql(newUserBody.Id);
                    typeNullCheck(data.Hash, 'string');
                    typeNullCheck(data.Uid, 'string');
                    expect(data.Uid).to.be.eql(newUserBody.Uid);
                    typeNullCheck(data.NIF, 'string');
                    expect(data.NIF).to.be.eql(newUserBody.NIF);
                    expect(data.Role).to.have.keys(['DisplayName', 'Permissions']);
                    expect(data.Grade).to.have.keys(['DisplayName', 'ActsRight', 'LockWhitesWheel', 'LockBlacksWheel', 'Votes', 'MinAge', 'MaxAge']);
                    typeNullCheck(data.WhitesWheelNumber, 'number');
                    typeNullCheck(data.BlacksWheelNumber, 'number');
                    expect(data.AssociatedTo).to.be.null;
                    typeNullCheck(data.Registration, 'string');
                })(done);
            });
        });
    });

    after('Stop Docker', async () => {
        if (docker != null) await docker.stop();
    });
});
