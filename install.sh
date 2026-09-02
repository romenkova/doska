#!/bin/sh
# Doska self-host bootstrapper. Downloads the compose file, scaffolds a .env
# (generating secrets for you), and brings the stack up. Safe to re-run: it never
# overwrites an existing .env, so a second run refreshes the compose file and the
# backup helper (keeping a .bak of yours if they differed) and pulls newer images.
# Before redeploying over an existing bundled database it takes a backup first
# (see backup.sh), and it refuses to write a fresh .env on top of one — new
# secrets wouldn't match the old data.
#
#   curl -fsSL https://raw.githubusercontent.com/romenkova/doska/main/install.sh -o install.sh && sh install.sh
#
# Unattended: every question can be answered up front by exporting the variable
# it writes, and --yes stops it asking anything.
#
#   AUTH_LOGIN=admin AUTH_PASSWORD=hunter2 BASE_URL=http://box.local:8080 \
#     sh install.sh --yes
set -eu

REPO="romenkova/doska"
# Where the compose file and backup helper come from. Empty means "work it out
# from the release being installed" (see source_ref);
RAW="${DOSKA_RAW:-}"
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

# True when the controlling terminal is readable. The script is usually piped in
# (curl | sh), so prompts must come from /dev/tty, not stdin — and /dev/tty can
# exist yet not be openable when there's no controlling terminal.
has_tty() { { true < /dev/tty; } 2>/dev/null; }

# Whether a question can be put on screen at all.
interactive() { [ -z "$YES" ] && has_tty; }

# The indirection is what lets a caller pre-answer a question from the environment.
preset() { [ -n "$1" ] || return 0; eval "printf '%s' \"\${$1:-}\""; }

ask() {
  # $1 env var holding a pre-supplied answer ('' if none)  $2 prompt  $3 default
  # -> echoes the answer
  _pre=$(preset "$1")
  if [ -n "$_pre" ]; then printf '%s' "$_pre"; return; fi
  if ! interactive; then printf '%s' "$3"; return; fi
  _def="$3"
  if [ -n "$_def" ]; then printf '%b?%b %s %b[%s]%b: ' "$C_BLUE" "$C_RESET" "$2" "$C_DIM" "$_def" "$C_RESET" > /dev/tty
  else printf '%b?%b %s: ' "$C_BLUE" "$C_RESET" "$2" > /dev/tty; fi
  IFS= read -r _ans < /dev/tty || _ans=""
  [ -n "$_ans" ] || _ans="$_def"
  printf '%s' "$_ans"
}

ask_secret() {
  # $1 env var holding a pre-supplied answer ('' if none)  $2 prompt
  # -> echoes the answer, input hidden
  _pre=$(preset "$1")
  if [ -n "$_pre" ]; then printf '%s' "$_pre"; return; fi
  if ! interactive; then return; fi
  printf '%b?%b %s: ' "$C_BLUE" "$C_RESET" "$2" > /dev/tty
  stty -echo < /dev/tty 2>/dev/null || true
  IFS= read -r _ans < /dev/tty || _ans=""
  stty echo < /dev/tty 2>/dev/null || true
  printf '\n' > /dev/tty
  printf '%s' "$_ans"
}

ask_yn() {
  # $1 prompt (default no) -> returns 0 for yes, 1 for no
  # Never yes unattended: every yes here costs money or discards data. Pre-answer
  # by setting what the branch collects (DATABASE_URL, S3_BUCKET, ...) instead.
  interactive || return 1
  printf '%b?%b %s %b[y/N]%b: ' "$C_BLUE" "$C_RESET" "$1" "$C_DIM" "$C_RESET" > /dev/tty
  IFS= read -r _ans < /dev/tty || _ans=""
  case "$_ans" in [Yy]*) return 0 ;; *) return 1 ;; esac
}

# Which release the images will come from: an explicit DOCKER_IMAGE_TAG wins,
# otherwise whatever a previous run's .env pins. Empty means the default channel.
pinned_tag() {
  if [ -n "${DOCKER_IMAGE_TAG:-}" ]; then printf '%s' "$DOCKER_IMAGE_TAG"; return; fi
  [ -f "$ENV_FILE" ] || return 0
  sed -n 's/^DOCKER_IMAGE_TAG=[[:space:]]*\([^[:space:]#]*\).*/\1/p' "$ENV_FILE" | head -1
}

# Every tag_name from a releases API path, newest first
release_tags() {
  _body=$(curl -fsSL "https://api.github.com/repos/${REPO}$1" 2>/dev/null) || return $?
  printf '%s\n' "$_body" \
    | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
}

# Echoes the git ref to fetch release files from; returns curl's status when the
# API is what failed.
source_ref() {
  case "$1" in
    ''|latest) _tags=$(release_tags "/releases/latest") || return $? ;;
    beta)      _tags=$(release_tags "/releases?per_page=30") || return $?
               _tags=$(printf '%s\n' "$_tags" | grep '[-]') || _tags="" ;;
    *)         printf 'v%s' "${1#v}"; return 0 ;;
  esac
  printf '%s\n' "$_tags" | head -1
}

gen_secret() {
  if command -v openssl > /dev/null 2>&1; then
    openssl rand -hex 32
  else
    # No openssl: 32 random bytes as hex, portably.
    head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

# Compose reads .env values with $ as interpolation, so a literal $ must be
# doubled or it silently mangles the value (a password like p@$$w0rd would lock
# the user out). Escape every user-supplied value before writing it.
env_escape() { printf '%s' "$1" | sed 's/\$/$$/g'; }

# Compose's default project name: the lowercased directory basename with any
# character outside [a-z0-9_-] dropped, then any leading `-`/`_` stripped —
# compose requires the name to start with a letter or digit. Scopes
# volume/container lookups to THIS install so another Doska on the same host
# isn't mistaken for ours; get it wrong and an existing database looks absent.
project_name() {
  if [ -n "${COMPOSE_PROJECT_NAME:-}" ]; then printf '%s' "$COMPOSE_PROJECT_NAME"; return; fi
  basename "$PWD" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-' | sed 's/^[^a-z0-9]*//'
}

# Runs "$@" with a deadline, returning 124 if it outlives it. A daemon that has
# stopped answering never returns from a docker call, and an installer that
# hangs with no output is worse than one that gives up.
DOCKER_TIMEOUT=${DOCKER_TIMEOUT:-10}
with_timeout() {
  "$@" &
  _pid=$!
  _waited=0
  while kill -0 "$_pid" 2>/dev/null; do
    if [ "$_waited" -ge "$DOCKER_TIMEOUT" ]; then
      kill -TERM "$_pid" 2>/dev/null
      wait "$_pid" 2>/dev/null
      return 124
    fi
    sleep 1
    _waited=$((_waited + 1))
  done
  wait "$_pid" && return 0 || return $?
}

# The bundled Postgres persists to <project>_doska-pgdata. Its presence means
# this install has existing data to protect.
bundled_volume_exists() {
  docker volume ls -q 2>/dev/null | grep -qx "$(project_name)_doska-pgdata"
}

# Assumes no existing data when the daemon won't answer. That errs towards the
# safe branch: no wipe is offered, and backup.sh gets its own chance to fail.
has_existing_data() {
  with_timeout bundled_volume_exists && _rc=0 || _rc=$?
  if [ "$_rc" = 124 ]; then
    warn "Docker isn't answering — skipping the check for an existing database."
    return 1
  fi
  return "$_rc"
}

# Dump the bundled db first if there's anything to lose. backup.sh no-ops for a
# managed DATABASE_URL or when no volume exists yet, so this is safe to call
# unconditionally; a failed backup aborts rather than risk the data.
backup_first() {
  if [ ! -f "$BACKUP_FILE" ]; then
    # Missing helper is only a problem when there's actually data to lose.
    has_existing_data && warn "no $BACKUP_FILE present — skipping backup of the existing database before redeploy."
    return 0
  fi
  sh "$BACKUP_FILE" || die "backup failed — aborting before touching anything."
}

PENDING=""
trap 'for _f in $PENDING; do rm -f "$_f.new"; done' EXIT
fetch_file() {
  info "Downloading $1"
  curl -fsSL "$RAW/$1" -o "$1.new" || { rm -f "$1.new"; return 1; }
  if [ ! -f "$1" ]; then
    mv "$1.new" "$1"
    [ "$1" = "$BACKUP_FILE" ] && chmod +x "$1"
    ok "$1 downloaded"
  elif cmp -s "$1" "$1.new"; then
    rm -f "$1.new"
    ok "$1 already up to date"
  else
    PENDING="$PENDING $1"
    ok "$1 update downloaded"
  fi
  return 0
}

# Swap in everything fetch_file held back. Only safe once the existing stack has
# been backed up (and torn down, where that happens).
apply_updates() {
  for _f in $PENDING; do
    # An earlier .bak may hold the only copy of the user's edits, creating another one
    _bak="$_f.bak"
    _n=1
    while [ -f "$_bak" ]; do _bak="$_f.bak.$_n"; _n=$((_n + 1)); done
    cp "$_f" "$_bak"
    mv "$_f.new" "$_f"
    [ "$_f" = "$BACKUP_FILE" ] && chmod +x "$_f"
    ok "$_f updated"
    warn "your previous $_f is saved as $_bak — re-apply any edits you had made to it."
  done
  PENDING=""
}

usage() {
  cat <<'EOF'
Usage: sh install.sh [--yes] [--no-start]

  -y, --yes       Never prompt. Questions take their pre-supplied answer (see
                  below) or their default; AUTH_PASSWORD becomes required.
    --no-start  Set up .env and stop, without pulling images or starting the
                  stack. Print the command to start it yourself.
  -h, --help      This.

Pre-supply any answer by exporting the variable it writes: AUTH_LOGIN,
AUTH_PASSWORD, BASE_URL, DOMAIN, WEB_PORT, DATABASE_URL, S3_BUCKET, S3_REGION,
S3_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, OIDC_ISSUER,
OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_NAME.
EOF
}

YES=${DOSKA_YES:-}
START=1
for _arg in "$@"; do
  case "$_arg" in
    -y | --yes) YES=1 ;;
    --no-start) START="" ;;
    -h | --help) usage; exit 0 ;;
    *) printf 'unknown option: %s\n\n' "$_arg" >&2; usage >&2; exit 2 ;;
  esac
done

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

TAG=""
REF=""
FETCH=1
if [ -z "$RAW" ]; then
  TAG=$(pinned_tag)
  RC=0
  REF=$(source_ref "$TAG") || RC=$?
  if [ -z "$REF" ]; then
    # curl -f reports every HTTP error as 22
    if [ "$RC" = 22 ]; then
      WHY="GitHub's release API refused the request${TAG:+ for DOCKER_IMAGE_TAG=$TAG} — rate limited, or no such release"
    else
      WHY="couldn't reach GitHub's release API${TAG:+ to resolve DOCKER_IMAGE_TAG=$TAG}"
    fi
    # Only the release lookup failed, so an existing compose file is still the
    # last known-good one — better than refusing to run at all.
    [ -f "$COMPOSE_FILE" ] || die "$WHY. Check your connection, or pin an exact version like DOCKER_IMAGE_TAG=0.18.0."
    warn "$WHY — keeping the $COMPOSE_FILE already in this directory."
    FETCH=""
  else
    RAW="https://raw.githubusercontent.com/${REPO}/${REF}"
    info "Using the $REF stack definition"
  fi
fi

if [ -n "$FETCH" ]; then
  fetch_file "$COMPOSE_FILE" ||
    die "failed to download $COMPOSE_FILE from ${REF:-$RAW}. Running with an outdated $COMPOSE_FILE might break the server. Check your connection${TAG:+, and that DOCKER_IMAGE_TAG=$TAG is a real release}, then re-run."

  # A stale helper is what would guard the database before every redeploy, so it
  # is refreshed too. Losing it only matters when there's nothing on disk.
  if ! fetch_file "$BACKUP_FILE"; then
    if [ -f "$BACKUP_FILE" ]; then
      warn "couldn't refresh $BACKUP_FILE — keeping the copy already here."
    else
      warn "couldn't download $BACKUP_FILE — pre-redeploy backups will be skipped."
    fi
  fi
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
  if has_existing_data; then
    warn "Found an existing database volume, but there's no .env in this directory."
    info "Its secrets are gone, so a fresh .env can't unlock it. Best to start clean."
    backup_first
    # The compose file marks a few vars required, so even `down -v` needs them
    # set. These are throwaway — teardown ignores them.
    DOWN_ENV="BASE_URL=x AUTH_LOGIN=x AUTH_PASSWORD=x AUTH_SECRET=x"
    # Only offer the wipe if we can prompt; a non-interactive run must not
    # silently destroy data.
    if has_tty && ask_yn "Discard that old database and start fresh (a backup was saved above)"; then
      info "Removing old volume"
      # shellcheck disable=SC2086
      env $DOWN_ENV $COMPOSE -f "$COMPOSE_FILE" $PROFILE down -v || die "couldn't remove the old volume."
      ok "Old database discarded — continuing with fresh setup"
      apply_updates
    else
      die "Kept the old database. Restore your previous .env here and re-run, or discard it manually with:
      $DOWN_ENV $COMPOSE -f $COMPOSE_FILE down -v"
    fi
  fi
  if [ -z "$YES" ] && ! has_tty; then
    die "no terminal for setup. Either re-run with --yes and the answers in the environment (see --help), or download $COMPOSE_FILE and $ENV_FILE manually, edit, then run '$COMPOSE up -d'."
  fi
  info "First-time setup — a few questions:"
  printf '\n'

  LOGIN=$(ask AUTH_LOGIN "Admin login" "admin")

  PASSWORD=""
  while [ -z "$PASSWORD" ]; do
    PASSWORD=$(ask_secret AUTH_PASSWORD "Admin password")
    if [ -z "$PASSWORD" ]; then
      interactive || die "set AUTH_PASSWORD for an unattended install."
      red "password cannot be empty."
    fi
  done

  DOMAIN=$(ask DOMAIN "Public domain for HTTPS (blank for plain http)" "")
  if [ -n "$DOMAIN" ]; then
    BASE_URL="https://$DOMAIN"
    PROFILE="--profile https"
    WEB_PORT=""
  elif [ -n "${BASE_URL:-}" ]; then
    # Answered up front; the publish port can't be read back out of an arbitrary URL.
    WEB_PORT=${WEB_PORT:-8080}
  else
    # Default to a local-only address. Other devices (desktop app, phone, MCP)
    # can't reach "localhost", so only ask for a real host/port if they will.
    WEB_PORT=${WEB_PORT:-8080}
    BASE_URL="http://localhost:$WEB_PORT"
    if ask_yn "Reach this from other devices (not just this machine)"; then
      HOST=$(ask '' "  Host or IP this server is reached at" "")
      [ -n "$HOST" ] || HOST="localhost"
      # No preset name: WEB_PORT already holds one, and `ask` would skip asking.
      WEB_PORT=$(ask '' "  Web port" "$WEB_PORT")
      BASE_URL="http://$HOST:$WEB_PORT"
    fi
  fi

  # Database: bundled Postgres by default. Only ask for a connection string if
  # they bring their own; the bundled one needs nothing from them.
  DBURL=${DATABASE_URL:-}
  if [ -z "$DBURL" ] && ask_yn "Use your own (managed) Postgres instead of the bundled one"; then
    while [ -z "$DBURL" ]; do
      DBURL=$(ask DATABASE_URL "  DATABASE_URL (postgres://user:pass@host:5432/db)" "")
      [ -n "$DBURL" ] || red "connection string cannot be empty."
    done
  fi

  S3_BUCKET=${S3_BUCKET:-}; S3_REGION=${S3_REGION:-}; S3_ENDPOINT=${S3_ENDPOINT:-}
  S3_KEY=""; S3_SECRET=""
  if [ -n "$S3_BUCKET" ] || ask_yn "Store card attachments in S3 instead of a local volume"; then
    S3_BUCKET=$(ask S3_BUCKET "  S3 bucket name" "")
    S3_REGION=$(ask S3_REGION "  S3 region" "us-east-1")
    S3_ENDPOINT=$(ask S3_ENDPOINT "  S3 endpoint (blank for AWS; set for R2/MinIO)" "")
    S3_KEY=$(ask AWS_ACCESS_KEY_ID "  Access key ID" "")
    S3_SECRET=$(ask_secret AWS_SECRET_ACCESS_KEY "  Secret access key")
  fi

  # Single sign-on: only worth asking about once BASE_URL is settled, since the
  # provider needs the callback built from it.
  OIDC_ISSUER=${OIDC_ISSUER:-}; OIDC_CLIENT_ID=${OIDC_CLIENT_ID:-}; OIDC_NAME=${OIDC_NAME:-}
  OIDC_SECRET=""
  if [ -n "$OIDC_ISSUER" ] || ask_yn "Sign in through an identity provider (OIDC)"; then
    info "Register Doska there as a web app with this redirect URI:"
    info "  $BASE_URL/api/auth/oauth2/callback/oidc"
    info "and allow the openid, profile and email scopes."
    info "Docs: https://doska.sh/docs/user-guides/sso"
    OIDC_ISSUER=$(ask OIDC_ISSUER "  Issuer URL" "")
    OIDC_CLIENT_ID=$(ask OIDC_CLIENT_ID "  Client id" "")
    OIDC_SECRET=$(ask_secret OIDC_CLIENT_SECRET "  Client secret")
    OIDC_NAME=$(ask OIDC_NAME "  Name on the sign-in button" "")
    info "Sign in as admin with the password first and press Connect under Sign-in in your account."
    info "Going through the provider straight away creates a member instead."
  fi

  SECRET=$(gen_secret)
  PGPASS=$(gen_secret)

  printf '\n'
  info "Writing $ENV_FILE (secrets generated for you)"
  {
    printf 'AUTH_LOGIN=%s\n'    "$(env_escape "$LOGIN")"
    printf 'AUTH_PASSWORD=%s\n' "$(env_escape "$PASSWORD")"
    printf 'AUTH_SECRET=%s\n'   "$SECRET"
    printf 'BASE_URL=%s\n'      "$(env_escape "$BASE_URL")"
    printf 'POSTGRES_PASSWORD=%s\n' "$PGPASS"
    [ -n "$DBURL" ] && printf 'DATABASE_URL=%s\n' "$(env_escape "$DBURL")"
    [ -n "$DOMAIN" ] && printf 'DOMAIN=%s\n' "$(env_escape "$DOMAIN")"
    [ -n "$DOMAIN" ] && printf 'WEB_HOST_BIND=127.0.0.1\n'
    [ -n "${WEB_PORT:-}" ] && [ "${WEB_PORT:-}" != "8080" ] && printf 'WEB_PORT=%s\n' "$WEB_PORT"
    if [ -n "$S3_BUCKET" ]; then
      printf 'S3_BUCKET=%s\n'            "$(env_escape "$S3_BUCKET")"
      printf 'S3_REGION=%s\n'            "$(env_escape "$S3_REGION")"
      [ -n "$S3_ENDPOINT" ] && printf 'S3_ENDPOINT=%s\n' "$(env_escape "$S3_ENDPOINT")"
      printf 'AWS_ACCESS_KEY_ID=%s\n'    "$(env_escape "$S3_KEY")"
      printf 'AWS_SECRET_ACCESS_KEY=%s\n' "$(env_escape "$S3_SECRET")"
    fi
    if [ -n "$OIDC_ISSUER" ]; then
      printf 'OIDC_ISSUER=%s\n'        "$(env_escape "$OIDC_ISSUER")"
      printf 'OIDC_CLIENT_ID=%s\n'     "$(env_escape "$OIDC_CLIENT_ID")"
      printf 'OIDC_CLIENT_SECRET=%s\n' "$(env_escape "$OIDC_SECRET")"
      [ -n "$OIDC_NAME" ] && printf 'OIDC_NAME=%s\n' "$(env_escape "$OIDC_NAME")"
    fi
    printf '\n# Optional — uncomment and set, then re-run this script to apply:\n'
    [ -z "$DBURL" ] && printf '# DATABASE_URL=postgres://user:pass@host:5432/doska  # use managed Postgres instead of bundled\n'
    printf '# DOCKER_IMAGE_TAG=0.4.0  # pin a release instead of latest\n'
    [ -z "$S3_BUCKET" ] && printf '# S3_BUCKET=  S3_REGION=  AWS_ACCESS_KEY_ID=  AWS_SECRET_ACCESS_KEY=  # move attachments off the local volume into S3\n'
    [ -z "$OIDC_ISSUER" ] && printf '# OIDC_ISSUER=  OIDC_CLIENT_ID=  OIDC_CLIENT_SECRET=  # single sign-on through your identity provider\n'
    [ -n "$OIDC_ISSUER" ] && printf '# OIDC_AUTO_CREATE=off  # only accounts already connected to the provider can sign in through it\n'
    :
  } > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  ok "$ENV_FILE written (permissions 600)"
fi

# --- 4. launch ---------------------------------------------------------------
if [ -z "$START" ]; then
  step "Not launching" "--no-start: everything is configured, nothing is running."
  _had_pending="$PENDING"
  apply_updates
  if [ -n "$_had_pending" ]; then
    warn "the compose file changed. Run 'sh $BACKUP_FILE' before the up -d below — it redeploys a new stack shape over your existing volume."
  fi
  printf '\n  Start it when ready:\n    %s -f %s %s up -d\n\n' "$COMPOSE" "$COMPOSE_FILE" "$PROFILE"
  exit 0
fi

step "Launching" "Backs up any existing data, pulls the latest images, and starts the stack."
backup_first  # no-op on first install and for managed Postgres
apply_updates

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
