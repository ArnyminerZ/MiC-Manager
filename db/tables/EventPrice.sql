-----------------------------------------------------------------------------------------------------------------
--- Creates a relationship between an event and its price.                                                    ---
-----------------------------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS EventPrice
(
    Id       INTEGER PRIMARY KEY AUTOINCREMENT,
    Event    INTEGER NOT NULL, -- The id of the event that references this price
    Category INTEGER NOT NULL, -- The category associated to this price. Each category may have a different price
    UNIQUE (Id),
    FOREIGN KEY (Category) REFERENCES Categories (Id)
);
