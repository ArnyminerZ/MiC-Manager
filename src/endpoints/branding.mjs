/**
 * Provides all the endpoints required for the branding information of the website.
 * @since 20221213
 * @file branding.mjs
 */

import sharp from 'sharp';
import fsp from "fs/promises";
import path from "path";
import checksum from 'checksum';

import {errorResponse, successResponse} from "../response.js";
import {__dirname, pathExists} from "../utils.mjs";
import {info, log} from "../../cli/logger.js";

/**
 * Generates a Checksum from the given file.
 * @author Arnau Mora
 * @since 20221213
 * @param {string} path The path of the file to hash,
 * @param {Object} options Some options for the hashing.
 * @returns {Promise<string>} The resulting hash.
 */
const fileChecksum = (path, options = {}) => new Promise((resolve, reject) => {
    try {
        checksum.file(path, options, (err, sum) => {
            if (err == null)
                resolve(sum);
            else
                reject(err);
        });
    } catch (e) {
        reject(e);
    }
});

/**
 * Gets the path of the given file inside the assets directory.
 * @author Arnau Mora
 * @since 20221213
 * @param {string} file The name of the file.
 * @returns {string}
 */
const asset = file => path.join(__dirname, 'assets', file);

/**
 * Gets the path of the given file inside the generated files path in the assets directory.
 * @author Arnau Mora
 * @since 20221213
 * @param {string} file The name of the file.
 * @returns {string}
 */
const generated = file => path.join(__dirname, 'assets', '.generated', file);

let hashes = {};

/**
 * @callback FileGenerator
 * @return Promise<Buffer>
 */

/**
 * Generates a file with the designated generator if it doesn't exist, or if the checksum of the given file doesn't
 * match the stored one.
 * @author Arnau Mora
 * @since 20221213
 * @param {string} name The name and extension of the file to be generated.
 * @param {FileGenerator} generator Will be called if the file needs to be generated.
 */
const generateIfNecessary = async (name, generator) => {
    const filePath = generated(name);

    log(`Generating ${name}...`);
    const file = await generator();
    let update;
    if (await pathExists(filePath)) {
        const newHash = checksum(file);
        const faviconHash = await fileChecksum(filePath);
        update = newHash !== faviconHash;
    } else {
        log(name, `doesn't exist.`);
        update = true
    }

    if (update) {
        info(`A source file has been modified. Updating ${name}...`);
        if (await pathExists(filePath)) {
            log('Removing old file...');
            await fsp.rm(filePath);
        }
        if (!await pathExists(generated(''))) await fsp.mkdir(generated(''));
        log(`Writing new file...`);
        await fsp.writeFile(filePath, file);
        if (await pathExists(filePath))
            log('File at', filePath, 'is ready.');
        else
            throw new Error(`For some reason, the file at ${filePath} was not generated correctly.`);
    } else
        log('The file', name, 'exists and doesn\'t need to be updated.');
}

/**
 * Generates checksums for all the asset files. Assumes that all files exist. This is checked in the configuration load.
 * @author Arnau Mora
 * @since 20221213
 */
const hashFiles = async () => {
    const iconPath = asset(process.env.BRAND_ICON);
    const bannerSourcePath = asset(process.env.BRAND_BANNER);
    const bannerPath = generated('banner.png');
    const faviconPath = generated('favicon.png');

    await generateIfNecessary(
        'favicon.png',
        async () => await sharp(iconPath)
            .png()
            .resize(64, 64)
            .toBuffer(),
    );
    await generateIfNecessary(
        'banner.png',
        async () => await sharp(bannerSourcePath)
            .png()
            .resize(1080, 400)
            .toBuffer(),
    );

    log('Generating checksum of all the asset files...');
    hashes['icon'] = await fileChecksum(iconPath);
    hashes['banner'] = await fileChecksum(bannerPath);
    hashes['favicon'] = await fileChecksum(faviconPath);
};

/**
 * Initializes all the data required for the branding side of MiC-Manager.
 * @author Arnau Mora
 * @since 20221213
 */
export const initializeBranding = async () => {
    await hashFiles();
};

/**
 * The branding endpoint. Provides information about the website, such as logos, names, and miscellaneous assets.
 * @author Arnau Mora
 * @since 20221213
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const branding = (req, res) => {
    res.json(successResponse({
        name: process.env.BRAND_NAME,
        assets: {
            icon: {
                path: '/branding/icon',
                checksum: hashes['icon'],
            },
            favicon: {
                path: '/branding/favicon',
                checksum: hashes['favicon'],
            },
            banner: {
                path: '/branding/banner',
                checksum: hashes['banner'],
            },
        },
    }));
};

/**
 * Fetches and processes all the requested assets.
 * @author Arnau Mora
 * @since 20221213
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const assets = async (req, res) => {
    const params = req.params;
    /** @type {string} */
    const resource = params.resource;

    const iconPath = asset(process.env.BRAND_ICON);
    const bannerPath = generated('banner.png');
    const faviconPath = generated('favicon.png');

    switch (resource) {
        case 'icon':
            res.type('image/svg+xml').send(await fsp.readFile(iconPath));
            break;
        case 'favicon':
            res.type('image/png').send(await fsp.readFile(faviconPath));
            break;
        case 'banner':
            res.type('image/png').send(await fsp.readFile(bannerPath));
            break;
        default:
            res.status(404).send(errorResponse('not-found', `Could not find the requested asset: '${resource}'`));
            break;
    }
};
