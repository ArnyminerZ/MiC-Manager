import fs from 'fs';
import path from "path";

import {__dirname} from "../src/utils";

/**
 * Gets the contents of the given path. Fetches all the commands contained in the SQL file.
 * @param path The path of the SQL file.
 */
function getQuery(path: string): string[] {
    const fileContents = fs.readFileSync(path);
    const lines = fileContents.toString().split('\n');
    let index = 0;
    const queries: string[][] = [];
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
}

/** Provides some queries contained in a SQL file. */
type Query = {
    /** The name of the file that contained the query */
    name: string,
    /** All the queries inside the file */
    queries: string[]
};

/** Gets the query commands for creating all the tables. */
export function getQueries(): Query[] {
    return fs
        // Get a list of all the files inside /db/tables
        .readdirSync(path.join(__dirname, 'db', 'tables'))
        // Get the names of the files
        .map(t => [t.split('/')[-1], path.join(__dirname, 'db', 'tables', t)])
        // Iterate each of them, and parse the queries inside them
        .map(([name, path]) => {
            return {name, queries: getQuery(path)};
        });
}
