-----------------------------------------------------------------------------------------------------------------
--- Contains all the menus stored for events. May be reused.                                                  ---
-----------------------------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS EventMenu
(
    Id          INTEGER PRIMARY KEY AUTOINCREMENT,
    DisplayName TEXT    NOT NULL,  -- The name that identifies the event
    DateTime    INTEGER NOT NULL,  -- The moment at which the event takes place
    Description TEXT DEFAULT NULL, -- An extended description of the event, supports Markdown
    Location    TEXT    NOT NULL,  -- Where the event takes place
    Type INTEGER NOT NULL DEFAULT 1, -- The type of event
    UNIQUE (Id),
    FOREIGN KEY (Type) REFERENCES EventTypes(Id)
);
