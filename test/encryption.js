import assert from 'assert';
import {faker} from '@faker-js/faker';
import crypto from 'crypto';

import {decrypt, encrypt} from "../src/security.js";

describe('Encryption testing', () => {
    let publicKey, privateKey;
    let data;
    before('Generate key pair.', () => {
        const keyPair = crypto.generateKeyPairSync("rsa", {
            // The standard secure default length for RSA keys is 2048 bits
            modulusLength: 2048,
        });
        publicKey = keyPair.publicKey;
        privateKey = keyPair.privateKey;
    });
    before('Generate data to encrypt.', () => {
        // Generate two lines of lorem ipsum
        data = faker.lorem.lines(2);
    })
    it('Encryption and decryption', () => {
        const encData = encrypt(data, publicKey);
        const decData = decrypt(encData, privateKey);
        assert.strictEqual(decData.toString(), data);
    });
});
