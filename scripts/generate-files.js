import fs from 'fs';
import path from "path";
import {faker} from "@faker-js/faker";

import {__dirname} from "../src/utils.js";
import {info} from "../cli/logger.js";

const secretsDir = path.join(__dirname, 'secrets');

if (!fs.existsSync(secretsDir)) fs.mkdirSync(secretsDir);

const secrets = ['password', 'root-password', 'firefly-password', 'firefly-root-password', 'firefly-app-key'];

for (const secret of secrets) {
    const file = path.join(secretsDir, `${secret}.txt`);
    if (!fs.existsSync(file)) {
        info('Generating random contents for', file);
        fs.writeFileSync(file, faker.internet.password(32));
    }
}
