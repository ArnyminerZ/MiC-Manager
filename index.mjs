import {initServer} from "./src/server/init.mjs";
import {loadConfig} from "./src/storage/config/base.mjs";
import {initDatabase} from "./src/storage/database/init.mjs";
import {generateKeys} from "./src/security/generator.mjs";

generateKeys();
loadConfig();
await initDatabase();
initServer();
