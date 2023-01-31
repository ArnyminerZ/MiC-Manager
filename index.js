'use strict';

import packageJson from "./package.json" assert {type: 'json'};
import {bootCaldav, bootDatabase, bootEnvironment, bootFirefly, bootServer} from "./src/bootup.mjs";
import {initializeBranding} from "./src/endpoints/branding.mjs";
import {info} from "./cli/logger.js";

info('');
info('  __  __ _  _____   __  __                                   ');
info(' |  \\/  (_)/ ____| |  \\/  |                                  ');
info(' | \\  / |_| |      | \\  / | __ _ _ __   __ _  __ _  ___ _ __ ');
info(' | |\\/| | | |      | |\\/| |/ _` | \'_ \\ / _` |/ _` |/ _ \\ \'__|');
info(' | |  | | | |____  | |  | | (_| | | | | (_| | (_| |  __/ |   ');
info(' |_|  |_|_|\\_____| |_|  |_|\\__,_|_| |_|\\__,_|\\__, |\\___|_|   ');
info('                                              __/ |          ');
info('                                             |___/           ');
info('');
info('Version:', packageJson.version);
info('');

bootEnvironment();

await bootDatabase();
await bootCaldav();
await bootFirefly();

await initializeBranding();

// TODO: Fix stripe
// info('Checking Stripe connection...');
// await checkPayments();

bootServer();
