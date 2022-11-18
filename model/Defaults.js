/**
 * Creates a SQL query that inserts some data into a table if it doesn't exist.
 * @param {string} table The name of the table to add into.
 * @param {{}} pairs The data to insert. Keys are columns, and the values their respective values.
 * @returns {string} The SQL query.
 */
const insertIfNotExists = (table, pairs) => {
    const keys = Object.keys(pairs);
    const values = Object.values(pairs).map(v => typeof v === 'string' || v instanceof String ? `'${v}'` : v);
    return `INSERT INTO ${table} (${keys.join(', ')})
            SELECT ${values.join(', ')}
            FROM DUAL
            WHERE NOT EXISTS(SELECT * FROM ${table} WHERE ${
                    keys.map((k, i) => k + '=' + values[i]).join(' and ')
            });`
};

export const InsertInfo = [
    // Database version
    insertIfNotExists('mInfo', {Id: 1, Value: '1'}),
];

export const InsertDefaultRoles = [
    insertIfNotExists('mRoles', {Id: 1, DisplayName: 'DEFAULT'}),
    insertIfNotExists('mRoles', {Id: 2, DisplayName: 'ADMIN'}),
];

export const InsertRolesPermissions = [
    insertIfNotExists('mRolesPermissions', {Id: 1, RoleId: 2, PermissionId: 1}),
    insertIfNotExists('mRolesPermissions', {Id: 2, RoleId: 2, PermissionId: 2}),
    insertIfNotExists('mRolesPermissions', {Id: 3, RoleId: 2, PermissionId: 3}),
];

export const InsertPermissions = [
    // See all the tables for events
    insertIfNotExists('mPermissions', {Id: 1, DisplayName: 'tables_see'}),
    // Add new events
    insertIfNotExists('mPermissions', {Id: 2, DisplayName: 'event_add'}),
    // See all the registered people
    insertIfNotExists('mPermissions', {Id: 3, DisplayName: 'people_see'}),
    // Edit events
    insertIfNotExists('mPermissions', {Id: 4, DisplayName: 'event_edit'}),
    // View the current version
    insertIfNotExists('mPermissions', {Id: 5, DisplayName: 'admin/version_view'}),
];

export const InsertGrades = [
    insertIfNotExists('mGrades', {
        Id: 1,
        DisplayName: 'fester',
        ActsRight: 1,
        LockWhitesWheel: 0,
        LockBlacksWheel: 0,
        Votes: 1,
        MinAge: 18
    }),
    insertIfNotExists('mGrades', {
        Id: 2,
        DisplayName: 'jubilat',
        ActsRight: 1,
        LockWhitesWheel: 1,
        LockBlacksWheel: 1,
        Votes: 0,
        MinAge: 18
    }),
    insertIfNotExists('mGrades', {
        Id: 3,
        DisplayName: 'situ_esp',
        ActsRight: 1,
        LockWhitesWheel: 1,
        LockBlacksWheel: 1,
        Votes: 0,
        MinAge: 18
    }),
    insertIfNotExists('mGrades', {
        Id: 4,
        DisplayName: 'colaborador',
        ActsRight: 0,
        LockWhitesWheel: 1,
        LockBlacksWheel: 1,
        Votes: 0,
        MinAge: 18
    }),
    insertIfNotExists('mGrades', {
        Id: 5,
        DisplayName: 'juvenil',
        ActsRight: 1,
        LockWhitesWheel: 1,
        LockBlacksWheel: 1,
        Votes: 0,
        MinAge: 16,
        MaxAge: 18
    }),
    insertIfNotExists('mGrades', {
        Id: 6,
        DisplayName: 'infantil',
        ActsRight: 1,
        LockWhitesWheel: 1,
        LockBlacksWheel: 1,
        Votes: 0,
        MinAge: 10,
        MaxAge: 16
    }),
    insertIfNotExists('mGrades', {
        Id: 7,
        DisplayName: 'alevi',
        ActsRight: 1,
        LockWhitesWheel: 1,
        LockBlacksWheel: 1,
        Votes: 0,
        MinAge: 0,
        MaxAge: 10
    }),
    insertIfNotExists('mGrades', {
        Id: 8,
        DisplayName: 'baixa',
        ActsRight: 0,
        LockWhitesWheel: 1,
        LockBlacksWheel: 1,
        Votes: 0,
        MinAge: 0,
    }),
];

export const InsertPositions = [
    insertIfNotExists('mPositions', {Id: 1, DisplayName: 'primer_tro'}),
    insertIfNotExists('mPositions', {Id: 2, DisplayName: 'darrer_tro'}),
    insertIfNotExists('mPositions', {Id: 3, DisplayName: 'tresorer'}),
    insertIfNotExists('mPositions', {Id: 4, DisplayName: 'secretari'}),
    insertIfNotExists('mPositions', {Id: 5, DisplayName: 'glorier'}),
    insertIfNotExists('mPositions', {Id: 6, DisplayName: 'glorier_inf'}),
    insertIfNotExists('mPositions', {Id: 7, DisplayName: 'dianer'}),
    insertIfNotExists('mPositions', {Id: 8, DisplayName: 'dianer_inf'}),
    insertIfNotExists('mPositions', {Id: 9, DisplayName: 'esquadra'}),
    insertIfNotExists('mPositions', {Id: 10, DisplayName: 'esquadra_esp'}),
];

export const InsertCategories = [
    insertIfNotExists('mCategories', {Id: 1, DisplayName: 'generic', Eat: 0}),
    insertIfNotExists('mCategories', {Id: 2, DisplayName: 'assaig', Eat: 1}),
    insertIfNotExists('mCategories', {Id: 3, DisplayName: 'entradeta', Eat: 0}),
];
