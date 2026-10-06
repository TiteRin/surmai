#!/usr/bin/env bash
#
# Preview local Surmai changes against a copy of a running instance's data.
#
#   preview-data.sh pull    snapshot the remote instance into backend/pb_preview_data
#   preview-data.sh serve   run the local backend on that copy
#
# The remote database is never opened directly: `pull` goes through PocketBase's
# backup API, which is safe while the instance is running.
#
# Environment:
#   SURMAI_PI_URL        base URL of the instance (default http://192.168.1.100:9090)
#   SURMAI_PI_EMAIL      superuser email (prompted when unset)
#   SURMAI_PI_PASSWORD   superuser password (prompted silently when unset)
#   SURMAI_PREVIEW_PORT  port for `serve` (default 9090, matches the Vite dev proxy)

set -euo pipefail

PI_URL="${SURMAI_PI_URL:-http://192.168.1.100:9090}"
PI_URL="${PI_URL%/}"
PORT="${SURMAI_PREVIEW_PORT:-9090}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$REPO_ROOT/backend/pb_preview_data"

die() {
  echo "error: $*" >&2
  exit 1
}

require_tools() {
  for tool in "$@"; do
    command -v "$tool" >/dev/null 2>&1 || die "'$tool' is required but not installed"
  done
}

# Strips the Pi's temporary backup, whether pull succeeded or not.
cleanup_remote_backup() {
  if [ -n "${BACKUP_NAME:-}" ] && [ -n "${AUTH_TOKEN:-}" ]; then
    echo "==> Removing the temporary backup from the server"
    curl -fsS -X DELETE \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      "$PI_URL/api/backups/$BACKUP_NAME" >/dev/null 2>&1 ||
      echo "warning: could not delete $BACKUP_NAME, remove it via the admin UI" >&2
    BACKUP_NAME=""
  fi
}

pull() {
  require_tools curl jq unzip python3

  local email password
  email="${SURMAI_PI_EMAIL:-}"
  if [ -z "$email" ]; then
    read -r -p "Superuser email for $PI_URL: " email
  fi
  password="${SURMAI_PI_PASSWORD:-}"
  if [ -z "$password" ]; then
    read -r -s -p "Password: " password
    echo
  fi
  [ -n "$email" ] && [ -n "$password" ] || die "email and password are both required"

  echo "==> Authenticating against $PI_URL"
  AUTH_TOKEN="$(
    jq -n --arg identity "$email" --arg password "$password" \
      '{identity: $identity, password: $password}' |
      curl -fsS -X POST \
        -H 'Content-Type: application/json' \
        --data @- \
        "$PI_URL/api/collections/_superusers/auth-with-password" |
      jq -r '.token'
  )" || die "authentication failed (check the credentials and that $PI_URL is reachable)"
  [ -n "$AUTH_TOKEN" ] && [ "$AUTH_TOKEN" != "null" ] || die "authentication returned no token"

  # PocketBase only accepts [a-z0-9_-]+.zip as a backup name.
  BACKUP_NAME="preview-$(date +%Y%m%d-%H%M%S).zip"
  trap cleanup_remote_backup EXIT

  echo "==> Creating backup $BACKUP_NAME (the server briefly blocks writes)"
  jq -n --arg name "$BACKUP_NAME" '{name: $name}' |
    curl -fsS -X POST \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -H 'Content-Type: application/json' \
      --data @- \
      "$PI_URL/api/backups" >/dev/null || die "backup creation failed"

  local file_token
  file_token="$(
    curl -fsS -X POST \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      "$PI_URL/api/files/token" | jq -r '.token'
  )" || die "could not obtain a file token"

  local staging
  staging="$(mktemp -d)"
  # shellcheck disable=SC2064 # expand $staging now, not at trap time
  trap "cleanup_remote_backup; rm -rf '$staging'" EXIT

  echo "==> Downloading the backup"
  curl -fsS -o "$staging/backup.zip" \
    "$PI_URL/api/backups/$BACKUP_NAME?token=$file_token" || die "download failed"

  cleanup_remote_backup

  echo "==> Extracting the archive"
  mkdir -p "$staging/extracted"
  unzip -q "$staging/backup.zip" -d "$staging/extracted"
  [ -f "$staging/extracted/data.db" ] || die "the archive contains no data.db"

  # Disable before installing: a failure here must not leave a servable copy
  # that still points at the real mailbox and LLM endpoint.
  echo "==> Disabling outbound integrations in the copy"
  python3 "$REPO_ROOT/scripts/neutralize_preview_data.py" "$staging/extracted/data.db"

  echo "==> Installing into $DATA_DIR"
  rm -rf "$DATA_DIR"
  mkdir -p "$(dirname "$DATA_DIR")"
  mv "$staging/extracted" "$DATA_DIR"

  cat <<EOF

Done. The copy lives in backend/pb_preview_data and holds real personal data;
it is gitignored, keep it that way.

Next:
  pnpm preview:serve   # backend on port $PORT, using the copy
  pnpm dev             # frontend, already proxied to port 9090
EOF
}

serve() {
  [ -f "$DATA_DIR/data.db" ] ||
    die "no snapshot found at $DATA_DIR - run 'pnpm preview:pull' first"

  echo "==> Backend on http://0.0.0.0:$PORT using backend/pb_preview_data"
  cd "$REPO_ROOT/backend"
  PB_DATA_DIRECTORY=./pb_preview_data exec go run . serve --http "0.0.0.0:$PORT"
}

case "${1:-}" in
pull) pull ;;
serve) serve ;;
*)
  echo "usage: $(basename "$0") {pull|serve}" >&2
  exit 1
  ;;
esac
