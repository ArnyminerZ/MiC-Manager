/**
 * Helps on checking that are the environment variables are set correctly.
 * @author Arnau Mora
 * @since 20221103
 * @file variables.js
 */

import {EnvironmentVariableException} from "./exceptions.js";
import {isNumber} from "./utils.js";

/**
 * Checks that all the required environment variables are set, and have valid values.
 * @author Arnau Mora
 * @since 20221103
 */
export const checkVariables = () => {
  const HTTP_PORT = process.env.HTTP_PORT;
  if (HTTP_PORT != null && !isNumber(HTTP_PORT)) {
    console.warn(
        `  The given HTTP_PORT is not a valid number (${HTTP_PORT}). 3000 will be taken.`
    );
    process.env.HTTP_PORT = '3000';
  }

  const dbHost = process.env.DB_HOSTNAME;
  const dbUser = process.env.DB_USERNAME;
  const dbPass = process.env.DB_PASSWORD;
  const dbName = process.env.DB_DATABASE;
  if (dbHost == null)
    throw new EnvironmentVariableException("DB_HOSTNAME was not set.");
  if (dbUser == null)
    throw new EnvironmentVariableException("DB_USERNAME was not set.");
  if (dbPass == null)
    throw new EnvironmentVariableException("DB_PASSWORD was not set.");
  if (dbName == null)
    throw new EnvironmentVariableException("DB_DATABASE was not set.");

  const calHost = process.env.CALDAV_HOSTNAME;
  const calUser = process.env.CALDAV_USERNAME;
  const calPass = process.env.CALDAV_PASSWORD;
  const calAb = process.env.CALDAV_AB_URL;
  if (calHost == null)
    throw new EnvironmentVariableException("CALDAV_HOSTNAME was not set.");
  if (calUser == null)
    throw new EnvironmentVariableException("CALDAV_USERNAME was not set.");
  if (calPass == null)
    throw new EnvironmentVariableException("CALDAV_PASSWORD was not set.");
  if (calAb == null)
    throw new EnvironmentVariableException("CALDAV_AB_URL was not set.");
};
