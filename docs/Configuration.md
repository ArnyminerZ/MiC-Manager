# Configuration
Here are all the configuration parameters available. Everything is configured through the [micmanager.conf](/micmanager.conf) file.

## `LOG_LEVEL`
**Type:** `ENUM`<br/>
**Default:** `warn`<br/>
**Accepts:** `debug`, `info`, `warn`, `error`

The log level to use for logging messages.

## `LOG_FILE`
**Type:** `STRING`<br/>
**Default:** `mic_manager.log`

Where to store the messages logged. Can be commented to disable logging to a file. Path relative to project's base dir.
