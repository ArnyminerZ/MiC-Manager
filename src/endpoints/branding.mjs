/**
 * Provides all the endpoints required for the branding information of the website.
 * @since 20221213
 * @file branding.mjs
 */

import sharp from 'sharp';
import fsp from "fs/promises";
import path from "path";

import {errorResponse, successResponse} from "../response.js";
import {__dirname} from "../utils.mjs";

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
            icon: '/v1/branding/icon',
            favicon: '/v1/branding/favicon',
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

    const iconPath = path.join(__dirname, 'assets', process.env.BRAND_ICON);

    switch (resource) {
        case 'icon':
            res.type('image/svg+xml').send(await fsp.readFile(iconPath));
            break;
        case 'favicon':
            const favicon = await sharp(iconPath)
                .png()
                .resize(64, 64)
                .toBuffer();
            res.type('image/png').send(favicon);
            break;
        default:
            res.status(404).send(errorResponse('not-found', `Could not find the requested asset: '${resource}'`));
            break;
    }
};
