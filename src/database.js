import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const sqlConfig = {
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_HOSTNAME,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
    },
}

const connect = async () => await sql.connect(sqlConfig);

const disconnect = async () => await sql.close();

/**
 * Tries connecting to the database, then disconnects.
 * @author Arnau Mora
 * @since 20221018
 * @param {boolean} debug If `true` and an error has been thrown, it will get logged.
 * @returns {Promise<boolean>} `true` if the database is available, `false` otherwise.
 */
export const check = async (debug = false) => {
    try {
        return !!(await connect()) && !!(await disconnect())
    } catch (e) {
        if (debug) console.error(e, 'Config:', sqlConfig);
        return false;
    }
};

export const query = async (query, shouldDisconnect = true) => {
    let result;
    try {
        await connect();
        result = await sql.query(query);
    } finally {
        if (shouldDisconnect)
            await disconnect();
    }
    return result;
};
