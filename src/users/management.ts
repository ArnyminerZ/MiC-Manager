import {query} from "../storage/database/query";
import {hash} from "../security/cryptography";

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
 * Creates a new user in the `Users` table.
 * @param password The password to give to the user.
 * @param name The name of the user.
 * @param surname The surname of the user.
 * @param nif The NIF of the user. Unique, and used for identification.
 * @param email The contact email of the user.
 * @param information Some extra information for the user.
 */
export async function create(password: string, name: string, surname: string, nif: string, email: string, information: Object) {
    const passwordHash = hash(Buffer.from(password));
    await query("INSERT INTO Users (Hash, Name, Surname, NIF, Email, Information) VALUES (?, ?, ?, ?, ?, ?)", passwordHash, name, surname, nif, email, JSON.stringify(information));
}
