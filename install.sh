#!/bin/sh
# Doska self-host bootstrapper. Downloads the compose file, scaffolds a .env
# (generating secrets for you), and brings the stack up. Safe to re-run: it
# never overwrites an existing .env, so a second run just pulls newer images.
# Before redeploying over an existing bundled database it takes a backup first
# (see backup.sh), and it refuses to write a fresh .env on top of one — new
# secrets wouldn't match the old data.
#
#   curl -fsSL https://raw.githubusercontent.com/romenkova/doska/main/install.sh -o install.sh && sh install.sh
set -eu

REPO="romenkova/doska"
RAW="https://raw.githubusercontent.com/${REPO}/main"
COMPOSE_FILE="docker-compose.selfhost.yml"
BACKUP_FILE="backup.sh"
ENV_FILE=".env"

# --- output helpers ----------------------------------------------------------
# Colour only when stdout is a terminal that likely supports it. The brand
# violet (#725cff) needs 24-bit truecolor; fall back to the nearest 256-colour
# purple, then to plain magenta on basic terminals.
if [ -t 1 ] && [ "${TERM:-dumb}" != "dumb" ]; then
  C_RESET='\033[0m'; C_BOLD='\033[1m'; C_DIM='\033[2m'
  C_RED='\033[31m'; C_GREEN='\033[32m'; C_YELLOW='\033[33m'
  case "${COLORTERM:-}" in
    truecolor|24bit) C_PURPLE='\033[38;2;114;92;255m' ;;
    *) case "$TERM" in
         *256color*) C_PURPLE='\033[38;5;99m' ;;
         *) C_PURPLE='\033[35m' ;;
       esac ;;
  esac
  C_BLUE="$C_PURPLE"
else
  C_RESET=''; C_BOLD=''; C_DIM=''
  C_RED=''; C_GREEN=''; C_YELLOW=''; C_BLUE=''; C_PURPLE=''
fi

STEP=0
TOTAL=4

logo() {
  printf '%b' "$C_PURPLE"
  cat <<'EOF'

   ██████╗  ██████╗ ███████╗██╗  ██╗ █████╗
   ██╔══██╗██╔═══██╗██╔════╝██║ ██╔╝██╔══██╗
   ██║  ██║██║   ██║███████╗█████╔╝ ███████║
   ██║  ██║██║   ██║╚════██║██╔═██╗ ██╔══██║
   ██████╔╝╚██████╔╝███████║██║  ██╗██║  ██║
   ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
EOF
  printf '%b' "$C_RESET"
  printf '   %bself-hosted kanban%b\n\n' "$C_DIM" "$C_RESET"
}

# step "Title" "one-line description of what this step does"
step() {
  STEP=$((STEP + 1))
  printf '\n%b[%d/%d]%b %b%s%b\n' "$C_PURPLE" "$STEP" "$TOTAL" "$C_RESET" "$C_BOLD" "$1" "$C_RESET"
  [ -n "${2:-}" ] && printf '      %b%s%b\n' "$C_DIM" "$2" "$C_RESET"
}

info() { printf '      %s\n' "$1"; }
ok()   { printf '      %b✓%b %s\n' "$C_GREEN" "$C_RESET" "$1"; }
warn() { printf '%b! %s%b\n' "$C_YELLOW" "$1" "$C_RESET" >&2; }
red()  { printf '%b%s%b\n' "$C_RED" "$1" "$C_RESET" >&2; }
bold() { printf '%b%s%b\n' "$C_BOLD" "$1" "$C_RESET"; }

die() { printf '\n%b✗ error:%b %s\n' "$C_RED" "$C_RESET" "$1" >&2; exit 1; }

# Prompts read from the terminal, not the piped-in script on stdin.
ask() {
  # $1 prompt  $2 default  -> echoes the answer
  _def="$2"
  if [ -n "$_def" ]; then printf '%b?%b %s %b[%s]%b: ' "$C_BLUE" "$C_RESET" "$1" "$C_DIM" "$_def" "$C_RESET" > /dev/tty
  else printf '%b?%b %s: ' "$C_BLUE" "$C_RESET" "$1" > /dev/tty; fi
  IFS= read -r _ans < /dev/tty || _ans=""
  [ -n "$_ans" ] || _ans="$_def"
  printf '%s' "$_ans"
}

ask_secret() {
  # $1 prompt -> echoes the answer, input hidden
  printf '%b?%b %s: ' "$C_BLUE" "$C_RESET" "$1" > /dev/tty
  stty -echo < /dev/tty 2>/dev/null || true
  IFS= read -r _ans < /dev/tty || _ans=""
  stty echo < /dev/tty 2>/dev/null || true
  printf '\n' > /dev/tty
  printf '%s' "$_ans"
}

ask_yn() {
  # $1 prompt (default no) -> returns 0 for yes, 1 for no
  printf '%b?%b %s %b[y/N]%b: ' "$C_BLUE" "$C_RESET" "$1" "$C_DIM" "$C_RESET" > /dev/tty
  IFS= read -r _ans < /dev/tty || _ans=""
  case "$_ans" in [Yy]*) return 0 ;; *) return 1 ;; esac
}

gen_secret() {
  if command -v openssl > /dev/null 2>&1; then
    openssl rand -hex 32
  else
    # No openssl: 32 random bytes as hex, portably.
    head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

# Compose's default project name: the lowercased directory basename with any
# character outside [a-z0-9_-] dropped. Scopes volume/container lookups to THIS
# install so another Doska on the same host isn't mistaken for ours.
project_name() {
  if [ -n "${COMPOSE_PROJECT_NAME:-}" ]; then printf '%s' "$COMPOSE_PROJECT_NAME"; return; fi
  basename "$PWD" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-'
}

# The bundled Postgres persists to <project>_doska-pgdata. Its presence means
# this install has existing data to protect.
bundled_volume_exists() {
  docker volume ls -q 2>/dev/null | grep -qx "$(project_name)_doska-pgdata"
}

# Dump the bundled db first if there's anything to lose. backup.sh no-ops for a
# managed DATABASE_URL or when no volume exists yet, so this is safe to call
# unconditionally; a failed backup aborts rather than risk the data.
backup_first() {
  [ -f "$BACKUP_FILE" ] || return 0
  sh "$BACKUP_FILE" || die "backup failed — aborting before touching anything."
}

logo

# --- 1. prerequisites --------------------------------------------------------
step "Checking prerequisites" "Doska runs in Docker. Let's make sure the tools it needs are present."
command -v docker > /dev/null 2>&1 || die "docker is not installed. See https://docs.docker.com/get-docker/"
if docker compose version > /dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  die "docker compose is not available."
fi
command -v curl > /dev/null 2>&1 || die "curl is not installed."
ok "docker, $COMPOSE and curl found"

# --- 2. fetch compose file and backup helper --------------------------------
step "Fetching files" "Downloads the compose file that defines the stack, plus the backup helper."
if [ ! -f "$COMPOSE_FILE" ]; then
  info "Downloading $COMPOSE_FILE"
  curl -fsSL "$RAW/$COMPOSE_FILE" -o "$COMPOSE_FILE" || die "failed to download $COMPOSE_FILE"
  ok "$COMPOSE_FILE downloaded"
else
  ok "$COMPOSE_FILE already present"
fi
if [ ! -f "$BACKUP_FILE" ]; then
  curl -fsSL "$RAW/$BACKUP_FILE" -o "$BACKUP_FILE" 2>/dev/null && chmod +x "$BACKUP_FILE" || true
fi

# --- 3. scaffold .env (first run only) --------------------------------------
step "Configuring" "First run asks a few questions and writes a .env with generated secrets. On re-runs your existing .env is kept as-is."
PROFILE=""
if [ -f "$ENV_FILE" ]; then
  ok "$ENV_FILE already exists — keeping your settings"
  # Re-derive the https profile from the saved DOMAIN so `up` matches first run.
  if grep -q '^DOMAIN=..*' "$ENV_FILE" 2>/dev/null; then PROFILE="--profile https"; fi
else
  # A fresh .env means fresh secrets. If a bundled database volume already
  # exists, those secrets won't match it and the server gets locked out of the
  # existing data. Stop, back it up, and let the user decide — don't proceed
  # into a broken state.
  if bundled_volume_exists; then
    warn "Found an existing database volume, but there's no .env in this directory."
    info "Its secrets are gone, so a fresh .env can't unlock it. Best to start clean."
    backup_first
    # Only offer the wipe if we can prompt; a non-interactive run must not
    # silently destroy data.
    if { true < /dev/tty; } 2>/dev/null && ask_yn "Discard that old database and start fresh (a backup was saved above)"; then
      info "Removing old volume"
      # The compose file marks a few vars required, so even `down -v` needs them
      # set. Pass throwaway values inline — teardown ignores them.
      # shellcheck disable=SC2086
      BASE_URL=x AUTH_LOGIN=x AUTH_PASSWORD=x AUTH_SECRET=x \
        $COMPOSE -f "$COMPOSE_FILE" $PROFILE down -v || die "couldn't remove the old volume."
      ok "Old database discarded — continuing with fresh setup"
    else
      die "Kept the old database. Restore your previous .env here and re-run, or discard it manually with:
      BASE_URL=x AUTH_LOGIN=x AUTH_PASSWORD=x AUTH_SECRET=x $COMPOSE -f $COMPOSE_FILE down -v"
    fi
  fi
  # /dev/tty may exist yet not be openable (e.g. no controlling terminal).
  if ! { true < /dev/tty; } 2>/dev/null; then
    die "no terminal for setup. Download $COMPOSE_FILE and $ENV_FILE manually, edit, then run '$COMPOSE up -d'."
  fi
  info "First-time setup — a few questions:"
  printf '\n'

  LOGIN=$(ask "Admin login" "admin")

  PASSWORD=""
  while [ -z "$PASSWORD" ]; do
    PASSWORD=$(ask_secret "Admin password")
    [ -n "$PASSWORD" ] || red "password cannot be empty."
  done

  DOMAIN=$(ask "Public domain for HTTPS (blank for plain http)" "")
  if [ -n "$DOMAIN" ]; then
    BASE_URL="https://$DOMAIN"
    PROFILE="--profile https"
    WEB_PORT=""
  else
    # Default to a local-only address. Other devices (desktop app, phone, MCP)
    # can't reach "localhost", so only ask for a real host/port if they will.
    WEB_PORT="8080"
    BASE_URL="http://localhost:8080"
    if ask_yn "Reach this from other devices (not just this machine)"; then
      HOST=$(ask "  Host or IP this server is reached at" "")
      [ -n "$HOST" ] || HOST="localhost"
      WEB_PORT=$(ask "  Web port" "8080")
      BASE_URL="http://$HOST:$WEB_PORT"
    fi
  fi

  # Database: bundled Postgres by default. Only ask for a connection string if
  # they bring their own; the bundled one needs nothing from them.
  DBURL=""
  if ask_yn "Use your own (managed) Postgres instead of the bundled one"; then
    while [ -z "$DBURL" ]; do
      DBURL=$(ask "  DATABASE_URL (postgres://user:pass@host:5432/db)" "")
      [ -n "$DBURL" ] || red "connection string cannot be empty."
    done
  fi

  # Attachments are opt-in: they need an S3 bucket and credentials the user
  # sets up elsewhere, so ask once and only expand if they want it.
  S3_BUCKET=""; S3_REGION=""; S3_ENDPOINT=""; S3_KEY=""; S3_SECRET=""
  if ask_yn "Enable card file attachments (needs an S3 bucket)"; then
    S3_BUCKET=$(ask "  S3 bucket name" "")
    S3_REGION=$(ask "  S3 region" "us-east-1")
    S3_ENDPOINT=$(ask "  S3 endpoint (blank for AWS; set for R2/MinIO)" "")
    S3_KEY=$(ask "  Access key ID" "")
    S3_SECRET=$(ask_secret "  Secret access key")
  fi

  SECRET=$(gen_secret)
  PGPASS=$(gen_secret)

  printf '\n'
  info "Writing $ENV_FILE (secrets generated for you)"
  {
    printf 'AUTH_LOGIN=%s\n'    "$LOGIN"
    printf 'AUTH_PASSWORD=%s\n' "$PASSWORD"
    printf 'AUTH_SECRET=%s\n'   "$SECRET"
    printf 'BASE_URL=%s\n'      "$BASE_URL"
    printf 'POSTGRES_PASSWORD=%s\n' "$PGPASS"
    [ -n "$DBURL" ] && printf 'DATABASE_URL=%s\n' "$DBURL"
    [ -n "$DOMAIN" ] && printf 'DOMAIN=%s\n' "$DOMAIN"
    [ -n "${WEB_PORT:-}" ] && [ "${WEB_PORT:-}" != "8080" ] && printf 'WEB_PORT=%s\n' "$WEB_PORT"
    if [ -n "$S3_BUCKET" ]; then
      printf 'S3_BUCKET=%s\n'            "$S3_BUCKET"
      printf 'S3_REGION=%s\n'            "$S3_REGION"
      [ -n "$S3_ENDPOINT" ] && printf 'S3_ENDPOINT=%s\n' "$S3_ENDPOINT"
      printf 'AWS_ACCESS_KEY_ID=%s\n'    "$S3_KEY"
      printf 'AWS_SECRET_ACCESS_KEY=%s\n' "$S3_SECRET"
    fi
    printf '\n# Optional — uncomment and set, then re-run this script to apply:\n'
    [ -z "$DBURL" ] && printf '# DATABASE_URL=postgres://user:pass@host:5432/doska  # use managed Postgres instead of bundled\n'
    printf '# DOCKER_IMAGE_TAG=0.4.0  # pin a release instead of latest\n'
    [ -z "$S3_BUCKET" ] && printf '# S3_BUCKET=  S3_REGION=  AWS_ACCESS_KEY_ID=  AWS_SECRET_ACCESS_KEY=  # card attachments\n'
    :
  } > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  ok "$ENV_FILE written (permissions 600)"
fi

# --- 4. launch ---------------------------------------------------------------
step "Launching" "Backs up any existing data, pulls the latest images, and starts the stack."
# Back up existing local data before redeploying over it. No-op on first install
# (no volume yet) and for managed Postgres.
backup_first

info "Pulling images"
# shellcheck disable=SC2086
$COMPOSE -f "$COMPOSE_FILE" $PROFILE pull
info "Starting containers"
# shellcheck disable=SC2086
$COMPOSE -f "$COMPOSE_FILE" $PROFILE up -d

URL=$(grep '^BASE_URL=' "$ENV_FILE" | cut -d= -f2-)
printf '\n'
printf '%b━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%b\n' "$C_GREEN" "$C_RESET"
printf '%b ✓ Doska is up and running!%b\n' "$C_GREEN$C_BOLD" "$C_RESET"
printf '%b━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%b\n' "$C_GREEN" "$C_RESET"
printf '  %bOpen%b   %s\n' "$C_BOLD" "$C_RESET" "$URL"
printf '  %bLogin%b  %s\n' "$C_BOLD" "$C_RESET" "$(grep '^AUTH_LOGIN=' "$ENV_FILE" | cut -d= -f2-)"
printf '  %bLogs%b   %s -f %s logs -f\n' "$C_BOLD" "$C_RESET" "$COMPOSE" "$COMPOSE_FILE"
printf '\n'
