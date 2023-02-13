import fs from 'fs';
import path from "path";

import {__dirname} from "../src/utils.mjs";

/**
 * Gets the contents of the given path. Fetches all the commands contained in the SQL file.
 * @param {string} path The path of the SQL file.
 * @return {string[]}
 */
const getQuery = (path) => {
    const fileContents = fs.readFileSync(path);
    const lines = fileContents.toString().split('\n');
    let index = 0;
    /** @type {string[][]} */
    const queries = [];
    for (const line of lines) {
        // If the query at the current index is not initialized, initialize it
        if (queries.length <= index) queries.push([]);

        // Push the line to the current position
        queries[index].push(line);

        // Check if the line has a semicolon
        const hasSemicolon = line.indexOf(';') >= 0;
        // If so, the current instruction has ended, so increase index
        if (hasSemicolon) index++;
    }
    return queries.map(lines => lines.join('\n'));
};

/**
 * Gets the query commands for creating all the tables.
 * @return {[name:string,query:string[]][]}
 */
export const getQueries = () => fs.readdirSync(path.join(__dirname, 'db', 'tables'))
    .map(t => [t.split('/')[-1], path.join(__dirname, 'db', 'tables', t)])
    .map(([t, p]) => [t, getQuery(p)]);
