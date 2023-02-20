import {getCategories, newCategory} from "../../src/users/categories";

export const definition: Command = {
    base: 'category',
    commands: [
        [
            {base: 'list', requiresDatabase: true, parameters: []},
            'Shows a list of all the categories available.',
            async (): Promise<CommandResult> => {
                try {
                    const categories: Category[] = await getCategories();
                    if (categories.length <= 0)
                        return {success: true, message: 'No categories available. Create some with "category create".'}
                    const categoriesString = categories
                        .map((category) => `  ${category.Id} : ${category.Identifier}`)
                        .join('\n');
                    return {success: true, message: `Categories:\n${categoriesString}`};
                } catch (e) {
                    if (e instanceof Error) {
                        console.error(e);
                        return {success: false, message: `Categories fetch error: ${e.message}`};
                    }
                    return {success: false, message: 'Unknown error occurred while getting the categories from the database.'}
                }
            },
        ],
        [
            {base: 'create', requiresDatabase: true, parameters: [['identifier', true]]},
            'Creates a new category in the database.',
            async (...args): Promise<CommandResult> => {
                const [identifier] = args;

                try {
                    if (identifier == null)
                        return {success: false, message: 'The identifier cannot be null.'};

                    const successful = await newCategory(identifier);
                    if (successful)
                        return {success: true, message: `Created new category "${identifier}"`};
                    else
                        return {success: false, message: `Could not create category.`};
                } catch (e) {
                    if (e instanceof Error) {
                        console.error(e);
                        return {success: false, message: `Category creation error: ${e.message}`};
                    }
                    return {success: false, message: 'Unknown error occurred while creating the category.'}
                }
            },
        ],
    ],
};
