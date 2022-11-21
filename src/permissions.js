import {query as dbQuery} from './request/database.js';

/**
 * @typedef {("tables_see","event_add","event_edit","people_see","admin/version_view","admin/create_users")} Permission
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
    const query = await dbQuery(`SELECT mUsers.Role as UserRole, mP.DisplayName as Permission
                                 FROM mUsers
                                          LEFT JOIN mRolesPermissions mRP ON mUsers.Role = mRP.RoleId
                                          LEFT JOIN mRoles mR ON mRP.RoleId = mR.Id
                                          LEFT JOIN mPermissions mP on mRP.PermissionId = mP.Id
                                 WHERE mUsers.Id = ?
                                   AND mP.DisplayName = ?;`, true, userId, permission);
    return query.length > 0;
};
