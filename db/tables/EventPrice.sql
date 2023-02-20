-----------------------------------------------------------------------------------------------------------------
--- Creates a relationship between an event and its price.                                                    ---
-----------------------------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS EventPrice
(
    Id       INTEGER PRIMARY KEY AUTOINCREMENT,
    Event    INTEGER NOT NULL, -- The id of the event that references this price
    Category INTEGER, -- The category associated to this price. Each category may have a different price
    Price    INTEGER NOT NULL, -- The price of the event for the given category in euros
    UNIQUE (Event, Category),
    FOREIGN KEY (Category) REFERENCES Categories (Id),
    FOREIGN KEY (Event) REFERENCES EventList (Id)
);
