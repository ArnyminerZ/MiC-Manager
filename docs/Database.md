# Database
Hereby all the information related to the structure of the database.

## Table of Contents
* [Information](#information--minfo-)

# Information (`mInfo`)
This table has two columns, one for ID, and the other one for the value. Each id is associated with an information key,
this is, that each key stores one information parameter. Equivalences are:

| ID  | Description                                                            |
|-----|------------------------------------------------------------------------|
| `1` | The version of the database. Used for making migrations.               |
| `2` | Whether new user registration is enabled. `1` for true, `0` for false. |
