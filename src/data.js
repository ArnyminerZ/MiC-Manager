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
        name: row['Nombre'].trim(),
        familyName: row['Apellidos'].trim(),
        address: row['Direccion'].trim(),
        postalCode: row['idCodPostal'],
        dni: row['Dni'],
        born: row['FecNacimiento'],
        workPhone: row['TlfParticular'],
        homePhone: row['TlfTrabajo'],
        mobilePhone: row['TlfMovil'],
        email: row['eMail'],
        wheel: {
            whites: (!row['nrRodaBlancos'] || !row['bRodaBlancos']) ? null : {
                number: row['nrRodaBlancos'],
                locked: row['bRodaBlancos'],
            },
            blacks: (!row['nrRodaNegros'] || !row['bRodaNegros']) ? null : {
                number: row['nrRodaNegros'],
                locked: row['bRodaNegros'],
            },
        },
    };
};
