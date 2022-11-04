# Fila Magenta Backend

[![Building][build-badge]][build-url]

[![Docker Hub Version][docker-badge-url]][docker-hub-url]

![package.json version][package-version-badge]
![Last pre-release][prerelease-badge]
![Last release][release-badge]

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

---

[docker-badge-url]: https://img.shields.io/docker/v/arnyminerz/mic_manager?style=for-the-badge&logo=docker

[docker-hub-url]: https://hub.docker.com/repository/docker/arnyminerz/mic_manager

[package-version-badge]: https://img.shields.io/github/package-json/v/ArnyminerZ/MiC-Manager?label=Dev%20Version&logo=github&style=for-the-badge

[prerelease-badge]: https://img.shields.io/github/v/release/ArnyminerZ/MiC-Manager?include_prereleases&label=Last%20Pre-Release&logo=github&style=for-the-badge

[release-badge]: https://img.shields.io/github/v/release/ArnyminerZ/MiC-Manager?label=Last%20Release&logo=github&style=for-the-badge

[releases-url]: https://github.com/ArnyminerZ/MiC-Manager/releases

[build-badge]: https://img.shields.io/github/workflow/status/ArnyminerZ/MiC-Manager/docker-ci?style=for-the-badge

[build-url]: https://github.com/ArnyminerZ/MiC-Manager/actions/workflows/docker-ci.yml
