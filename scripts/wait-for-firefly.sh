#!/bin/sh
# wait-for-firefly.sh

set -e

host="$FIREFLY_HOST:$FIREFLY_PORT"

token_file="$FIREFLY_TOKEN_FILE"
token=$(cat "$token_file")

echo "Checking for Firefly installation at $host..."

until curl --output /dev/null -H "Authorization: Bearer $token" --silent --head --fail "http://$host/api/v1/about"; do
    echo "Firefly not available - sleep"
    sleep 5
done

>&2 echo "Firefly is up - executing command"
# Print and execute all other arguments starting with `$1`
# So `exec "$1" "$2" "$3" ...`
exec "$@"
