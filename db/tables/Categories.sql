-----------------------------------------------------------------------------------------------------------------
--- Stores all the categories users may belong to.                                                            ---
-----------------------------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Categories
(
    Id         INTEGER PRIMARY KEY AUTOINCREMENT,
    Identifier TEXT NOT NULL, -- A text identifier for the category
    UNIQUE (Id, Identifier)
);
