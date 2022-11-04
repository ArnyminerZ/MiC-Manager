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
  const host = process.env.DB_HOSTNAME;
  const user = process.env.DB_USERNAME;
  const pass = process.env.DB_PASSWORD;
  const dbnm = process.env.DB_DATABASE;
  if (host == null)
    throw new EnvironmentVariableException("DB_HOSTNAME was not set.");
  if (user == null)
    throw new EnvironmentVariableException("DB_USERNAME was not set.");
  if (pass == null)
    throw new EnvironmentVariableException("DB_PASSWORD was not set.");
  if (dbnm == null)
    throw new EnvironmentVariableException("DB_DATABASE was not set.");
};
