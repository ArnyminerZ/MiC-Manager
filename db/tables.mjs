import fs from 'fs';
import path from "path";

import {__dirname} from "../src/utils.mjs";

/**
 * Gets the contents of the given path
 * @param {string} path The path of the SQL file.
 * @return {string}
 */
const getQuery = (path) => (fs.readFileSync(path)).toString();

/**
 * Gets the query commands for creating all the tables.
 * @return {[name:string,query:string][]}
 */
export const getQueries = () => fs.readdirSync(path.join(__dirname, 'db', 'tables'))
    .map(t => [t.split('/')[-1], path.join(__dirname, 'db', 'tables', t)])
    .map(([t, p]) => [t, getQuery(p)]);
