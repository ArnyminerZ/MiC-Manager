#!/bin/sh
# wait-for-radicale.sh

set -e

host="$CALDAV_HOSTNAME:$CALDAV_PORT"

echo "Checking for Radicale installation at $host..."

until curl --output /dev/null --silent --head --fail "http://$host"; do
    echo "Radicale ($host) not available - sleep"
    sleep 5
done

>&2 echo "Radicale is up - executing command"
# Print and execute all other arguments starting with `$1`
# So `exec "$1" "$2" "$3" ...`
exec "$@"
