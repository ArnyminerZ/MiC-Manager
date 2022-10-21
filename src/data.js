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

/**
 * Gets a list of all the available events.
 * @author Arnau Mora
 * @since 20221021
 * @return {Promise<[{id:number,displayName:string,date:string,menu:Object?,contact:string?,description:string?,category:number}]>}
 */
export const getEvents = async () => {
    const sql = `SELECT *
                 FROM GesTro.dbo.mEvents;`;
    const result = await dbQuery(sql);
    let builder = [];
    const size = result.rowsAffected[0];
    for (let c = 0; c < size; c++) {
        const row = result.recordset[c];
        builder.push({
            id: row['id'],
            displayName: row['DisplayName'],
            date: row['Date'],
            menu: row['Menu'],
            contact: row['Contact'],
            description: row['Description'],
            category: row['Category'],
        })
    }
    return builder;
}
