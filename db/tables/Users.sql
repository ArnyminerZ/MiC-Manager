CREATE TABLE IF NOT EXISTS Users (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Hash TEXT,
    Name TEXT,
    Surname TEXT,
    NIF TEXT UNIQUE,
    Email TEXT,
    Information TEXT
);
