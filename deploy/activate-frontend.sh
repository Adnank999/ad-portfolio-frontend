#!/usr/bin/env bash
set -Eeuo pipefail

RELEASE_ID="${1:?Missing release identifier}"
APP_DIR="${2:-/root/apps/ad-portfolio-frontend}"
SERVICE="${3:-ad-portfolio-frontend}"
HEALTH_URL="${4:-http://127.0.0.1:3000/}"

[[ "$RELEASE_ID" =~ ^[0-9a-f]{40}(-[0-9]+-[0-9]+)?$ ]] || { echo 'Invalid release identifier' >&2; exit 2; }
[[ "$SERVICE" =~ ^[a-zA-Z0-9_.@-]+$ ]] || { echo 'Invalid systemd service name' >&2; exit 2; }
[[ "$HEALTH_URL" =~ ^http://127\.0\.0\.1:[0-9]+/ ]] || { echo 'Health URL must use host loopback' >&2; exit 2; }
APP_DIR="$(realpath -e -- "$APP_DIR")"
[[ "$APP_DIR" != / ]] || exit 2

RELEASE_DIR="$APP_DIR/.deploy/releases/$RELEASE_ID/.output"
ACTIVE="$APP_DIR/.output"
NEXT="$APP_DIR/.output.next"

[[ -f "$RELEASE_DIR/server/index.mjs" ]] || { echo 'SSR entrypoint missing' >&2; exit 1; }
[[ -d "$RELEASE_DIR/public" ]] || { echo 'Nitro public assets missing' >&2; exit 1; }
[[ -f "$APP_DIR/.env.production" ]] || { echo 'Server environment file missing' >&2; exit 1; }

exec 9>"$APP_DIR/.deploy/activate.lock"
flock -n 9 || { echo 'Another frontend deployment is running' >&2; exit 1; }

SERVICE_COMMAND=(systemctl)
if (( EUID != 0 )); then
  SERVICE_COMMAND=(sudo -n systemctl)
fi

switch_output() {
  rm -f -- "$NEXT" || return
  ln -s -- "$1" "$NEXT" || return
  mv -Tf -- "$NEXT" "$ACTIVE"
}

healthy() {
  local attempt
  for ((attempt = 0; attempt < 20; attempt += 1)); do
    if "${SERVICE_COMMAND[@]}" is-active --quiet "$SERVICE" &&
      curl -fsS --connect-timeout 2 --max-time 8 -o /dev/null "$HEALTH_URL"; then
      return 0
    fi
    sleep 2
  done
  return 1
}

PREVIOUS=''
if [[ -L "$ACTIVE" ]]; then
  PREVIOUS="$(readlink -f -- "$ACTIVE")"
elif [[ -e "$ACTIVE" && ! -d "$ACTIVE" ]]; then
  echo 'Active output is neither a directory nor a symlink' >&2
  exit 1
fi

rollback() {
  local failure="$?"
  trap - ERR
  set +e
  echo 'Frontend activation failed; attempting rollback' >&2
  if [[ -n "$PREVIOUS" && -f "$PREVIOUS/server/index.mjs" ]]; then
    if switch_output "$PREVIOUS" && "${SERVICE_COMMAND[@]}" restart "$SERVICE" && healthy; then
      echo "Previous frontend release is healthy: $PREVIOUS" >&2
    else
      echo 'Frontend rollback needs manual recovery' >&2
    fi
  else
    echo 'No previous frontend release is available' >&2
  fi
  exit "$failure"
}
trap rollback ERR

if [[ -d "$ACTIVE" && ! -L "$ACTIVE" ]]; then
  PREVIOUS="$APP_DIR/.deploy/releases/manual-$(date -u +%Y%m%dT%H%M%SZ)-$$/.output"
  mkdir -p -- "$(dirname -- "$PREVIOUS")"
  mv -- "$ACTIVE" "$PREVIOUS"
fi

switch_output "$RELEASE_DIR"
"${SERVICE_COMMAND[@]}" restart "$SERVICE"
healthy

trap - ERR
echo "Frontend deployed successfully: $RELEASE_ID"
