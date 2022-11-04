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
 */

import dateFormat from 'dateformat';

import {query as dbQuery} from '../request/database.js';
import {UserNotFoundException} from "../exceptions.js";

/**
 * Returns the given string as a formatted date following yyyy-MM-dd.
 * @author Arnau Mora
 * @since 20221021
 * @param {string} date The date to parse.
 * @return {string}
 */
const formatDayDate = (date) => dateFormat(new Date(date), 'yyyy-MM-dd');

export const findUserWithQuery = async (where) => {
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
    };
};

/**
 * Searches for the data of a user with the given DNI.
 * @author Arnau Mora
 * @since 20221104
 * @param {string} nif
 * @return {Promise<UserData|null>}
 */
export const findUserWithNif = async nif => findUserWithQuery(`NIF = '${nif}'`);

/**
 * Fetches the data of a given user.
 * @author Arnau Mora
 * @since 20221024
 * @param {number} userId The id of the user.
 * @return {Promise<UserData|null>}
 */
export const getUserData = async (userId) => findUserWithQuery(`mUsers.Id = '${userId}'`);
