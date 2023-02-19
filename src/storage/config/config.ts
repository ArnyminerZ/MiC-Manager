interface Accepts {}

export const ACCEPTS_ALL: Accepts = -2000;

interface Type {
}

export const TYPE_STRING: Type = 'string';
export const TYPE_NUMBER: Type = 'number';
export const TYPE_BOOLEAN: Type = 'boolean';

export function TYPE_FILE(baseDir: string, touch: boolean = false): TypeFile {
    return {baseDir, touch};
}

export type AcceptsRange = { min: number, max: number }

export enum Generator {
    GENERATE_RANDOM_USERNAME = -1000,
    GENERATE_RANDOM_PASSWORD = -1001,
    GENERATE_RANDOM_UUID = -1002,
}

export interface TypeFile extends Type {
    /** The base directory in which to find this file. */
    baseDir: string;
    /** If true, the file will be touched if it doesn't exist. */
    touch: boolean;
}

export function instanceOfTypeFile(object: Type): object is TypeFile {
    return object.hasOwnProperty('baseDir') && object.hasOwnProperty('touch');
}

export interface ConfigDefinition {
    key: string;
    type: Type;
    generator?: string|number|boolean|Generator;
    accepts: typeof ACCEPTS_ALL|string[]|number[]|AcceptsRange
}

export interface StringConfig extends ConfigDefinition {
    type: typeof TYPE_STRING,
    generator?: string|Generator,
    accepts: typeof ACCEPTS_ALL|string[]
}

export interface NumberConfig extends ConfigDefinition {
    type: typeof TYPE_NUMBER,
    generator?: number,
    accepts: typeof ACCEPTS_ALL|number[]|AcceptsRange
}

export interface BooleanConfig extends ConfigDefinition {
    type: typeof TYPE_BOOLEAN,
    generator?: boolean,
    accepts: typeof ACCEPTS_ALL|boolean
}

export interface FileConfig extends ConfigDefinition {
    type: TypeFile,
    generator?: string,
    accepts: typeof ACCEPTS_ALL|string[]
}

/**
 * Stores all the available configuration options.
 */
export const KeysAndValues: ConfigDefinition[] = [
    {key: 'LOG_LEVEL', type: TYPE_STRING, generator: 'warn', accepts: ['debug', 'info', 'warn', 'error']},
    {key: 'LOG_FILE', type: TYPE_FILE('.', true), generator: 'mic_manager.log', accepts: ACCEPTS_ALL},
    {key: 'SQLITE_FILE', type: TYPE_FILE('.', true), generator: 'database.sqlite', accepts: ACCEPTS_ALL},
    {key: 'PHONE_REGION', type: TYPE_NUMBER, generator: 34, accepts: ACCEPTS_ALL},
];
