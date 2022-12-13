/**
 * Provides the functions that initialize the system, and create all the necessary files if any.
 * @since 20221212
 * @file bootup.mjs
 */

import {SqlError} from "mariadb";
import express from "express";
import rateLimit from "express-rate-limit";
import reqIp from "request-ip";
import bodyParser from "body-parser";
import cors from 'cors';

import {load as loadConfig} from "./storage/config.js";
import {checkFiles, checkVariables, getProps} from "./environment.js";
import {error, info, infoSuccess} from "../cli/logger.js";
import {check as dbCheck} from "./request/database.js";
import {createClient as calCreateClient, getAddressBookUrl, getCards} from "./request/caldav.js";
import {check as checkFirefly} from "./monetary/firefly.js";
import {addEndpoints} from "./endpoints/add_endpoints.mjs";

/**
 * Boots all the environment-related features. Those include necessary files, configuration, variables...
 * @author Arnau Mora
 * @since 20221212
 */
export const bootEnvironment = () => {
    loadConfig();
    checkVariables();
    checkFiles();
};

/**
 * Boots and connects to the database, adding all the necessary data, running all migrations, and checking that
 * everything is up and running.
 * @author Arnau Mora
 * @since 20221212
 * @returns {Promise<void>}
 */
export const bootDatabase = async () => {
    info(`Checking database...`);
    const dbCheckResult = await dbCheck(process.env.LOG_LEVEL === 'debug');
    if (dbCheckResult != null) {
        error(`Could not connect to database. Host: ${process.env.DB_HOSTNAME}`);
        if (dbCheckResult instanceof SqlError)
            error('Database error:', dbCheckResult.code, '-', dbCheckResult.text);
        else
            error('Error:', dbCheckResult);
        process.exit(1);
    } else
        infoSuccess(`Database connected.`);
};

/**
 * Checks that the CalDAV server is up and running correctly, and creates any necessary collections if necessary.
 * @author Arnau Mora
 * @since 20221212
 * @returns {Promise<void>}
 */
export const bootCaldav = async () => {
    info(`Checking CalDAV server...`);
    if (!(await calCreateClient())) {
        error(`Could not connect to the CalDAV server.`)
        process.exit(1);
    }
    await getCards();
    infoSuccess(`CalDAV server ready. AB Url:`, getAddressBookUrl());
};

/**
 * Checks that the Firefly backend is running correctly, and initializes it if not done yet.
 * @author Arnau Mora
 * @since 20221212
 * @returns {Promise<void>}
 */
export const bootFirefly = async () => {
    info(`Checking Firefly server...`);
    await checkFirefly();
};

/**
 * Boots the HTTP server, and adds all the endpoints necessary, including the provided by the different props. Also adds
 * all the necessary middleware.
 * @author Arnau Mora
 * @since 20221212
 */
export const bootServer = () => {
    const props = getProps();

    const app = express();

    // Limits the maximum amount of concurrent requests that can be made. If migration is enabled, the max rate is greatly
    // increased for allowing quick data write.
    const rateLimitOptions = {
        windowMs: 60 * 1000,
        max: props.includes('migration') || props.includes('testing') ? 500 : 10
    };
    const limiter = rateLimit(rateLimitOptions);
    info('Per minute rate limit:', rateLimitOptions.max);

    // Middleware
    app.use(reqIp.mw());
    app.use(bodyParser.json({strict: false}));
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(limiter);
    app.use(cors());

    addEndpoints(app, props);

    app.listen(process.env.HTTP_PORT, () => info(`Listening for requests on http://localhost:${process.env.HTTP_PORT}`));
};
