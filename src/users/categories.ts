import {insert} from "../storage/database/query";

/**
 * Creates a new category with the given identifier.
 * @param identifier The text identifier for the category. It's unique.
 * @throws SQLException If there's an error while running the request.
 */
export async function newCategory(identifier: string): Promise<boolean> {
    const count = await insert('Categories', {Identifier: identifier})
    return count > 0;
}
