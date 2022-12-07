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
 * @property {string} Email
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
import {FireflyApiException, UserNotFoundException} from "../exceptions.js";
import {getCard} from "../request/caldav.js";
import dateFormat from "dateformat";
import {error, log} from "../../cli/logger.js";
import {newUser as newFireflyUser} from "../monetary/firefly.js";

/**
 * Fetches all the users that match the given conditions.
 * @author Arnau Mora
 * @since 20221121
 * @param {string} where The where constraint of the SQL query.
 * @throws {SqlError}
 * @throws {UserNotFoundException} If the given constraints do not match any user.
 * @return {Promise<UserData[]>}
 */
const findUsersWhere = async where => {
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
    let users = [];
    for (let data of rows) {
        const userId = data['Id'];

        if (users.find(u => u.Id === userId) != null) continue;

        const card = getCard(data['Uid']);
        const permissions = rows.filter(u => u['Id'] === userId).map(r => r['PermDisplayName']).filter(v => v != null);
        const registration = await getUserRegistration(userId);

        users.push({
            Id: userId,
            Hash: data['Hash'],
            Uid: data['Uid'],
            Email: data['Email'],
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
        });
    }
    return users;
};

/**
 * Fetches the `UserData` of the user with the given constraints.
 * @author Arnau Mora
 * @since 20221110
 * @param {string} where The where constraint of the SQL query.
 * @throws {SqlError}
 * @throws {UserNotFoundException} If the given constraints do not match any user.
 * @return {Promise<UserData>}
 */
const findUserWithQuery = async where => (await findUsersWhere(where))[0];

/**
 * Gets a list of all the users.
 * @author Arnau Mora
 * @since 20221121
 * @throws {SqlError}
 * @throws {UserNotFoundException} If the given constraints do not match any user.
 * @return {Promise<UserData[]>}
 */
export const getAllUsers = async () => findUsersWhere('1');

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
    let fireflyUser;
    try {
        fireflyUser = await newFireflyUser(data.Email, data.NIF);
    } catch (e) {
        throw new FireflyApiException('Could not create a new Firefly user. Error:' + JSON.stringify(e));
    }
    return await dbQuery(
        `INSERT INTO mUsers (Hash, NIF, Email, Uid, FireflyUid, Role, Grade, WhitesWheel, BlacksWheel, Associated)
         VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        true,
        data.NIF,
        data.Email,
        data.Uid,
        parseInt(fireflyUser.id),
        data.Role,
        data.Grade,
        data.WhitesWheelNumber ?? data['WhitesWheel'],
        data.BlacksWheelNumber ?? data['BlacksWheel'],
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

/**
 * Gets the given grade's ID from its display name.
 * @author Arnau Mora
 * @since 20221121
 * @param {string} grade The display name of the grade.
 * @return {Promise<number|null>}
 */
export const getGradeId = async grade => {
    const grades = await dbQuery(`SELECT Id
                                  FROM mGrades
                                  WHERE DisplayName = ?`, grade);
    if (grades.length <= 0) return null;
    return grades[0].Id;
};

/**
 * Gets the given role's ID from its display name.
 * @author Arnau Mora
 * @since 20221121
 * @param {string} role The display name of the role.
 * @return {Promise<number|null>}
 */
export const getRoleId = async role => {
    const roles = await dbQuery(`SELECT Id
                                 FROM mRoles
                                 WHERE DisplayName = ?`, role);
    if (roles.length <= 0) return null;
    return roles[0].Id;
};
