import crypto from "crypto";
import path from "path";
import {__dirname} from "../utils.mjs";
import fs from "fs";

export const keysDir = path.join(__dirname, 'keys');
export const privateKeyFile = path.join(keysDir, 'private.pem');
export const publicKeyFile = path.join(keysDir, 'public.pem');

export const hash = (data) => {
    const privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyFile));
    return crypto.sign('SHA256', data, privateKey);
};

/**
 * Checks that the given `data` matches the passed `signature`.
 * @param {string} data
 * @param {string} signature
 * @return {boolean}
 */
export const verify = (data, signature) => {
    const publicKey = crypto.createPublicKey(fs.readFileSync(publicKeyFile));
    return crypto.verify('SHA256', Buffer.from(data), publicKey, Buffer.from(signature))
};
