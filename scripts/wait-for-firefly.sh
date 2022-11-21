#!/bin/sh
# wait-for-firefly.sh

set -e

host="$FIREFLY_HOST:$FIREFLY_PORT"

echo "Checking for Firefly installation at $host..."

until curl --output /dev/null --silent --head --fail "http://$host"; do
    echo "Firefly ($host) not available - sleep"
    sleep 5
done

>&2 echo "Firefly is up - executing command"
# Print and execute all other arguments starting with `$1`
# So `exec "$1" "$2" "$3" ...`
exec "$@"
