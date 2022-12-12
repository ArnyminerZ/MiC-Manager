import mariadb, {SqlError} from 'mariadb';
import dotenv from 'dotenv';
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

dotenv.config();

/** @type {mariadb.PoolConnection} */
let conn;
/** @type {mariadb.Pool} */
let pool;

export const escape = str => pool.escape(str);

const getDatabasePassword = () => {
    let dbPassword = process.env.DB_PASSWORD;
    const dbPasswordFile = process.env.DB_PASSWORD_FILE;
    if (dbPassword == null)
        if (dbPasswordFile != null)
            if (fs.existsSync(dbPasswordFile))
                dbPassword = fs.readFileSync(dbPasswordFile);
            else
                error(`The Database's password file is defined but doesn't exist:`, dbPasswordFile);
        else
            error(`It's required to give either DB_PASSWORD or DB_PASSWORD_FILE`);
    return dbPassword;
}

/**
 * Connects to the configured database.
 * @author Arnau Mora
 * @since 20221117
 * @param {boolean} debug If true, a message will be displayed on error.
 * @return {Promise<void>}
 * @throws {SqlPermissionException} If the configured user is not authorised to use the database.
 */
const connect = async (debug = false) => {
    log(`Getting the database's password...`);
    let dbPassword = getDatabasePassword();

    /** @type {mariadb.PoolConfig} */
    const serverConfig = {
        host: process.env.DB_HOSTNAME,
        user: process.env.DB_USERNAME,
        password: dbPassword,
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
        if (e instanceof mariadb.SqlError)
            if (e.code === 'ER_TABLEACCESS_DENIED_ERROR')
                throw new SqlPermissionException(e.text);
            else if (e.code === 'ER_ACCESS_DENIED_ERROR')
                throw new SqlPermissionException(e.text);
        throw e;
    }
};

const disconnect = async () => await conn?.end();

const createDBUser = async () => {
    info('Creating user if it doesn\'t exist...');
    const rootPassword = fs.readFileSync(process.env.DB_ROOT_PASSWORD_FILE);
    const dbPassword = getDatabasePassword();

    /** @type {mariadb.PoolConfig} */
    const serverConfig = {
        host: process.env.DB_HOSTNAME,
        user: 'root',
        password: rootPassword,
        connectionLimit: 5,
        port: process.env.DB_PORT || 3306,
    };
    try {
        log('Logging in as root...');
        pool = mariadb.createPool(serverConfig);
        log('Connecting to the database...');
        conn = await pool.getConnection();

        log(`Creating database (${process.env.DB_DATABASE})...`);
        await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_DATABASE};`);
        log(`Creating user (${process.env.DB_USERNAME})...`);
        await conn.query(`CREATE USER IF NOT EXISTS '${process.env.DB_USERNAME}'@'%' IDENTIFIED BY '${dbPassword}';`);
        log('Granting privileges...');
        await conn.query(`GRANT ALL PRIVILEGES ON ${process.env.DB_DATABASE}.* TO '${process.env.DB_USERNAME}'@'%';`);
        log('Setting password...');
        await conn.query(`SET PASSWORD FOR '${process.env.DB_USERNAME}'@'%' = PASSWORD('${dbPassword}');`);
        log('Flushing...');
        await conn.query(`FLUSH PRIVILEGES;`);
    } catch (e) {
        error('Could not create database user from root. Error:', e);
        throw e;
    } finally {
        await conn?.end();
        conn = null;
        pool = null;
    }
};

/**
 * Tries connecting to the database, then disconnects.
 * @author Arnau Mora
 * @since 20221018
 * @param {boolean} debug If `true` and an error has been thrown, it will get logged.
 * @returns {Promise<Error>} `true` if the database is available, `false` otherwise.
 * @throws {SqlPermissionException} If the configured user is not authorised to use the database.
 */
export const check = async (debug = false) => {
    try {
        log('Creating database user if it doesn\'t exist...');
        await createDBUser();
        log('Checking database. Starting connection...');
        await connect(debug);

        // Check if database exists
        const queryResult = await query(
            `SELECT SCHEMA_NAME
             FROM information_schema.SCHEMATA
             WHERE SCHEMA_NAME = ?`,
            true,
            process.env.DB_DATABASE,
        );
        if (queryResult.length <= 0)
            throw new DatabaseException(`❌ Could not find a database named`, process.env.DB_DATABASE);

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

        return null;
    } catch (e) {
        error('Could not connect to the database. Error:', e);
        return e;
    }
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
        await conn.query(`USE ${process.env.DB_DATABASE};`);
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
