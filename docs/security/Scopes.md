# Scopes
All the actions in MiC Manager are scoped. This means that they require a specific permission to be run. If the user
doesn't have that scope, they simply can't run that.

The scopes that each user has is included in the `UserScopes` table.

## User scopes
Those all the scopes that are intended to be used by general users.
### `user:usage`
Given to users confirmed by an administrator. Simply allows to use the application.

## Admin scopes
### `admin:monetary:transaction:confirm`
Allows confirming monetary transactions.
