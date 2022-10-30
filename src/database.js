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
} from "../model/Tables.js";
import {DatabaseException} from "./exceptions.js";
import {InsertDefaultRole} from "../model/Defaults.js";

dotenv.config();

const serverConfig = {
    host: process.env.DB_HOSTNAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    connectionLimit: 5,
};
const pool = mariadb.createPool(serverConfig);

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
        if (queryResult?.recordset?.get(0) <= 0)
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

        await disconnect();

        return true;
    } catch (e) {
        if (debug) console.error(e, 'Config:', serverConfig);
        return false;
    }
};

/**
 *
 * @param query
 * @param shouldDisconnect
 * @return {Promise<Request>}
 */
export const query = async (query, shouldDisconnect = true) => {
    let result;
    try {
        await connect();
        result = await conn.query(query);
    } finally {
        if (shouldDisconnect)
            await disconnect();
    }
    return result;
};
