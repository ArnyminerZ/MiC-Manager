import path from 'path';
import {fileURLToPath} from 'url';
import fs from "fs/promises";

/**
 * @param ip The IP to parse.
 * @returns {number}
 */
export function ipToLong(ip: string) {
    let ipl = 0;
    ip.split('.').forEach(function (octet) {
        ipl <<= 8;
        ipl += parseInt(octet);
    });
    return (ipl >>> 0);
}

/**
 * Checks if a given value is a number.
 * @param value The value to check against
 */
export function isNumber(value: string): boolean {
    return /^-?\d+$/.test(value);
}

/**
 * Capitalizes the first letter of each word.
 * @author Arnau Mora
 * @since 20221105
 */
export function capitalize(text: string) {
    return text.toLowerCase()
        .split(' ')
        .map(t => {
            const newChar = t.charAt(0).toUpperCase();
            return newChar + t.substring(1);
        })
        .join(' ');
}

/**
 * Checks using the fs/promises library whether a path exists or not.
 * @author Arnau Mora
 * @since 20221207
 * @param path The path to check for. Can be both a file or a directory.
 * @returns *true* if the path exists, false otherwise.
 * @throws If there's another error while checking for the path's existence.
 */
export async function pathExists(path: string) {
    try {
        await fs.stat(path);
        return true;
    } catch(err: any) {
        if (err.hasOwnProperty('code') && err.code === 'ENOENT')
            return false;
        else
            throw err;
    }
}

/**
 * Waits the given amount of milliseconds.
 * @param ms The amount of milliseconds to wait.
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Adds leading `0` to `num` until it has length `size`.
 * @param number The number to pad.
 * @param size The final length of the number.
 */
export function pad(number: number, size: number): string {
    let num = number.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

/**
 * Checks if a given date follows the format YYYY-MM-dd.
 */
export function isValidDate (date: string): boolean {
    const regex = /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/g;
    return regex.test(date);
}

/**
 * Merges two maps together.
 * @param maps All the maps to join.
 */
export function merge<K, V>(...maps: Map<K, V>[]): Map<K, V> {
    const newMap = new Map<K, V>();
    for (const map of maps) {
        for (const key in map.keys()) {
            const value = map.get(key as K);
            newMap.set(key as K, value as V);
        }
    }
    return newMap;
}

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(path.join(__filename, '..'));
