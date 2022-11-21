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
 * @property {Date|null} Registration
 * @property {PersonData} vCard
 */

/**
 * @typedef {Object} UserRow
 * @property {number} Id
 * @property {string} NIF
 * @property {string} Email
 * @property {string,null} Hash
 * @property {string} Uid
 * @property {number} Role
 * @property {number} Grade
 * @property {number} WhitesWheelNumber
 * @property {number} BlacksWheelNumber
 * @property {number,null} AssociatedTo
 */

import {SqlError} from "mariadb";
import {escape, query as dbQuery} from '../request/database.js';
import {UserNotFoundException} from "../exceptions.js";
import {getCard} from "../request/caldav.js";
import dateFormat from "dateformat";
import {error, log} from "../../cli/logger.js";
import {newUser as newFireflyUser} from "../monetary/firefly.js";

/**
 * Fetches the `UserData` of the user with the given constraints.
 * @author Arnau Mora
 * @since 20221110
 * @param {string} where The where constraint of the SQL query.
 * @throws {SqlError}
 * @throws {UserNotFoundException} If the given constraints do not match any user.
 * @return {Promise<UserData>}
 */
const findUserWithQuery = async (where) => {
    const sql = `
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
        WHERE ${where};`;
    const rows = await dbQuery(sql, true);
    if (rows.length <= 0) throw new UserNotFoundException('Could not find user that matches "' + where + '"');
    // console.log('rows:', rows);
    const data = rows[0];
    const userId = data['Id'];
    const card = getCard(data['Uid']);
    const permissions = rows.map(r => r['PermDisplayName']).filter(v => v != null);
    const registration = await getUserRegistration(userId);
    return {
        Id: userId,
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
        Registration: dateFormat(registration, 'yyyy-MM-dd'),
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
        return await findUserWithQuery(`mUsers.NIF = ${escape(nif)}`);
    } catch (e) {
        error('Could not find user with nif =', nif, 'Error:', e);
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
        return await findUserWithQuery(`mUsers.Id = ${escape(userId)}`)
    } catch (e) {
        return null
    }
};

/**
 * Creates a new user in the database.
 * @author Arnau Mora
 * @since 20221110
 * @param {UserRow} data
 * @return {Promise<[]>}
 */
export const newUser = async (data) => {
    log(`Creating a new user (${data.Email})...`);
    await newFireflyUser(data.Email);
    return await dbQuery(
        `INSERT INTO mUsers (Hash, NIF, Email, Uid, Role, Grade, WhitesWheel, BlacksWheel, Associated)
         VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?);`,
        true,
        data.NIF,
        data.Email,
        data.Uid,
        data.Role,
        data.Grade,
        data.WhitesWheelNumber,
        data.BlacksWheelNumber,
        data.AssociatedTo,
    );
};

/**
 * Fetches at which moment the user got signed up.
 * @author Arnau Mora
 * @since 20221110
 * @param {number} userId
 * @return {Promise<Date|null>}
 */
const getUserRegistration = async (userId) => {
    const lastRegistrationQuery = await dbQuery(`SELECT Timestamp
                                                 FROM mUserRegistrations
                                                 WHERE UserId = ?
                                                   and \`Left\` = 0
                                                 ORDER BY Timestamp
                                                 LIMIT 1;`, true, userId);
    if (lastRegistrationQuery.length <= 0)
        return null;
    const lastRegistration = lastRegistrationQuery[0].Timestamp;
    return new Date(lastRegistration);
}

/**
 * Checks that a user exists.
 * @author Arnau Mora
 * @since 20221110
 * @param {number} userId The id the user.
 * @return {Promise<boolean>}
 */
export const exists = async (userId) => (await dbQuery(`SELECT Id
                                                        FROM mUsers
                                                        WHERE Id = ?`, true, userId)).length > 0;
