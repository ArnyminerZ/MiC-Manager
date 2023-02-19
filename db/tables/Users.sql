CREATE TABLE IF NOT EXISTS Users
(
    Id          INTEGER PRIMARY KEY AUTOINCREMENT,
    Disabled    INTEGER DEFAULT 0, -- If the user is disabled or not (0 for false, 1 for true). Disabled users can't log in
    Hash        TEXT,              -- The hash generated for the user's password
    Name        TEXT,              -- The name of the user
    Surname     TEXT,              -- The user's family name
    NIF         TEXT UNIQUE,       -- The user's NIF, it's used for logging in, and it's unique
    Email       TEXT,              -- The email associated to the user
    Information TEXT,              -- Some extra information for the user. In JSON format
    UNIQUE (NIF, Email)
);
