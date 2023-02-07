import crypto from "crypto";
import fs from "fs";

import {keysDir, privateKeyFile, publicKeyFile} from "./cryptography.mjs";

/**
 * Generates public and private keys and stores them into the `keys` directory.
 */
export const generateKeys = () => {
    if (fs.existsSync(privateKeyFile) && fs.existsSync(publicKeyFile)) return;

    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
    });

    // Create keys dir if it doesn't exist
    if (!fs.existsSync(keysDir)) fs.mkdirSync(keysDir);

    fs.writeFileSync(privateKeyFile, privateKey.export({ format: 'pem', type: 'pkcs1' }).toString());
    fs.writeFileSync(publicKeyFile, publicKey.export({ format: 'pem', type: 'pkcs1' }).toString());
};
