import crypto from "crypto";
import path from "path";
import {__dirname} from "../utils";
import fs from "fs";

export const keysDir = path.join(__dirname, 'keys');
export const privateKeyFile = path.join(keysDir, 'private.pem');
export const publicKeyFile = path.join(keysDir, 'public.pem');

export function hash(data: NodeJS.ArrayBufferView): Buffer {
    const privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyFile));
    return crypto.sign('SHA256', data, privateKey);
}

/**
 * Checks that the given `data` matches the passed `signature`.
 */
export function verify(data: string, signature: string): boolean {
    const publicKey = crypto.createPublicKey(fs.readFileSync(publicKeyFile));
    return crypto.verify('SHA256', Buffer.from(data), publicKey, Buffer.from(signature))
}
