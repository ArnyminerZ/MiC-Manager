/**
 * @typedef {Object} RoleData
 * @property {string} DisplayName
 * @property {string[]} Permissions
 */

/**
 * @typedef {Object} GradeData
 * @property {string} DisplayName
 * @property {boolean} ActsRight
 * @property {boolean} LockWhitesWheel
 * @property {boolean} LockBlacksWheel
 * @property {boolean} Votes
 * @property {boolean} MinAge
 * @property {boolean|null} MaxAge
 */

/**
 * @typedef {Object} UserData
 * @property {number} Id
 * @property {string} Hash
 * @property {string} Uid
 * @property {string} NIF
 * @property {RoleData} Role
 * @property {GradeData} Grade
 * @property {number} WhitesWheelNumber
 * @property {number} BlacksWheelNumber
 * @property {number} AssociatedTo
 * @property {Object} vCard
 */

/**
 * @typedef {Object} UserRow
 * @property {number} Id
 * @property {string,null} Hash
 * @property {string} Uid
 * @property {number} Role
 * @property {number} Grade
 * @property {number} WhitesWheel
 * @property {number} BlacksWheel
 * @property {number,null} Associated
 * @property {string} NIF
 */

import {query as dbQuery} from '../request/database.js';
import {UserNotFoundException} from "../exceptions.js";
import {getCard} from "../request/caldav.js";

const findUserWithQuery = async (where) => {
    const rows = await dbQuery(`
        SELECT mUsers.*,
               mR.DisplayName as RoleDisplayName,
               m.DisplayName  as PermDisplayName,
               mG.DisplayName as GradeDisplayName,
               mG.ActsRight,
               mG.LockBlacksWheel,
               mG.LockWhitesWheel,
               mG.MinAge,
               mG.MaxAge,
               mG.Votes
        FROM mUsers
                 LEFT JOIN mRoles mR ON mUsers.Role = mR.Id
                 LEFT JOIN mRolesPermissions mP ON mR.Id = mP.RoleId
                 LEFT JOIN mGrades mG on mUsers.Grade = mG.Id
                 LEFT JOIN mPermissions m on mP.PermissionId = m.Id
        WHERE ${where};`);
    if (rows.length <= 0) throw new UserNotFoundException('Could not find user that matches "' + where + '"');
    // console.log('rows:', rows);
    const data = rows[0];
    const card = getCard(data['Uid'])
    const permissions = rows.map(r => r['PermDisplayName']).filter(v => v != null);
    return {
        Id: data['Id'],
        Hash: data['Hash'],
        Uid: data['Uid'],
        NIF: data['NIF'],
        Role: {
            DisplayName: data['RoleDisplayName'],
            Permissions: permissions,
        },
        Grade: {
            DisplayName: data['GradeDisplayName'],
            ActsRight: data['ActsRight'],
            LockBlacksWheel: data['LockBlacksWheel'],
            LockWhitesWheel: data['LockWhitesWheel'],
            MinAge: data['MinAge'],
            MaxAge: data['MaxAge'],
            Votes: data['Votes'],
        },
        WhitesWheelNumber: data['WhitesWheel'],
        BlacksWheelNumber: data['BlacksWheel'],
        AssociatedTo: data['Associated'],
        vCard: card,
    };
};

/**
 * Searches for the data of a user with the given DNI.
 * @author Arnau Mora
 * @since 20221104
 * @param {string} nif
 * @return {Promise<UserData|null>}
 */
export const findUserWithNif = async nif => {
    try {
        return await findUserWithQuery(`NIF = '${nif}'`);
    } catch (e) {
        return null
    }
};

/**
 * Fetches the data of a given user.
 * @author Arnau Mora
 * @since 20221024
 * @param {number} userId The id of the user.
 * @return {Promise<UserData|null>}
 */
export const getUserData = async (userId) => {
    try {
        return await findUserWithQuery(`mUsers.Id = '${userId}'`)
    } catch (e) {
        return null
    }
};

/**
 * Creates a new user in the database.
 * @param {UserRow} data
 * @return {Promise<[]>}
 */
export const newUser = async (data) => await dbQuery(
    `INSERT INTO mUsers (Hash, Uid, Role, Grade, WhitesWheel, BlacksWheel, Associated, NIF)
     VALUES (NULL, '${data.Uid}', ${data.Role}, ${data.Grade},
             ${data.WhitesWheel}, ${data.BlacksWheel},
             ${data.Associated}, '${data.NIF}');`
);
