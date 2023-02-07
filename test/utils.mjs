import assert from 'assert';

import {faker} from '@faker-js/faker';

import {__dirname, capitalize, ipToLong, isNumber, pathExists} from '../src/utils.mjs';
import fs from "fs";
import fsp from "fs/promises";
import path from "path";

describe('Utils testing', () => {
    describe('Number functions', () => {
        it('isNumber()', () => {
            const number = faker.datatype.number().toString();
            const string = faker.datatype.string();
            assert.ok(isNumber(number));
            assert.ok(!isNumber(number + 'a'));
            assert.ok(!isNumber(string));
        });
        it('ipToLong()', () => {
            const ip = "192.168.54.9";
            assert.strictEqual(ipToLong(ip), 3232249353);
        });
    });
    describe('String functions', () => {
        it('capitalize()', () => {
            assert.strictEqual(capitalize('this IS a tEst'), 'This Is A Test')
        });
    });
    describe('Path utils', () => {
        it('__dirname', () => assert.ok(fs.existsSync(__dirname), '__dirname exists'));
        it('fileExists()', async () => {
            assert.ok(await pathExists(__dirname), '__dirname exists');

            const testDir = path.join(__dirname, faker.random.alphaNumeric(10));
            assert.ok(!(await pathExists(testDir)), 'New directory doesn\'t exist.');
            await fsp.mkdir(testDir);
            assert.ok(await pathExists(testDir), 'New directory now exists');
            await fsp.rmdir(testDir);
        });
    });
});
