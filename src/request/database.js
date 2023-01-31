import mariadb, {SqlError} from 'mariadb';
import fs from 'fs';

import {
    AscentsTable,
    AssistanceTable,
    CategoriesTable,
    EventMenusTable,
    EventsTable,
    GradesPricingTable,
    GradesTable,
    InfoTable,
    LoginAttemptsTable,
    MenuPricingTable,
    PeopleTablesTable,
    PermissionsTable,
    PositionsTable,
    RegistrationsTable,
    RolesPermissionsTable,
    RolesTable,
    TablesTable,
    UserPositionsTable,
    UserShootsTable,
    UsersTable,
    UserTrebuchetTable
} from "../../model/Tables.js";
import {DatabaseException, SqlPermissionException} from "../exceptions.js";
import {
    InsertCategories,
    InsertDefaultGradePricing,
    InsertDefaultRoles,
    InsertGrades,
    InsertInfo,
    InsertPermissions,
    InsertPositions,
    InsertRolesPermissions,
} from "../../model/Defaults.js";
import {error, info, log} from '../../cli/logger.js';
import {isNumber} from "../utils.mjs";

/** @type {mariadb.PoolConnection} */
let conn;
/** @type {mariadb.Pool} */
let pool;

export const escape = str => pool.escape(str);

/**
 * Gets the value of the environment variable named `name`, or the contents of the file at the environment variable
 * `name_FILE`.
 * @param {string} name The name of the environment variable.
 * @return {string}
 */
const getEnvOrFile = (name) => {
    const env = process.env[name];
    const file = process.env[name + `_FILE`];
    if (env == null)
        if (file != null)
            if (fs.existsSync(file))
                return fs.readFileSync(file).toString();
            else
                error(`File for ${name} is defined but doesn't exist:`, file);
        else
            error(`It's required to give either ${name} or ${name}_FILE`);
    return env
};

/**
 * Connects to the configured database.
 * @author Arnau Mora
 * @since 20221117
 * @param {boolean} debug If true, a message will be displayed on error.
 * @return {Promise<void>}
 * @throws {SqlPermissionException} If the configured user is not authorised to use the database.
 */
const connect = async (debug = false) => {
    /** @type {mariadb.PoolConfig} */
    const serverConfig = {
        host: getEnvOrFile('DB_HOSTNAME'),
        user: getEnvOrFile('DB_USERNAME'),
        password: getEnvOrFile('DB_PASSWORD'),
        connectionLimit: 5,
        port: process.env.DB_PORT || 3306,
    };

    try {
        log('Creating pool...');
        if (pool == null) pool = mariadb.createPool(serverConfig);
        log('Connecting to the database...');
        conn = await pool.getConnection();
    } catch (e) {
        if (debug) error(e, 'Database Host:', serverConfig.host, 'User:', serverConfig.user);
        if (e instanceof SqlError)
            if (e.code === 'ER_TABLEACCESS_DENIED_ERROR')
                throw new SqlPermissionException(e.text);
            else if (e.code === 'ER_ACCESS_DENIED_ERROR')
                throw new SqlPermissionException(e.text);
        throw e;
    }
};

const disconnect = async () => await conn?.end();

/**
 * Tries connecting to the database, then disconnects.
 * @author Arnau Mora
 * @since 20221018
 * @param {boolean} debug If `true` and an error has been thrown, it will get logged.
 * @returns {Promise<*>} `true` if the database is available, `false` otherwise.
 * @throws {SqlPermissionException} If the configured user is not authorised to use the database.
 * @throws {DatabaseException} If the database configured doesn't exist.
 */
export const check = async (debug = false) => {
    log('Checking database. Starting connection...');
    await connect(debug);

    const database = getEnvOrFile('DB_DATABASE');
    log('DB_DATABASE:', process.env.DB_DATABASE, 'DB_DATABASE_FILE:', process.env.DB_DATABASE_FILE);
    log('database:', database);

    // Check if database exists
    const queryResult = await query(
        `SELECT SCHEMA_NAME
         FROM information_schema.SCHEMATA
         WHERE SCHEMA_NAME = ?`,
        true,
        database,
    );
    if (queryResult.length <= 0)
        throw new DatabaseException(`❌ Could not find a database named`, database);

    // Create tables
    /** @type {string[]} */
    const tables = [
        InfoTable, RolesTable, GradesTable, UsersTable, LoginAttemptsTable, PermissionsTable, CategoriesTable,
        EventsTable, AssistanceTable, TablesTable, PeopleTablesTable, RolesPermissionsTable, RegistrationsTable,
        AscentsTable, PositionsTable, UserPositionsTable, UserTrebuchetTable, UserShootsTable, EventMenusTable,
        MenuPricingTable, GradesPricingTable
    ];
    for (let table of tables) await query(table);

    // Insert default data
    /** @type {string[][]} */
    const defaults = [
        InsertInfo, InsertDefaultRoles, InsertPermissions, InsertRolesPermissions, InsertGrades, InsertPositions,
        InsertCategories, InsertDefaultGradePricing,
    ];
    for (let i of defaults) for (let q of i) await query(q);

    await disconnect();
};

/**
 * Makes a SQL query to the database.
 * @author Arnau Mora
 * @since 20221030
 * @param {string} query The SQL query to make.
 * @param {boolean} shouldDisconnect If false, the connection to the database won't get disconnected after fetching.
 * @param {any?} parameters Parameters to replace in the placeholder.
 * @return {Promise<Object[]>} The rows fetched
 */
export const query = async (query, shouldDisconnect = true, ...parameters) => {
    let result;
    try {
        if (conn == null || !conn.isValid())
            await connect();
        await conn.query(`USE ${getEnvOrFile('DB_DATABASE')};`);
        result = await conn.query(
            query,
            [...parameters.map(p => p == null || p.toString().toUpperCase() === 'NULL' ? null : p)],
        );
    } finally {
        if (shouldDisconnect)
            await disconnect();
    }
    return result;
};

/**
 * Fetches the database information.
 * @author Arnau Mora
 * @since 20221105
 * @return {Promise<{version:string}>}
 */
export const dbInfo = async () => {
    /**
     * @type {{Id:number,Value:string}[]}
     */
    const info = await query(`SELECT *
                              FROM mInfo`);
    return {
        version: info.find(v => v.Id === 1)?.Value,
        registration: info.find(v => v.Id === 2)?.Value === '1',
    };
}

/**
 * Removes a row if it exists, using the where clause.
 * @author Arnau Mora
 * @since 20221109
 * @param {string} table
 * @param {Map<string, string>} where
 * @return {Promise<Object[]>}
 */
export const removeIfExists = async (table, where) => {
    const whereQuery = [];
    where.forEach((w, k) => whereQuery.push(`${k}=${isNumber(w) || w == null ? w : `'${w}'`}`));

    return await query(`DELETE
                        FROM ?
                        WHERE ?
                          AND EXISTS(SELECT 1 FROM ? WHERE ?)`,
        true,
        table,
        whereQuery.join(' AND '),
        table,
        whereQuery.join(' AND '),
    )
};
