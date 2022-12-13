'use strict';

import {bootCaldav, bootDatabase, bootEnvironment, bootFirefly, bootServer} from "./src/bootup.mjs";
import {initializeBranding} from "./src/endpoints/branding.mjs";

bootEnvironment();

await bootDatabase();
await bootCaldav();
await bootFirefly();

await initializeBranding();

// TODO: Fix stripe
// info('Checking Stripe connection...');
// await checkPayments();

bootServer();
