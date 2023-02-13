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

INSERT OR IGNORE INTO Scopes(Scope, Description) VALUES ('user:usage', 'Allows the user to use the application. Given to all the confirmed users.');
INSERT OR IGNORE INTO Scopes(Scope, Description) VALUES ('admin:monetary:transaction:confirm', 'Allows the user to confirm transactions.');
