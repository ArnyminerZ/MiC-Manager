// noinspection ES6UnusedImports
import testcontainers, {DockerComposeEnvironment, Wait} from 'testcontainers';
import {faker} from '@faker-js/faker';
import {validate} from 'compare-versions';
import puppeteer from 'puppeteer';
import fs from "fs/promises";
import path from "path";

import chai from 'chai';
import chaiHttp from 'chai-http';
import assertArrays from 'chai-arrays';

import {
    authGet,
    authGetForStatus,
    authPostForStatus,
    get,
    getForStatus,
    init,
    post,
    postForStatus
} from "./utils/requests.js";
import {generateSecrets} from "../scripts/generator.js";
import {pathExists} from "../src/utils.js";

const __dirname = process.env['NODE_PATH'];

const expect = chai.expect;
chai.use(chaiHttp);
chai.use(assertArrays);

describe('Test Backend', function () {
    this.timeout(3 * 60000); // Timeout at 3 minutes

    /** @type {testcontainers.StartedDockerComposeEnvironment} */
    let docker;
    /** @type {string} */
    let host, port, protocol = 'http:', server;
    let token, adminToken;

    const fireflyEmail = faker.internet.email();
    const fireflyPassword = faker.internet.password(32);

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

    const login = (body, callback) => it('Log in', post('/v1/user/auth', body, (err, res) => {
        expect(res).to.have.status(200);
        const body = res.body;
        expect(body).to.have.property('data');
        const data = body.data;
        expect(data).to.have.property('token');
        const token = data.token;
        expect(token).to.be.an('string');
        callback(token);
    }));

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    const typeNullCheck = (object, type) => expect(object).to.be.an(type).and.to.not.be.null;


    before('Prepare environment', async () => {
        const packageJsonRaw = (await fs.readFile(path.join(__dirname, 'package.json'))).toString();
        const packageJson = JSON.parse(packageJsonRaw);
        const version = packageJson.version;
        expect(validate(version)).to.be.eql(true);


        // Prepare output directory
        console.info('Checking output directories...');
        const testDir = path.join(__dirname, '.test');
        const screenshotsDir = path.join(testDir, 'screenshots');
        const secretsDir = path.join(testDir, 'secrets');
        if (await pathExists(testDir)) {
            console.info('Removing output directory...');
            await fs.rm(testDir, {recursive: true, force: true});
        }
        console.info('Creating output directories...');
        await fs.mkdir(testDir);
        await fs.mkdir(screenshotsDir);
        await fs.mkdir(secretsDir);
        generateSecrets(secretsDir);


        const browser = await puppeteer.launch();
        const page = await browser.newPage();


        const environment = new DockerComposeEnvironment(__dirname, ['docker-compose.yml', 'docker-compose.testing.yml'])
            .withBuild();
        docker = await environment.up(['firefly', 'mariadb', 'radicale']);

        const firefly = docker.getContainer('mic_firefly');
        const fireflyNetworks = firefly.getNetworkNames();
        process.env['FIREFLY_HOST'] = firefly.getIpAddress(fireflyNetworks[0]);
        process.env['FIREFLY_PORT'] = '8080';
        const fireflyServer = `${protocol}//${process.env.FIREFLY_HOST}:${process.env.FIREFLY_PORT}`;


        const waitAndClick = async (selector) => {
            await page.waitForSelector(selector);
            await page.click(selector);
        };
        const waitAndType = async (selector, text) => {
            await page.waitForSelector(selector);
            await page.type(selector, text);
        };


        await page.setViewport({ width: 1280, height: 720 });
        await page.goto(`${fireflyServer}/register`);

        await page.waitForSelector('form');
        await page.type('input[name="email"]', fireflyEmail);
        await page.type('input[name="password"]', fireflyPassword);
        await page.type('input[name="password_confirmation"]', fireflyPassword);
        await page.screenshot({path: path.join(screenshotsDir, 'registration.jpg')});
        await page.click('button');
        await page.waitForNavigation();

        await page.goto(`${fireflyServer}/login`);
        await page.goto(`${fireflyServer}/profile`);

        await waitAndClick('.nav.nav-tabs li:nth-of-type(3)');
        await waitAndClick('#oauth div:has(> #modal-create-token) a.btn');

        await page.waitForSelector('#modal-create-token[style="display: block;"]');
        await delay(200);
        await waitAndType('#modal-create-token input[name="name"]', 'MiC-Manager');
        await page.screenshot({path: path.join(screenshotsDir, 'create-token-modal.jpg')});
        await waitAndClick('#modal-create-token .btn-primary');

        await page.waitForSelector('#modal-access-token[style="display: block;"]');
        await delay(200);
        await page.screenshot({path: path.join(screenshotsDir, 'token-modal.jpg')});
        const token = await page.evaluate(selector => document.querySelector(selector).value, '#modal-access-token textarea');

        // await page.click('Create new token');
        await fs.writeFile(path.join(secretsDir, 'firefly-token.txt'), token)

        await browser.close()


        docker = await environment.up();

        const container = docker.getContainer('mic_interface');
        host = container.getIpAddress('backend');
        port = container.getMappedPort(3000).toString();
        server = `${protocol}//${host}:${port}`;
        init(server);
    });

    it('Ping (/ping)', ping('/ping'));
    it('Information (/v1/info)', get('/v1/info', (err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200).and.to.be.json;
        const body = res.body;
        expect(body).to.have.property('success', true);
        expect(body).to.have.property('data');
        const data = body.data;
        expect(data).to.have.property('database');
        expect(data).to.not.have.property('version');
    }));
    it('Testing prop enabled', ping('/v1/testing/ping'));
    describe('User Actions', () => {
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
        const adminNif = faker.random.numeric(8) + faker.random.alpha({casing: 'upper'});
        const adminUid = faker.datatype.string(24);
        const adminPassword = faker.internet.password();
        const adminUserBody = {
            Id: 2,
            NIF: adminNif,
            Uid: adminUid,
            Role: 2,
            Grade: 1,
            WhitesWheel: 0,
            BlacksWheel: 0,
            Associated: 1,
        };
        const adminBody = {nif: adminNif, password: adminPassword};

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
            login(body, t => token = t);
            it('Max attempts', () => {
                for (let c = 0; c < 3; c++) postForStatus('/v1/user/auth', bodyWrongPassword, 403);
                postForStatus('/v1/user/auth', bodyWrongPassword, 412);
            });

            newUser(adminUserBody);
            it('Set admin password', postForStatus('/v1/user/change_password', adminBody, 200));
            login(adminBody, t => adminToken = t);

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

            it('Admin Information', done => {
                authGet('/v1/info', adminToken, (err, res) => {
                    expect(res).to.have.status(200).and.to.be.json;
                    const data = res.body.data;
                    expect(data).to.have.property('database');
                    expect(data).to.have.property('version');
                    const version = data.version;
                    expect(version).to.have.property('name', packageJson.version);
                    expect(version).to.have.property('update');
                    expect(version.update).to.not.be.true;
                })(done)
            });
        });

        const parseDate = str => new Date(str).toISOString().slice(0, 19).replace('T', ' ');

        describe('Events', () => {
            /** @type {EventData|null} */
            let eventBody;

            before(() => {
                eventBody = {
                    id: 1,
                    displayName: faker.word.noun() + ' ' + faker.word.adjective(),
                    date: parseDate(faker.date.soon(10)),
                    category: 'generic',
                    contact: faker.name.fullName() + ' ' + faker.phone.number('### ## ## ##'),
                    description: faker.lorem.lines(2),
                    attending: [],
                    tables: [],
                    menu: null,
                };
            });

            it('Unauthorised', getForStatus('/v1/events/list', 406));
            it('Invalid Token', authGetForStatus('/v1/events/list', token + 'a', 406));
            it('No events', (done) => {
                authGet('/v1/events/list', token, (err, res) => {
                    expect(res).to.have.status(200);
                    const body = res.body;
                    expect(body).to.have.property('data');
                    const data = body.data;
                    expect(data).to.be.array();
                    expect(data).to.be.ofSize(0);
                })(done);
            });
            it('Creation unauthorised', done => authPostForStatus('/v1/events/create', eventBody, token, 401)(done));
            it('Event creation', done => authPostForStatus('/v1/events/create', eventBody, adminToken, 200)(done));
            it('New event exists', (done) => {
                authGet('/v1/events/list', token, (err, res) => {
                    expect(res).to.have.status(200);
                    const body = res.body;
                    expect(body).to.have.property('data');
                    const data = body.data;
                    expect(data).to.be.array();
                    expect(data).to.be.ofSize(1);

                    /** @type {EventData} */
                    const event = data[0];
                    typeNullCheck(event.id, 'number');
                    expect(event.id).to.be.eql(eventBody.id);
                    typeNullCheck(event.displayName, 'string');
                    expect(event.displayName).to.be.eql(eventBody.displayName);
                    typeNullCheck(event.date, 'string');
                    expect(parseDate(event.date)).to.be.eql(eventBody.date);
                    typeNullCheck(event.category, 'string');
                    expect(event.category).to.be.eql(eventBody.category);
                    typeNullCheck(event.contact, 'string');
                    expect(event.contact).to.be.eql(eventBody.contact);
                    typeNullCheck(event.description, 'string');
                    expect(event.description).to.be.eql(eventBody.description);

                    expect(event.attending).to.be.array();
                    expect(event.attending).to.be.ofSize(0);
                    expect(event.tables).to.be.array();
                    expect(event.tables).to.be.ofSize(0);
                    expect(event.menu).to.be.undefined;
                })(done);
            });
        });
    });

    after('Stop Docker', async () => {
        if (docker != null) await docker.stop();
    });
});
