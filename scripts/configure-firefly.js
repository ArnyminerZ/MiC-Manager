import path from "path";

import {__dirname} from "../src/utils.mjs";
import {configure as configureFirefly} from "../src/monetary/firefly.js";
import {error} from "../cli/logger.js";

const secretsDir = path.join(__dirname, 'secrets');

try {
    await configureFirefly(null, null, secretsDir, process.env.SCREENSHOTS_DIR);
} catch (e) {
    error('Could not configure Firefly. Error:', e);
}
