import {initServer} from "./src/server/init";
import {loadConfig} from "./src/storage/config/base";
import {initDatabase} from "./src/storage/database/init";
import {generateKeys} from "./src/security/generator";

generateKeys();
loadConfig();
await initDatabase();
initServer();
