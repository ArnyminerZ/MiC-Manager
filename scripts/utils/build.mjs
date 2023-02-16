import fs from 'fs';
import path from 'path';

import {__dirname} from "./files.mjs";

const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
    console.warn('Build directory doesn\'t exist');
    process.exit(1);
}

/**
 * Provides the build directory.
 * @returns {string}
 */
export default function() { return buildDir; }