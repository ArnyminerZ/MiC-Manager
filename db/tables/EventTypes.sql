-----------------------------------------------------------------------------------------------------------------
--- Contains all the possible types for events.                                                               ---
-----------------------------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS EventTypes
(
    Id          INTEGER PRIMARY KEY AUTOINCREMENT,
    Type        TEXT NOT NULL, -- The identifier of the type
    Description TEXT NOT NULL, -- A short explanation of the type
    UNIQUE (Id, Type)
);

INSERT OR IGNORE INTO EventTypes(Id, Type, Description) VALUES (1, 'generic', 'The default event type. Works for any event that does not fit the other categories.');
INSERT OR IGNORE INTO EventTypes(Id, Type, Description) VALUES (2, 'eat', 'An event that aims to eat of some kind in group.');
INSERT OR IGNORE INTO EventTypes(Id, Type, Description) VALUES (3, 'parade', 'An event that takes place in public.');
