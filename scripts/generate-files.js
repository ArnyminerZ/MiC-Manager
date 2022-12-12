import {generateSecrets} from "./generator.js";
import path from "path";
import {__dirname} from "../src/utils.mjs";

const secretsDir = path.join(__dirname, 'secrets');
generateSecrets(secretsDir);
