#!/usr/bin/env bash
# Set an API key in the Azure app's settings without the value ever appearing in a command line, log or screen.
#
#   scripts/azure-set-key.sh WINDY_API_KEY     take the value from .env
#   scripts/azure-set-key.sh WINDY_API_KEY -   type or paste it (hidden)
#
# Changing a setting restarts the app.
set -euo pipefail

GROUP=${AZURE_GROUP:-cwc-whatsupahead}
APP=${AZURE_APP:-whatsupahead}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
# The subscription is named explicitly (never az's cached default), from AZURE_SUBSCRIPTION or .env.
SUBSCRIPTION=${AZURE_SUBSCRIPTION:-$(grep -E '^AZURE_SUBSCRIPTION=' "$ROOT/.env" 2>/dev/null | cut -d= -f2- || true)}
[ -n "$SUBSCRIPTION" ] || {
	echo "set AZURE_SUBSCRIPTION (in .env or the environment)" >&2
	exit 1
}

name=${1:?usage: azure-set-key.sh NAME [-]}
[[ $name =~ ^[A-Z][A-Z0-9_]*$ ]] || {
	echo "NAME should look like WINDY_API_KEY" >&2
	exit 1
}

if [ "${2:-}" = "-" ]; then
	read -rsp "value for $name (hidden): " value
	echo
else
	value=$(grep -E "^$name=" "$ROOT/.env" | tail -1 | cut -d= -f2-) || true
fi
[ -n "${value:-}" ] || {
	echo "no value for $name" >&2
	exit 1
}

# The value goes through a private temporary file, read by az, then deleted.
umask 077
file=$(mktemp)
trap 'rm -f "$file"' EXIT
NAME="$name" VALUE="$value" node -e \
	'process.stdout.write(JSON.stringify({[process.env.NAME]: process.env.VALUE}))' >"$file"
unset value

az webapp config appsettings set --subscription "$SUBSCRIPTION" -g "$GROUP" -n "$APP" \
	--settings "@$file" -o none --only-show-errors
echo "set $name on $APP (the app restarts)"
