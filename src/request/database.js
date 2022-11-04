import mariadb from 'mariadb';
import dotenv from 'dotenv';
import {
    AssistanceTable,
    CategoriesTable,
    EventsTable,
    LoginAttemptsTable,
    PeopleTablesTable,
    PermissionsTable,
    RolesPermissionsTable,
    RolesTable,
    SociosTable,
    TablesTable,
    UsersTable
} from "../../model/Tables.js";
import {DatabaseException} from "../exceptions.js";
import {InsertDefaultRole, InsertPermissions} from "../../model/Defaults.js";

dotenv.config();

const serverConfig = {
    host: process.env.DB_HOSTNAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    connectionLimit: 5,
};
const pool = mariadb.createPool(serverConfig);

/** @type {mariadb.PoolConnection} */
let conn;

const connect = async () => {
    conn = await pool.getConnection();
};

const disconnect = async () => await conn?.end();

/**
 * Tries connecting to the database, then disconnects.
 * @author Arnau Mora
 * @since 20221018
 * @param {boolean} debug If `true` and an error has been thrown, it will get logged.
 * @returns {Promise<boolean>} `true` if the database is available, `false` otherwise.
 */
export const check = async (debug = false) => {
    try {
        await connect();

        // Check if database exists
        const queryResult = await query(
            `SELECT SCHEMA_NAME
             FROM information_schema.SCHEMATA
             WHERE SCHEMA_NAME = '${process.env.DB_DATABASE}'`
        );
        if (queryResult.length <= 0)
            throw new DatabaseException(`❌ Could not find a database named`, process.env.DB_DATABASE);

        // Create tables
        await query(UsersTable);
        await query(LoginAttemptsTable);
        await query(SociosTable);
        await query(RolesTable);
        await query(PermissionsTable);
        await query(CategoriesTable);
        await query(EventsTable);
        await query(AssistanceTable);
        await query(TablesTable);
        await query(PeopleTablesTable);
        await query(RolesPermissionsTable);

        // Insert default data
        await query(InsertDefaultRole);
        for (const q of InsertPermissions) await query(q);

        await disconnect();

        return true;
    } catch (e) {
        if (debug) console.error(e, 'Config:', serverConfig);
        return false;
    }
};

/**
 * Makes a SQL query to the database.
 * @author Arnau Mora
 * @since 20221030
 * @param {string} query The SQL query to make.
 * @param {boolean} shouldDisconnect If false, the connection to the database won't get disconnected after fetching.
 * @return {Promise<[]>} The rows fetched
 */
export const query = async (query, shouldDisconnect = true) => {
    let result;
    try {
        if (conn == null || !conn.isValid())
            await connect();
        await conn.query(`USE ${process.env.DB_DATABASE};`);
        result = await conn.query(query);
    } finally {
        if (shouldDisconnect)
            await disconnect();
    }
    return result;
};
