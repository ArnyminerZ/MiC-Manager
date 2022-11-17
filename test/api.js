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

    before('Generate parameters', () => {
        dbUsername = faker.internet.userName();
        dbDatabase = faker.internet.userName();
    });

    before('Run Docker', async () => {
        const environment = new DockerComposeEnvironment(__dirname, ['docker-compose.yml', 'docker-compose.override.yml'])
            .withBuild();
        if (fs.existsSync('.env'))
            docker = await environment
                .withEnvironmentFile('.env')
                .up();
        else
            docker = await environment
                .withEnvironment({
                    DB_USERNAME: dbUsername,
                    DB_DATABASE: dbDatabase,
                    CALDAV_USERNAME: 'radicale',
                    CALDAV_PASSWORD: '',
                    CALDAV_AB_UUID: '',
                })
                .up();

        const container = docker.getContainer('mic_interface');
        host = container.getHost();
        port = container.getMappedPort(3000).toString();
        protocol = 'http:';
        server = `${protocol}//${host}:${port}`;
    });

    it('Ping (/ping)', (done) => {
        chai.request(`${server}`)
            .get('/ping')
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200).and.to.be.text;
                expect(res.text).to.be.eql('pong');
                done();
            });
    });
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

    after('Stop Docker', async () => {
        if (docker != null) await docker.stop();
    });
});
