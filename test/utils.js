import assert from 'assert';

import {faker} from '@faker-js/faker';

import {capitalize, ipToLong, isNumber} from '../src/utils.js';


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
});