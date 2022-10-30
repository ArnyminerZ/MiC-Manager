# Fila Magenta Backend

## Generating private file

```shell
openssl rand -base64 756 > private.key
```

## Environment variables

There are some environment variables which are required for the server to work. Those are:

### `DB_USERNAME`

**Required**. The username to use for connecting to the database.

### `DB_PASSWORD`

**Required**. The password for the given username.

### `DB_HOSTNAME`

**Required**. The server address for the database.

### `DB_DATABASE`

**Required**. The name of the database to use. `DB_USERNAME` must be granted to modify and access it.

### `DEBUG`

Default: `false`. If `true`, debug mode will be enabled, and errors will give a deeper output.
