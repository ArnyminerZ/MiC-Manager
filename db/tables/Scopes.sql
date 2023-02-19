-----------------------------------------------------------------------------------------------------------------
--- Stores all the scopes available internally for the server to check them. Has the "Description" column for ---
--- reference if at any moment the coverage of the scope is forgotten.                                        ---
-----------------------------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Scopes (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Scope TEXT NOT NULL,                    -- The id of the scope
    Description TEXT NOT NULL,              -- An explanation of the scope
    UNIQUE(Id, Scope)
);

INSERT OR IGNORE INTO Scopes(Id, Scope, Description) VALUES (1, 'user:usage', 'Allows the user to use the application. Given to all the confirmed users.');
INSERT OR IGNORE INTO Scopes(Id, Scope, Description) VALUES (2, 'admin:monetary:transaction:confirm', 'Allows the user to confirm transactions.');
INSERT OR IGNORE INTO Scopes(Id, Scope, Description) VALUES (3, 'admin:categories:create', 'Allows the user to create new categories.');
INSERT OR IGNORE INTO Scopes(Id, Scope, Description) VALUES (4, 'admin:categories:delete', 'Allows the user to delete existing categories.');
INSERT OR IGNORE INTO Scopes(Id, Scope, Description) VALUES (5, 'admin:user:category', 'Allows the user to move users between categories.');
