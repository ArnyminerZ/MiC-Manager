/**
 * Creates a SQL query that inserts some data into a table if it doesn't exist.
 * @param {string} table The name of the table to add into.
 * @param {{}} pairs The data to insert. Keys are columns, and the values their respective values.
 * @returns {string} The SQL query.
 */
const insertIfNotExists = (table, pairs) => {
    const keys = Object.keys(pairs);
    const values = Object.values(pairs).map(v => typeof v === 'string' || v instanceof String ? `'${v}'` : v);
    return `INSERT INTO FilaMagenta.${table} (${keys.join(', ')})
            SELECT ${values.join(', ')}
            FROM DUAL
            WHERE NOT EXISTS(SELECT * FROM FilaMagenta.${table} WHERE ${
                    keys.map((k, i) => k + '=' + values[i]).join(' and ')
            });`
};

export const InsertDefaultRole = insertIfNotExists('mRoles', {Id: 1, DisplayName: 'DEFAULT'});

export const InsertPermissions = [
    insertIfNotExists('mPermissions', {Id: 1, DisplayName: 'tables_see'}),
    insertIfNotExists('mPermissions', {Id: 2, DisplayName: 'event_add'}),
];
