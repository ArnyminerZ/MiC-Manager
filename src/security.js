import jwt from 'jsonwebtoken';
import fs from 'fs';
import crypto from 'crypto';

const privateKeyFilePath = process.env.PRIVATE_KEY_FILE ?? './secrets/private.key';

const rsaKeysDir = process.env.KEYS_FILE ?? './keys';
const rsaCerFile = `${rsaKeysDir}/cer.pem`;
const rsaKeyFile = `${rsaKeysDir}/key.pem`;

let rsaPublicKey, rsaPrivateKey;

let privateKey;

/**
 * Loads their corresponding value for `rsaPublicKey` and `rsaPrivateKey`.
 * @author Arnau Mora
 * @since 20221208
 */
const loadKeys = () => {
    rsaPublicKey = crypto.createPublicKey({
        key: fs.readFileSync(rsaCerFile),
        format: 'pem',
        passphrase: '',
        encoding: 'utf-8',
    });
    rsaPrivateKey = crypto.createPrivateKey({
        key: fs.readFileSync(rsaKeyFile),
        format: 'pem',
        passphrase: '',
        encoding: 'utf-8',
    });
}

const getPrivateKey = () => {
    if (!fs.existsSync(privateKeyFilePath))
        throw Error(`Private key file is required but doesn't exist. Path: ` + privateKeyFilePath);
    if (privateKey == null)
        privateKey = fs.readFileSync(privateKeyFilePath).toString()
    return privateKey;
}

/**
 * Generates a new JSON Web Token with the given payload.
 * @author Arnau Mora
 * @since 20221019
 * @param {Object} payload The data to encode.
 * @param {string} expiresIn The amount of time until the token is considered expired.
 * @returns {Promise<string>}
 */
export const generateToken = (payload, expiresIn = '7d') => new Promise((resolve, reject) => {
    jwt.sign(payload, getPrivateKey(), {expiresIn}, (err, token) => {
        if (!err)
            resolve(token);
        else
            reject(err);
    });
});

/**
 * Checks whether a token is valid.
 * @author Arnau Mora
 * @since 20221019
 * @param {string} token The token to check for.
 * @returns {Promise<boolean>}
 */
export const checkToken = (token) => new Promise((resolve) => {
    jwt.verify(token, getPrivateKey(), {}, (err, payload) => {
        if (!err)
            if (payload['nif'] != null && payload['userId'] != null)
                resolve(true);
            else
                resolve(false);
        else
            resolve(false);
    });
});

/**
 * Returns the payload contained in a token.
 * @author Arnau Mora
 * @since 20221021
 * @param {string} token The token to check for.
 * @returns {Promise<{nif:string,userId:number}>}
 */
export const decodeToken = (token) => new Promise((resolve, reject) => {
    jwt.verify(token, getPrivateKey(), {}, (err, payload) => {
        if (!err)
            if (payload.hasOwnProperty('nif') && payload.hasOwnProperty('userId'))
                resolve({nif: payload.nif, userId: parseInt(payload.userId)});
            else
                reject('Payload missing data.');
        else
            reject(err);
    });
});

/**
 * Encrypts the given data using RSA2048, with the stored public key.
 * @author Arnau Mora
 * @since 20221117
 * @param {string} data The data to encrypt.
 * @param {string|Buffer} publicKey The key to use for encrypting.
 * @return {Buffer} A buffer with the data encrypted.
 * @see decrypt
 */
export const encrypt = (data, publicKey) => crypto.publicEncrypt(
    {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
    },
    // We convert the data string to a buffer using `Buffer.from`
    Buffer.from(data),
);

/**
 * Decrypts some encrypted data using RSA2048, with the stored private key.
 * @author Arnau Mora
 * @since 20221117
 * @param {Buffer} encryptedData The previously encrypted data.
 * @param {string|Buffer} privateKey The key to use for decrypting.
 * @return {Buffer} A buffer with the data decrypted. `toString` is the easiest way to make the text readable.
 * @see encrypt
 */
export const decrypt = (encryptedData, privateKey) => crypto.privateDecrypt(
    {
        key: privateKey,
        // In order to decrypt the data, we need to specify the
        // same hashing function and padding scheme that we used to
        // encrypt the data in the previous step
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
    },
    encryptedData,
);
