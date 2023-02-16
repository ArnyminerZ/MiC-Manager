import fs from "fs";
import path from "path";

import buildDir from './utils/build.mjs';
import {__dirname} from "./utils/files.mjs";

const build = buildDir();

const source = path.join(__dirname, 'micmanager.conf');
const target = path.join(build, 'micmanager.conf');

fs.copyFileSync(source, target);
