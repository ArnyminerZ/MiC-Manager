/**
 * Helps on checking that are the environment variables are set correctly.
 * @author Arnau Mora
 * @since 20221103
 * @file environment.js
 */

import {EnvironmentVariableError} from "./exceptions.js";
import {isNumber} from "./utils.mjs";
import fs from "fs";
import {error} from "../cli/logger.js";

/**
 * Checks that all the required environment variables are set, and have valid values.
 * @author Arnau Mora
 * @since 20221103
 * @throws {EnvironmentVariableError} If there's one or more missing environment variables.
 */
export const checkVariables = () => {
  const HTTP_PORT = process.env.HTTP_PORT;
  if (HTTP_PORT != null && !isNumber(HTTP_PORT)) {
    console.warn(
        `  The given HTTP_PORT is not a valid number (${HTTP_PORT}). 3000 will be taken.`
    );
    process.env.HTTP_PORT = '3000';
  }

  let missingVariables = [];

  const dbHost = process.env.DB_HOSTNAME;
  const dbUser = process.env.DB_USERNAME;
  const dbPass = process.env.DB_PASSWORD;
  const dbPassFile = process.env.DB_PASSWORD_FILE;
  const dbName = process.env.DB_DATABASE;
  if (dbHost == null)
    missingVariables.push('DB_HOSTNAME');
  if (dbUser == null)
    missingVariables.push('DB_USERNAME');
  if (dbPass == null && dbPassFile == null)
    missingVariables.push('DB_PASSWORD', 'DB_PASSWORD_FILE');
  if (dbName == null)
    missingVariables.push('DB_DATABASE');

  const calHost = process.env.CALDAV_HOSTNAME;
  const calPort = process.env.CALDAV_PORT;
  const calSsl = process.env.CALDAV_SSL_ENABLE;
  const calUser = process.env.CALDAV_USERNAME;
  const calPass = process.env.CALDAV_PASSWORD;
  const calAb = process.env.CALDAV_AB_UUID;
  if (calHost == null)
    missingVariables.push('CALDAV_HOSTNAME');
  if (calUser == null)
    missingVariables.push('CALDAV_USERNAME');
  if (calPass == null)
    missingVariables.push('CALDAV_PASSWORD');
  if (calAb == null)
    missingVariables.push('CALDAV_AB_UUID');
  if (calPort == null) process.env.CALDAV_PORT = '5232';
  if (calSsl == null) process.env.CALDAV_SSL_ENABLE = 'false';

  const fireflyHost = process.env.FIREFLY_HOST;
  const fireflyPort = process.env.FIREFLY_PORT;
  const fireflyToken = process.env.FIREFLY_TOKEN_FILE;
  if (fireflyHost == null)
    missingVariables.push('FIREFLY_HOST');
  if (fireflyPort == null)
    missingVariables.push('FIREFLY_PORT');
  if (fireflyToken == null)
    missingVariables.push('FIREFLY_TOKEN_FILE');

  const billingDay = parseInt(process.env.BILLING_CYCLE_DAY);
  const billingMonth = parseInt(process.env.BILLING_CYCLE_MONTH);
  if (billingDay == null || isNaN(billingDay) || billingDay <= 0 || billingDay > 31) process.env.BILLING_CYCLE_DAY = '26';
  if (billingMonth == null || isNaN(billingMonth) || billingMonth <= 0 || billingMonth > 12) process.env.BILLING_CYCLE_MONTH = '4';

  const stripeSecret = parseInt(process.env.STRIPE_SECRET);
  if (stripeSecret == null)
    missingVariables.push('STRIPE_SECRET');

  if (missingVariables.length > 0)
    throw new EnvironmentVariableError("Missing environment variables:", missingVariables.join(', '));
};

/**
 * Gets all the enabled props.
 * @return {string[]}
 */
export const getProps = () => {
  const props = process.env.PROPS;
  return props != null ? props.split(';') : [];
};

/**
 * Checks that all the required files are available and well configured.
 */
export const checkFiles = () => {
  const fireflyToken = process.env.FIREFLY_TOKEN_FILE;
  if (!fs.existsSync(fireflyToken)) {
    error('Firefly is not properly configured. Please, follow the instructions in the README. Missing files:');
    error('- firefly-token.txt:', fireflyToken);
    process.exit(1);
  }
};
