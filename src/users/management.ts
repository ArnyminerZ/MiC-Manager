import {insert, query} from "../storage/database/query";
import {hash} from "../security/cryptography";
import {hash as verifyRow} from '../security/verifiers';
import {scopesIds} from '../../db/types/Scopes';
import {CategoryNotFoundError} from "./errors";

/**
 * Checks if a user with the given NIF exists.
 * @param nif The NIF to search for.
 * @return Whether the user exists.
 */
export async function exists(nif: string): Promise<boolean> {
    const u: User[] = await query('SELECT * FROM Users;');
    if (u.length <= 0) return false;
    return u.find(value => nif === value.NIF) != null;
}

/**
 * Tries searching for a user with the given NIF.
 * @param nif The NIF of the user to search for.
 */
export async function findByNif(nif: string): Promise<User | null> {
    /** @type {User[]} */
    const users = await query('SELECT * FROM Users WHERE NIF=? LIMIT 1;', nif);
    if (users.length <= 0) return null;
    return users[0];
}

/**
 * Tries searching for a user with the given ID.
 * @param id The ID of the user to search for.
 */
export async function findById(id: number): Promise<User | null> {
    /** @type {User[]} */
    const users = await query('SELECT * FROM Users WHERE Id=? LIMIT 1;', id);
    if (users.length <= 0) return null;
    return users[0];
}

/**
 * Checks if the user with the given id has the indicated scope.
 * @param id The ID of the user to check for.
 * @param scope The scope to look for.
 */
export async function hasScope(id: number, scope: string): Promise<boolean> {
    const rows = await query('SELECT * FROM UserScopes WHERE UserId=? AND ScopeId=(SELECT Id FROM Scopes WHERE Scope=?);', id, scope);
    return rows.length > 0;
}

/**
 * Verifies the user with the given NIF by adding the user:usage scope.
 * @param nif The NIF of the user to verify.
 */
export async function verify(nif: string): Promise<boolean> {
    const user = await findByNif(nif);
    if (user == null) return false;

    const sql = {UserId: user.Id, ScopeId: scopesIds.user.usage};
    const updatedRows = await insert('UserScopes', verifyRow(sql));
    return updatedRows > 0;
}

/**
 * Creates a new user in the `Users` table.
 * @param password The password to give to the user.
 * @param name The name of the user.
 * @param surname The surname of the user.
 * @param nif The NIF of the user. Unique, and used for identification.
 * @param email The contact email of the user.
 * @param information Some extra information for the user.
 */
export async function create(password: string, name: string, surname: string, nif: string, email: string, information: Object): Promise<number> {
    const passwordHash = hash(Buffer.from(password));
    return await insert('Users', {Hash: passwordHash, Name: name, Surname: surname, NIF: nif, Email: email, Information: JSON.stringify(information)})
}

/**
 * Moves the given user to the target category.
 * @param userId The id of the user to move.
 * @param categoryIdentifier The identifier of the target category.
 * @throws {CategoryNotFoundError} If the given category doesn't exist.
 * @throws {Error} If the request could not be performed.
 * @return A promise that tells if the movement was performed successfully.
 */
export async function setCategory(userId: number, categoryIdentifier: string): Promise<boolean> {
    const movements = await query('SELECT * FROM UserHistory WHERE UserId=?', userId) as UserHistory[];
    const userCategory = movements.length > 0 ? movements[movements.length - 1] : null;

    const newCategories = await query('SELECT Id FROM Categories WHERE Identifier=? LIMIT 1;', categoryIdentifier) as {Id: number}[];
    if (newCategories.length <= 0) throw new CategoryNotFoundError(categoryIdentifier);
    const newCategory = newCategories[0];

    const movement: UserHistoryProto = {
        UserId: userId,
        FromCategory: userCategory?.Id,
        ToCategory: newCategory.Id,
        Timestamp: new Date().getDate(),
    };
    const verifiedRow = verifyRow(movement);
    const result = await insert('Categories', verifiedRow);
    return result > 0;
}
