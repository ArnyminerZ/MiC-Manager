# MiC Manager

[![Building][build-badge]][build-url]
[![Test][test-badge]][test-url]
[![CodeQL Analysis][codeql-badge-url]][codeql-url]
[![Documentation][docs-badge-url]][docs-url]

[![Docker Hub Version][docker-badge-url]][docker-hub-url]

![package.json version][package-version-badge]
![Last pre-release][prerelease-badge]
![Last release][release-badge]

# User information

By default, MiC Manager doesn't support storing any users' information. For this, a WebDAV server must be used.
We recommend [Radicale](https://radicale.org).

# Docker configuration

We provide you a docker compose file ([`docker-compose.yml`](./docker-compose.yml)) that is almost ready to go, with all
the necessary containers configured. However, there are some extra options you must set.

Just as a note, the Radicale users match the server's registered users. You might want to create a specific user for
this purpose.

# Getting started
For the first run, access the project's directory, and run the following commands:
```shell
node scripts/generate-files.js
docker-compose up -d firefly
FIREFLY_HOST=localhost FIREFLY_PORT=8080 SCREENSHOTS_DIR=/home/arnyminerz/GitProjects/MiC-Manager/screenshots node scripts/configure-firefly.js
docker-compose up -d
```

# Asset files
There's a folder called `/assets`, this is where all the branding files are stored. There are matching config options
for each file type. Currently, there's no officially supported way of mapping this files in Docker.

When booting, it's checked that all of them are correct and ready. If they are modified, the server needs to restart.

# Migration

## GesTro

MiC Manager provides the option to migrate all the data from GesTro. There's a script at `/migrations` called
`gestro.js` that has all the tools necessary. To run, first install all the dependencies:

```shell
yarn install
```

And now run the script. Replace all the fields accordingly.

```shell
yarn run migrate-gestro HOSTNAME={hostname} PORT=1433 DATABASE=GesTro SCHEMA=dbo USERNAME={username} PASSWORD={password} INSTANCE={mic-instance}
```

*Note: The given MiC instance must contain the protocol (e.g. https://...) and be without a trailing `/`*

# General Information

## Billing cycle

All the payments are cycled every year, starting on the 26th of April. This is the recommended method, but can be
changed using the `BILLING_CYCLE_MONTH` and `BILLING_CYCLE_DAY` environment variables.

---

[codeql-badge-url]: https://img.shields.io/github/workflow/status/ArnyminerZ/MiC-Manager/CodeQL?label=CodeQL&style=for-the-badge&logo=github

[codeql-url]:https://github.com/ArnyminerZ/MiC-Manager/security/code-scanning

[docker-badge-url]: https://img.shields.io/docker/v/arnyminerz/mic_manager?style=for-the-badge&logo=docker

[docker-hub-url]: https://hub.docker.com/repository/docker/arnyminerz/mic_manager

[package-version-badge]: https://img.shields.io/github/package-json/v/ArnyminerZ/MiC-Manager?label=Dev%20Version&logo=github&style=for-the-badge

[prerelease-badge]: https://img.shields.io/github/v/release/ArnyminerZ/MiC-Manager?include_prereleases&label=Last%20Pre-Release&logo=github&style=for-the-badge

[release-badge]: https://img.shields.io/github/v/release/ArnyminerZ/MiC-Manager?label=Last%20Release&logo=github&style=for-the-badge

[releases-url]: https://github.com/ArnyminerZ/MiC-Manager/releases

[build-badge]: https://img.shields.io/github/workflow/status/ArnyminerZ/MiC-Manager/docker-ci?style=for-the-badge

[build-url]: https://github.com/ArnyminerZ/MiC-Manager/actions/workflows/docker-ci.yml

[test-badge]: https://img.shields.io/github/workflow/status/ArnyminerZ/MiC-Manager/Test?style=for-the-badge&label=Test

[test-url]: https://github.com/ArnyminerZ/MiC-Manager/actions/workflows/test.yml

[docs-url]: http://arnaumora.me/MiC-Manager/

[docs-badge-url]: https://img.shields.io/github/workflow/status/Arnyminerz/MiC-Manager/Deploy%20static%20content%20to%20Pages?label=Documentation&style=for-the-badge&logo=swagger
