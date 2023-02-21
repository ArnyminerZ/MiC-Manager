/**
 * @file logger.mjs
 * Provides some utility functions for sending messages through the terminal.
 *
 * **Environment variables:**
 * - `LOG_LEVEL`: Can be one of:
 *   - `error`
 *   - `warn`
 *   - `info`
 *   - `debug`
 *   - 'none
 * - `LOG_FILE`: The path where to store all the messages logged.
 */

import fs from 'fs';

import {BgBlack, BgBlue, BgGreen, BgRed, BgYellow, FgWhite, Reset} from './colors';
import path from "path";

type LogLevels = 'error' | 'warn' | 'info' | 'debug' | 'none'

/**
 * All the available log levels.
 */
export const LogLevels = ['error', 'warn', 'info', 'debug', 'none']

/** Gets the index of the given logLevel. Returns -1 if not found. */
function findLogLevelIndex(logLevel: LogLevels|string): number {
    return LogLevels.indexOf(logLevel);
}

/** Checks the currently set log level, in comparison with a desired one. */
function checkLogLevel(level: LogLevels): boolean {
    if (process.env.LOG_LEVEL == null) return true;

    const levelIndex = findLogLevelIndex(level);
    const choseIndex = findLogLevelIndex(process.env.LOG_LEVEL);
    return levelIndex >= 0 && choseIndex >= 0 ? choseIndex < levelIndex : true;
}

export const exposedForTesting = {findLogLevelIndex, checkLogLevel};

/**
 * Writes a log message to `LOG_FILE`, if set.
 * @param level The log level of the log message.
 * @param objects The contents of the log.
 */
function writeLogMessage(level: LogLevels, ...objects: any) {
    const logfile = process.env.LOG_FILE;
    if (logfile == null) return;

    // Create the parent directory of the log file if it doesn't exist
    const logfileDir = path.basename(path.dirname(logfile));
    if (!fs.existsSync(logfileDir)) fs.mkdirSync(logfileDir);

    // Create the line to log
    const now = new Date();
    let logLine = [
        now.toUTCString(),
        '<>',
        level.toUpperCase(),
        '>>',
        [...objects].join(' '),
    ].join(' ');

    // Open the log file in append mode
    const fd = fs.openSync(logfile, 'a');
    // Write the file contents
    fs.writeSync(fd, logLine);
    // Close the file descriptor
    fs.closeSync(fd);
}

export function error(...objects: any) {
    if (!checkLogLevel('error')) return;
    writeLogMessage('error', ...objects);
    console.error(BgRed + FgWhite + " FAIL " + Reset, ...objects)
}

export function warn(...objects: any) {
    if (!checkLogLevel('warn')) return;
    writeLogMessage('warn', ...objects);
    console.error(BgYellow + FgWhite + " WARN " + Reset, ...objects)
}

export function info(...objects: any) {
    if (!checkLogLevel('info')) return;
    writeLogMessage('info', ...objects);
    console.error(BgBlue + FgWhite + " INFO " + Reset, ...objects)
}

export function infoSuccess(...objects: any) {
    if (!checkLogLevel('info')) return;
    writeLogMessage('info', ...objects);
    console.error(BgGreen + FgWhite + "  OK  " + Reset, ...objects)
}

export function log(...objects: any) {
    if (!checkLogLevel('debug')) return;
    writeLogMessage('debug', ...objects);
    console.error(BgBlack + FgWhite + " LOG  " + Reset, ...objects)
}
