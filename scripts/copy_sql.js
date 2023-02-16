import fs from 'fs';
import path from 'path';

import {__dirname} from "./utils/files.mjs";

import buildDir from './utils/build.mjs';
const build = buildDir();

// Get the directory where all the tables are stored
const tables = path.join(__dirname, 'db', 'tables');

// Get the directory where all the tables will be copied to
const buildTables = path.join(build, 'db', 'tables');

// If the tables directory doesn't exist in build, create it
if (!fs.existsSync(tables)) fs.mkdirSync(tables);

// Get all the files inside the directory
/** @type {string[]} */
const files = fs.readdirSync(tables);

// Iterate each of them
for (const file of files) {
    const source = path.join(tables, file);
    const target = path.join(buildTables, file);
    // Copy the file from the tables' dir, to build
    fs.cpSync(source, target);
}
