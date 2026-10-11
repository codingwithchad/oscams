#!/usr/bin/env bash
# Deploy to Azure App Service, and roll back.
#
#   scripts/deploy-azure.sh               build this commit, deploy it, wait until /healthz reports it
#   scripts/deploy-azure.sh --list        the saved packages you can roll back to
#   scripts/deploy-azure.sh --rollback ID redeploy a saved package (ID = commit, e.g. 110b0e3)
#
# Needs: az signed in (az login), a clean git tree (so the version is a real commit). Never handles secrets:
# keys live in the app's settings, not in the package.
set -euo pipefail

GROUP=${AZURE_GROUP:-cwc-whatsupahead}
APP=${AZURE_APP:-whatsupahead}
URL=${AZURE_URL:-https://whatsupahead.azurewebsites.net}
KEEP=5
SAVED=${DEPLOY_PACKAGES:-$HOME/.cache/whatsupahead-deploys}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
# The subscription is named explicitly (never az's cached default), from AZURE_SUBSCRIPTION or .env.
SUBSCRIPTION=${AZURE_SUBSCRIPTION:-$(grep -E '^AZURE_SUBSCRIPTION=' "$ROOT/.env" 2>/dev/null | cut -d= -f2- || true)}
[ -n "$SUBSCRIPTION" ] || {
	echo "set AZURE_SUBSCRIPTION (in .env or the environment)" >&2
	exit 1
}
mkdir -p "$SAVED"

deploy() { # zip, commit
	echo "deploying $2 to $APP..."
	az webapp deploy --subscription "$SUBSCRIPTION" -g "$GROUP" -n "$APP" \
		--src-path "$1" --type zip --async true -o none --only-show-errors
	# A finished upload is not a running app: wait for the new build to answer with its own version.
	for _ in $(seq 1 60); do
		running=$(curl -s -m 10 "$URL/healthz" | node -e \
			'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).version?.commit??"")}catch{console.log("")}})')
		if [ "$running" = "$2" ]; then
			echo "live: $URL is running $2"
			return 0
		fi
		sleep 5
	done
	echo "the upload finished, but after 5 minutes $URL still reports '${running:-nothing}', not $2" >&2
	echo "check: az webapp log tail --subscription $SUBSCRIPTION -g $GROUP -n $APP" >&2
	return 1
}

case "${1:-}" in
--list)
	ls -1t "$SAVED" | sed 's/\.zip$//'
	exit 0
	;;
--rollback)
	id=${2:?usage: --rollback COMMIT (see --list)}
	[ -f "$SAVED/$id.zip" ] || {
		echo "no saved package $id; saved: $(ls -1t "$SAVED" | sed 's/\.zip$//' | tr '\n' ' ')" >&2
		exit 1
	}
	deploy "$SAVED/$id.zip" "$id"
	exit 0
	;;
"") ;;
*)
	sed -n 2,9p "$0"
	exit 1
	;;
esac

cd "$ROOT"
if [ -n "$(git status --porcelain)" ]; then
	echo "commit or stash your changes first, so the deployed version is a real commit" >&2
	exit 1
fi
commit=$(git rev-parse --short HEAD)

npm run build >/dev/null
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
# The server needs only the build, the data files and the production packages (built here, on Linux, so the
# picture-resizing library matches the server).
cp -r build data package.json package-lock.json "$work/"
(cd "$work" && npm ci --omit=dev --ignore-scripts --no-audit --no-fund >/dev/null && npm rebuild sharp >/dev/null)
(cd "$work" && zip -qr "$SAVED/$commit.zip" .)

# Keep the newest few packages for rollback.
ls -1t "$SAVED"/*.zip | tail -n +$((KEEP + 1)) | xargs -r rm --

deploy "$SAVED/$commit.zip" "$commit"
