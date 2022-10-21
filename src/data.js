import {query as dbQuery} from './database.js';
import {UserNotFoundException} from "./exceptions.js";

export const getUserData = async (socioId) => {
    const sql = `SELECT *
                 FROM GesTro.dbo.tbSocios
                 WHERE idSocio = '${socioId}';`;
    const result = await dbQuery(sql);
    if (result.rowsAffected[0] <= 0)
        throw new UserNotFoundException(`Could not find socio#${socioId}.`);
    const row = result.recordset[0];
    return {
        name: row['Nombre'],
        familyName: row['Apellidos'],
        address: row['Direccion'],
        postalCode: row['idCodPostal'],
        dni: row['Dni'],
        born: row['FecNacimiento'],
        workPhone: row['TlfParticular'],
        homePhone: row['TlfTrabajo'],
        mobilePhone: row['TlfMovil'],
        email: row['eMail'],
        wheelNumber: {
            whites: row['nrRodaBlancos'],
            blacks: row['nrRodaNegros'],
        },
        wheelLock: {
            whites: row['bRodaBlancos'],
            blacks: row['bRodaNegros'],
        },
    };
};
