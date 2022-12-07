import {generateSecrets} from "./generator.js";
import path from "path";

const secretsDir = path.join(__dirname, 'secrets');
generateSecrets(secretsDir);
