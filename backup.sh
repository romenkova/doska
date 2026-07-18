#!/bin/sh
# Back up the bundled Postgres to ./backups/doska-<timestamp>.sql.gz.
#
# Runs pg_dump through the db container's local socket, so it needs no app
# password and works even after POSTGRES_PASSWORD changed. It is a no-op when you
# use a managed DATABASE_URL (back that up through your provider) or when there
# is no data volume yet. Restore with:
#
#   gunzip -c backups/doska-XXXX.sql.gz | \
#     docker compose -f docker-compose.selfhost.yml exec -T db psql -U doska doska
set -eu

COMPOSE_FILE="docker-compose.selfhost.yml"
ENV_FILE=".env"

red()  { printf '\033[31m%s\033[0m\n' "$1" >&2; }
bold() { printf '\033[1m%s\033[0m\n' "$1"; }
die()  { red "error: $1"; exit 1; }

command -v docker > /dev/null 2>&1 || die "docker is not installed."
if docker compose version > /dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  die "docker compose is not available."
fi
[ -f "$COMPOSE_FILE" ] || die "$COMPOSE_FILE not found — run this from your Doska directory."

# Managed database: nothing local to dump.
if [ -f "$ENV_FILE" ] && grep -q '^DATABASE_URL=..*' "$ENV_FILE" 2>/dev/null; then
  bold "Managed Postgres (DATABASE_URL is set) — back it up through your provider."
  exit 0
fi

# No data volume for THIS install yet: nothing to back up. The volume name is
# scoped to the compose project (default: lowercased dir basename), so another
# Doska on the same host isn't mistaken for ours.
if [ -n "${COMPOSE_PROJECT_NAME:-}" ]; then
  PROJECT="$COMPOSE_PROJECT_NAME"
else
  PROJECT=$(basename "$PWD" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-')
fi
if ! docker volume ls -q 2>/dev/null | grep -qx "${PROJECT}_doska-pgdata"; then
  bold "No bundled database volume yet — nothing to back up."
  exit 0
fi

# Compose interpolates the whole file even to touch one service, and the server
# service marks AUTH_*/BASE_URL as required. With no .env (e.g. called to rescue
# data before a fresh setup) feed placeholders so compose can load — the db
# service ignores them and the server is never started here.
if [ ! -f "$ENV_FILE" ]; then
  export AUTH_LOGIN=x AUTH_PASSWORD=x AUTH_SECRET=x BASE_URL=http://localhost
fi

bold "Backing up the bundled database"
$COMPOSE -f "$COMPOSE_FILE" up -d db > /dev/null 2>&1 || true

_i=0
until $COMPOSE -f "$COMPOSE_FILE" exec -T db pg_isready -U doska -d doska > /dev/null 2>&1; do
  _i=$((_i + 1))
  [ "$_i" -ge 30 ] && die "database did not become ready."
  sleep 1
done

mkdir -p backups
_out="backups/doska-$(date +%Y%m%d-%H%M%S).sql.gz"
_tmp="backups/.dump.$$"
# Dump to a temp file first so pg_dump's own exit status is what we check — a
# plain pipe into gzip would mask a failed dump behind gzip's success.
if $COMPOSE -f "$COMPOSE_FILE" exec -T db pg_dump -U doska doska > "$_tmp" 2>/dev/null; then
  gzip < "$_tmp" > "$_out"
  rm -f "$_tmp"
  printf '  saved %s (%s)\n' "$_out" "$(du -h "$_out" | cut -f1)"
else
  rm -f "$_tmp" "$_out"
  die "pg_dump failed — nothing written."
fi
