# Fila Magenta Backend

[![Building][build-badge]][build-url]

[![Docker Hub Version][docker-badge-url]][docker-hub-url]

![package.json version][package-version-badge]
![Last pre-release][prerelease-badge]
![Last release][release-badge]

## Generating private file

```shell
openssl rand -base64 756 > ./secrets/private.key
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

### `CALDAV_HOSTNAME`

**Required**. The server address for the CalDAV server.

### `CALDAV_USERNAME`

**Required**. The username to use for signing in to the CalDAV server.

### `CALDAV_PASSWORD`

**Required**. The password to use with `CALDAV_USERNAME`.

### `CALDAV_AB_URL`

**Required**. The url of the address book to use.

### `DEBUG`

Default: `false`. If `true`, debug mode will be enabled, and errors will give a deeper output.

# User information

By default, MiC Manager doesn't support storing any users' information. For this, a WebDAV server must be used.
We recommend [Radicale](https://radicale.org).

# Docker configuration

We provide you a docker compose file ([`docker-compose.yml`](./docker-compose.yml)) that is almost ready to go, with all
the necessary containers configured. However, there are some extra options you must set.

Just as a note, the Radicale users match the server's registered users. You might want to create a specific user for
this purpose.

## Secrets

We need some secret keys and files for the system to work. You can define them with the following commands.

```shell
# Create the secrets directory
mkdir -p secrets

# Replace {password} with the password to use for the database user.
echo "{password}" > secrets/password.txt

# Replace {password} with the password to use for identifying as {username}. Choose wisely.
echo "{root-password}" > secrets/root-password.txt
```

Note that it's required to have swarm mode enabled. You can do so with:

```shell
docker swarm init
```

## Setting `CALDAV_AB_URL`

To know which url to set. First access the web interface for Radicale. Eg: http://localhost:5232/.web/.

Then, log in, and choose one of the options provided, either creating an empty address book, or import an existing one.
![Creation options](./docs/RadicaleCreation.png)

---

[docker-badge-url]: https://img.shields.io/docker/v/arnyminerz/mic_manager?style=for-the-badge&logo=docker

[docker-hub-url]: https://hub.docker.com/repository/docker/arnyminerz/mic_manager

[package-version-badge]: https://img.shields.io/github/package-json/v/ArnyminerZ/MiC-Manager?label=Dev%20Version&logo=github&style=for-the-badge

[prerelease-badge]: https://img.shields.io/github/v/release/ArnyminerZ/MiC-Manager?include_prereleases&label=Last%20Pre-Release&logo=github&style=for-the-badge

[release-badge]: https://img.shields.io/github/v/release/ArnyminerZ/MiC-Manager?label=Last%20Release&logo=github&style=for-the-badge

[releases-url]: https://github.com/ArnyminerZ/MiC-Manager/releases

[build-badge]: https://img.shields.io/github/workflow/status/ArnyminerZ/MiC-Manager/docker-ci?style=for-the-badge

[build-url]: https://github.com/ArnyminerZ/MiC-Manager/actions/workflows/docker-ci.yml
