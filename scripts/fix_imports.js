import fs from 'fs';
import path from 'path';

import {__dirname} from "./utils/files.mjs";

const importRegex = /import .* from ["'].*["'];?/gm;

/**
 * Renames all the `.js` files in `path` to `.mjs`.
 * @param {string} dir The location of the files in the filesystem.
 * @param {number} depth The depth of the current iteration.
 */
function renameDir(dir, depth = 0) {
    /** @type {string[]} */
    const files = fs.readdirSync(dir).map(file => path.join(dir, file));
    for (const file of files) {
        const stat = fs.lstatSync(file);
        // console.log(' '.repeat(depth) + "-", file);
        if (stat.isDirectory())
            if (file.endsWith('node_modules'))
                continue;
            else
                renameDir(file, depth + 1);
        else {
            if (!file.endsWith('js')) continue;

            const contents = fs.readFileSync(file).toString();
            let updatedContents = contents;

            let myArray;
            while ((myArray = importRegex.exec(contents)) !== null) {
                let line = myArray[0];
                if (!line.includes('./')) continue;
                if (line.includes('js')) continue;
                if (!line.trimEnd().endsWith(';')) line += ';';
                const pos = line.length - 2;
                const newLine = line.substring(0, pos) + '.js' + line.substring(pos);

                // console.log(' '.repeat(depth) + "-", myArray[0], '->', newLine);
                updatedContents = updatedContents.replace(myArray[0], newLine);
            }
            // console.log(' '.repeat(depth) + "-", file);
            fs.rmSync(file);
            fs.writeFileSync(file, updatedContents);
        }
    }
}

renameDir(__dirname);
