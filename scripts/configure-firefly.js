import path from "path";
import {faker} from "@faker-js/faker";

import {__dirname} from "../src/utils.mjs";
import {configure as configureFirefly} from "../src/monetary/firefly.js";
import {error} from "../cli/logger.js";

const secretsDir = path.join(__dirname, 'secrets');

try {
    await configureFirefly(
        process.env.FIREFLY_EMAIL ?? faker.internet.email(),
        process.env.FIREFLY_PASSWORD ?? faker.internet.password(32),
        secretsDir,
        process.env.SCREENSHOTS_DIR,
    );
} catch (e) {
    error('Could not configure Firefly. Error:', e);
}
