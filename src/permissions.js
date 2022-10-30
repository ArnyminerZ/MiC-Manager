import {query as dbQuery} from './database.js';

/**
 * @typedef {("view-user-data")} Permission
 */

/**
 * Checks if a given user has a given permission.
 * @author Arnau Mora
 * @since 20221025
 * @param {number} userId The id of the user to check for.
 * @param {Permission} permission The permission name to check.
 * @return {Promise<boolean>}
 */
export const hasPermission = async (userId, permission) => {
    const query = await dbQuery(`SELECT mUsers.Role as UserRole, mP.Name as Permission
                                 FROM mUsers
                                          LEFT JOIN mRolesPermissions mRP ON mUsers.Role = mRP.Role
                                          LEFT JOIN mRoles mR ON mRP.Role = mR.Id
                                          LEFT JOIN mPermissions mP on mRP.Permission = mP.Id
                                 WHERE mUsers.Id = ${userId}
                                   AND mR.Name = '${permission}';`);
    return query.rowsAffected[0] > 0;
};
