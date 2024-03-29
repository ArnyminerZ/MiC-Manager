import assert from 'assert';

import {faker} from '@faker-js/faker';

import {__dirname, capitalize, ipToLong, isNumber, isValidDate, merge, pathExists} from '../src/utils';
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
    it('Date format check', () => {
        assert.ok(isValidDate('2023-02-08'));
        assert.ok(!isValidDate('2023-2-08'));
        assert.ok(!isValidDate('2023-02-8'));
        assert.ok(!isValidDate('1-02-8'));
        assert.ok(!isValidDate('aaa'));
        assert.ok(!isValidDate('2023-02-32'));
        assert.ok(!isValidDate('2023-13-25'));
    });
    it('Map merging', () => {
        const map1 = new Map();
        map1.set('key1', 'value1');
        const map2 = new Map();
        map2.set('key2', 'value2');

        const map = merge(map1, map2);
        for (const key in map1) {
            assert.ok(map.has(key));
            assert.equal(map.get(key), map1.get(key));
        }
        for (const key in map2) {
            assert.ok(map.has(key));
            assert.equal(map.get(key), map2.get(key));
        }
    });
});
