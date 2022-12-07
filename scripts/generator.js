import fs from "fs";
import path from "path";
import {info} from "../cli/logger.js";
import {faker} from "@faker-js/faker";
import {generateKeyPair} from 'crypto';

export const generateSecrets = secretsDir => {
    if (!fs.existsSync(secretsDir)) fs.mkdirSync(secretsDir);

    const secrets = ['password', 'root-password', 'firefly-password', 'firefly-root-password', 'firefly-app-key'];

    for (const secret of secrets) {
        const file = path.join(secretsDir, `${secret}.txt`);
        if (!fs.existsSync(file)) {
            info('Generating random contents for', file);
            fs.writeFileSync(file, faker.internet.password(32));
        }
    }

    const privateKey = path.join(secretsDir, 'private.key');
    if (!fs.existsSync(privateKey)) {
        info('Generating random contents for', privateKey);
        fs.writeFileSync(privateKey, faker.random.alphaNumeric(1024));
    }
};

/**
 * @deprecated WIP. Not working, do not use.
 * @param secretsDir
 * @param passphrase
 * @returns {Promise<unknown>}
 */
export const generateKeys = (secretsDir, passphrase) => new Promise((resolve, reject) => {
    generateKeyPair('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase,
        },
    }, (err, publicKey, privateKey) => {
        if (err != null)
            return reject(err);
    })
});
