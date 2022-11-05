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
  const dbPassFile = process.env.DB_PASSWORD_FILE;
  const dbName = process.env.DB_DATABASE;
  if (dbHost == null)
    throw new EnvironmentVariableException("DB_HOSTNAME was not set.");
  if (dbUser == null)
    throw new EnvironmentVariableException("DB_USERNAME was not set.");
  if (dbPass == null && dbPassFile == null)
    throw new EnvironmentVariableException("DB_PASSWORD and DB_PASSWORD_FILE were not set.");
  if (dbName == null)
    throw new EnvironmentVariableException("DB_DATABASE was not set.");

  const calHost = process.env.CALDAV_HOSTNAME;
  const calPort = process.env.CALDAV_PORT;
  const calSsl = process.env.CALDAV_SSL_ENABLE;
  const calUser = process.env.CALDAV_USERNAME;
  const calPass = process.env.CALDAV_PASSWORD;
  const calAb = process.env.CALDAV_AB_UUID;
  if (calHost == null)
    throw new EnvironmentVariableException("CALDAV_HOSTNAME was not set.");
  if (calUser == null)
    throw new EnvironmentVariableException("CALDAV_USERNAME was not set.");
  if (calPass == null)
    throw new EnvironmentVariableException("CALDAV_PASSWORD was not set.");
  if (calAb == null)
    throw new EnvironmentVariableException("CALDAV_AB_UUID was not set.");
  if (calPort == null) process.env.CALDAV_PORT = '5232';
  if (calSsl == null) process.env.CALDAV_SSL_ENABLE = 'false';
};

/**
 * Gets all the enabled props.
 * @return {string[]}
 */
export const getProps = () => {
  const props = process.env.PROPS;
  return props != null ? props.split(';') : [];
}
