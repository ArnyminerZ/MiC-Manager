'use strict';

import {bootCaldav, bootDatabase, bootEnvironment, bootFirefly, bootServer} from "./src/bootup.mjs";

bootEnvironment();

await bootDatabase();
await bootCaldav();
await bootFirefly();

// TODO: Fix stripe
// info('Checking Stripe connection...');
// await checkPayments();

bootServer();
