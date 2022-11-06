import mariadb from 'mariadb';
import dotenv from 'dotenv';
import {
    AscentsTable,
    AssistanceTable,
    CategoriesTable,
    EventsTable,
    GradesTable,
    InfoTable,
    LoginAttemptsTable,
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
import {DatabaseException} from "../exceptions.js";
import {
    InsertCategories,
    InsertDefaultRoles,
    InsertGrades,
    InsertInfo,
    InsertPermissions,
    InsertPositions,
    InsertRolesPermissions
} from "../../model/Defaults.js";
import fs from "fs";

dotenv.config();

/** @type {mariadb.PoolConnection} */
let conn;

const connect = async (debug = false) => {
    let dbPassword = process.env.DB_PASSWORD;
    const dbPasswordFile = process.env.DB_PASSWORD_FILE;
    if (dbPassword == null)
        if (dbPasswordFile != null)
            if (fs.existsSync(dbPasswordFile))
                dbPassword = fs.readFileSync(dbPasswordFile);
            else
                console.error(`The Database's password file is defined but doesn't exist:`, dbPasswordFile);
        else
            console.error(`It's required to give either DB_PASSWORD or DB_PASSWORD_FILE`);

    const serverConfig = {
        host: process.env.DB_HOSTNAME,
        user: process.env.DB_USERNAME,
        password: dbPassword,
        connectionLimit: 5,
    };

    try {
        const pool = mariadb.createPool(serverConfig);
        conn = await pool.getConnection();
    } catch (e) {
        if (debug) console.error(e, 'Database Config:', serverConfig);
        throw e;
    }
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
        await connect(debug);

        // Check if database exists
        const queryResult = await query(
            `SELECT SCHEMA_NAME
             FROM information_schema.SCHEMATA
             WHERE SCHEMA_NAME = '${process.env.DB_DATABASE}'`
        );
        if (queryResult.length <= 0)
            throw new DatabaseException(`❌ Could not find a database named`, process.env.DB_DATABASE);

        // Create tables
        await query(InfoTable);
        await query(RolesTable);
        await query(GradesTable);
        await query(UsersTable);
        await query(LoginAttemptsTable);
        await query(PermissionsTable);
        await query(CategoriesTable);
        await query(EventsTable);
        await query(AssistanceTable);
        await query(TablesTable);
        await query(PeopleTablesTable);
        await query(RolesPermissionsTable);
        await query(RegistrationsTable);
        await query(AscentsTable);
        await query(PositionsTable);
        await query(UserPositionsTable);
        await query(UserTrebuchetTable);
        await query(UserShootsTable);

        // Insert default data
        for (const q of InsertInfo) await query(q);
        for (const q of InsertDefaultRoles) await query(q);
        for (const q of InsertPermissions) await query(q);
        for (const q of InsertRolesPermissions) await query(q);
        for (const q of InsertGrades) await query(q);
        for (const q of InsertPositions) await query(q);
        for (const q of InsertCategories) await query(q);

        await disconnect();

        return true;
    } catch (e) {
        console.error('Could not connect to the database. Error:', e);
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

/**
 * Fetches the database information.
 * @author Arnau Mora
 * @since 20221105
 * @return {Promise<{version:string}>}
 */
export const info = async () => {
    /**
     * @type {{Id:number,Value:string}[]}
     */
    const info = await query(`SELECT *
                              FROM mInfo`);
    return {
        version: info.find(v => v.Id === 1)?.Value,
    };
}
