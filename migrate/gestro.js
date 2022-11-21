/**
 * This script provides a utility for migrating all the data from GesTro to MiC Manager.
 *
 * ATTENTION: REMEMBER TO ENABLE THE "migration" PROP!
 * @author Arnau Mora
 * @since 20221105
 */

import {error, info, infoSuccess} from '../cli/logger.js';
import axios, {AxiosError} from "axios";
import sql from 'mssql';
import dateFormat from "dateformat";
import cliProgress from 'cli-progress';

import {capitalize} from "../src/utils.js";

let server, port, database, schema, user, password, micInstance;

// Parse arguments
process.argv.forEach(v => {
    const split = v.split('=');
    const key = split[0];
    const value = split[1];
    switch (key) {
        case 'HOSTNAME':
            server = value;
            break;
        case 'PORT':
            port = value;
            break;
        case 'DATABASE':
            database = value;
            break;
        case 'SCHEMA':
            schema = value;
            break;
        case 'USERNAME':
            user = value;
            break;
        case 'PASSWORD':
            password = value;
            break;
        case 'INSTANCE':
            micInstance = value;
            break;
    }
});
if (server == null || port == null || database == null || schema == null || user == null || password == null || micInstance == null) {
    error('Missing arguments. Check documentation.');
    process.exit(2);
}

const v1Request = (path) => micInstance + '/v1/' + path;

// Check if the instance is available and has the migration prop enabled
try {
    info('Checking the MiC instance...');
    const pingRequest = await axios.get(v1Request('migration/ping'));
    if (pingRequest.data !== 'pong') {
        error(`The MiC instance doesn't have the migration prop enabled.`);
        process.exit(3);
    }
    infoSuccess('MiC instance available and ready.');
} catch (e) {
    error(`Could not reach the MiC instance. Error:`, e);
    process.exit(3);
}

const sqlConfig = {
    user,
    password,
    database,
    server,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
    options: {
        encrypt: true, // for azure
        trustServerCertificate: true, // for local dev / self-signed certs
    },
};

// Try connecting
try {
    info('Connecting to the database...');
    await sql.connect(sqlConfig);
    infoSuccess('Database is available.');
} catch (e) {
    error('Could not connect to the database. Error:', e);
    process.exit(1);
}

try {
    info('Fetching from tbSocios...');
    const request = await sql.query(`SELECT *
                                     FROM ${schema}.tbSocios;`);
    const count = request.rowsAffected[0];
    info('Got', count, 'people. Parsing...');
    /** @type {Object} */
    const rows = request.recordset;
    let c = 1;
    /** @type {[string, Object][]} */
    const cRows = rows
        .map(row => {
            const name = capitalize(row['Nombre'].trim()), surname = capitalize(row['Apellidos'].trim());
            let data = {
                formattedName: `${name} ${surname}`,
                name: [name, surname],
                telephones: [],
            };

            if (row['Direccion'] != null) data['address'] = ['home', row['Direccion']];
            if (row['FecNacimiento'] != null) data['birthday'] = dateFormat(new Date(row['FecNacimiento']), 'yyyyMMdd');
            if (row['TlfParticular'] != null) data['telephones'].push(['home', row['TlfParticular']]);
            if (row['TlfTrabajo'] != null) data['telephones'].push(['work', row['TlfTrabajo']]);
            if (row['TlfMovil'] != null) data['telephones'].push(['cell', row['TlfMovil']]);
            if (row['eMail'] != null) data['email'] = row['eMail'];
            if (row['Fotografia'] != null) data['photo'] = row['Fotografia'];

            return [JSON.stringify(data), row];
        })

    /** @type {[string,Object][]} */
    const uuids = [];
    const peopleBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    peopleBar.start(cRows.length, 0);
    for (let [card, row] of cRows) {
        peopleBar.update(c);
        try {
            const response = await axios.post(v1Request('migration/add_person'), {data: card});
            const responseData = response.data.data;
            uuids.push([responseData.uuid, row]);
        } catch (e) {
            error(`Could not add person #${c}. Error:`, e);
        } finally {
            c++;
        }
    }
    peopleBar.stop();

    infoSuccess('Successfully imported', uuids.length, 'people.');
    info('Registering users...');
    c = 1;
    const usersBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    usersBar.start(uuids.length, 0);
    let errors = [];
    for (let [uuid, row] of uuids) {
        usersBar.update(c);
        let Grade;
        switch (parseInt(row['idTipoFestero'])) {
            case 1: // Alevin
                Grade = 7;
                break;
            case 2: // Infantil
                Grade = 6;
                break;
            case 3: // Juvenil
                Grade = 5;
                break;
            case 4: // Situ esp
                Grade = 3;
                break;
            case 5: // Fester
                Grade = 1;
                break;
            case 6: // Jubilat
                Grade = 2;
                break;
            case 7: // Colaborador
                Grade = 4;
                break;
            case 8: // Baixa
                Grade = 8;
                break;
            case 9: // Situ esp estudis
                Grade = 3;
                break;
            case 10: // Col amb pack
                Grade = 4;
                break;
            case 11: // Jubilat amb pack
                Grade = 2;
                break;
            default:
                Grade = 8;
                break;
        }
        const data = {
            Uid: uuid,
            Email: row['eMail'],
            NIF: row['Dni'],
            WhitesWheelNumber: row['nrRodaBlancos'] ?? 0,
            BlacksWheelNumber: row['nrRodaNegros'] ?? 0,
            Role: 1,
            Grade,
            // TODO: Associate row['AsociadoCon'] ??
            AssociatedTo: 'NULL',
        };
        try {
            await axios.post(v1Request('migration/add_user'), {data: JSON.stringify(data)});
        } catch (e) {
            if (e instanceof AxiosError) {
                const rData = e.response.data;
                const eText = rData.error?.code?.text;
                if (eText != null)
                    errors.push([`Could not add user #${c}. Error:`, eText])
                else
                    errors.push([`Could not add user #${c}. Response:`, rData])
            } else
                errors.push([`Could not add user #${c}. Error:`, e])
        } finally {
            c++;
        }
    }
    usersBar.stop();

    // Log all errors
    for (let e of errors)
        error(...e);
} catch (e) {
    error('Could not fetch data from tbSocios. Error:', e);
    process.exit(1);
}

// Notify the server that the migration has been completed
info('Wrapping up...');
try {
    await axios.post(v1Request('migration/finish'));
} catch (e) {
    error('Could not wrap up. Error:', e);
}

// Finish the connection
info('Disconnecting...');
await sql.close();

infoSuccess('Data migrated successfully.');
