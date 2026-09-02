#!/usr/bin/env bash
# Exercises install.sh's setup path unattended, asserting what lands in .env.
#
#   ./.github/scripts/install-test.sh
set -uo pipefail

REPO_ROOT=$(cd "$(dirname "$0")/../.." && pwd)
INSTALL="$REPO_ROOT/install.sh"
COMPOSE_SRC="$REPO_ROOT/docker-compose.selfhost.yml"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# Stub docker: these cases are about what install.sh writes, and `docker volume
# ls` against a sick daemon never returns. Its log is how --no-start is checked.
mkdir -p "$WORK/bin"
cat > "$WORK/bin/docker" <<'STUB'
#!/bin/sh
echo "$*" >> "${DOCKER_LOG:-/dev/null}"
case "$1 ${2:-}" in
  "compose version")
    [ -z "${DOCKER_STUB_NO_COMPOSE:-}" ] || exit 1
    echo "Docker Compose version v2.40.0"
    ;;
  "volume ls")
    # Stands in for a daemon that accepted the call and never answered.
    [ -z "${DOCKER_STUB_HANG:-}" ] || sleep 120
    ;; # otherwise empty: a host with no previous install
esac
exit 0
STUB
chmod +x "$WORK/bin/docker"

# Stub curl: records every URL asked for
REAL_CURL=$(command -v curl)
cat > "$WORK/bin/curl" <<STUB
#!/bin/sh
url=""; out=""; prev=""
for a in "\$@"; do
  case "\$a" in http*|file*) url="\$a" ;; esac
  [ "\$prev" = "-o" ] && out="\$a"
  prev="\$a"
done
echo "\$url" >> "\${CURL_LOG:-/dev/null}"
case "\$url" in
  *api.github.com*) [ -z "\${CURL_API_FAIL:-}" ] || exit "\$CURL_API_FAIL" ;;
esac
case "\$url" in
  file://*) exec $REAL_CURL "\$@" ;;
  *releases/latest) printf '{"tag_name": "%s"}\n' "\${CURL_LATEST:-v0.18.0}" ;;
  # Newest first, as the API returns them. install.sh reads tag_name line by
  # line, so the surrounding array punctuation is left off deliberately.
  *releases*per_page*)
    for t in \${CURL_RELEASES:-v0.19.0-beta.1}; do
      printf '  {"tag_name": "%s"}\n' "\$t"
    done
    ;;
  *backup.sh) [ -n "\$out" ] && cp "$REPO_ROOT/backup.sh" "\$out" || cat "$REPO_ROOT/backup.sh" ;;
  *) [ -n "\$out" ] && cp "\$CURL_SERVE" "\$out" || cat "\$CURL_SERVE" ;;
esac
exit 0
STUB
chmod +x "$WORK/bin/curl"

failures=0
case_name=""

# A question that slips through unattended would block forever.
CASE_TIMEOUT=${CASE_TIMEOUT:-45}

pass() { printf '  ✓ %s\n' "$1"; }
fail() {
  printf '  ✗ %s: %s\n' "$case_name" "$1" >&2
  failures=$((failures + 1))
}
step() { printf '  · %s\n' "$1"; }

# run <dir> [env assignments...] -- [install.sh args...]
run() {
  local dir="$WORK/$1"; shift
  local envs=() args=()
  while [ $# -gt 0 ]; do
    case $1 in
      --) shift; args=("$@"); break ;;
      *) envs+=("$1"); shift ;;
    esac
  done
  mkdir -p "$dir"
  # Both files are refreshed on every run, from CASE_RAW — the checkout by
  # default, which is both offline and the version under test. A case that
  # planted its own backup.sh keeps it.
  [ -f "$dir/backup.sh" ] || cp "$REPO_ROOT/backup.sh" "$dir/"

  step "running install.sh ${args[*]-}"
  local started=$SECONDS
  # bash 3.2 (macOS) treats "${arr[@]}" on an empty array as unbound under set -u.
  ( cd "$dir" && env "PATH=$WORK/bin:$PATH" "DOCKER_LOG=$dir/docker.log" \
      "DOSKA_RAW=${CASE_RAW-file://$REPO_ROOT}" \
      "CURL_LOG=$dir/curl.log" "CURL_SERVE=$COMPOSE_SRC" \
      ${envs[@]+"${envs[@]}"} sh "$INSTALL" ${args[@]+"${args[@]}"} ) \
    < /dev/null > "$dir/out.log" 2>&1 &
  local pid=$! code=0
  while kill -0 "$pid" 2> /dev/null; do
    if [ $((SECONDS - started)) -ge "$CASE_TIMEOUT" ]; then
      pkill -P "$pid" 2> /dev/null
      kill -TERM "$pid" 2> /dev/null
      wait "$pid" 2> /dev/null
      code=124
      break
    fi
    sleep 1
  done
  [ "$code" = 124 ] || { wait "$pid"; code=$?; }
  echo "$code" > "$dir/exit"

  if [ "$code" = 124 ]; then
    fail "timed out after ${CASE_TIMEOUT}s — last output:$(printf '\n    %s' "$(tail -3 "$dir/out.log")")"
  else
    step "install.sh exited $code after $((SECONDS - started))s"
  fi
}

exit_code() { cat "$WORK/$1/exit"; }
envfile() { cat "$WORK/$1/.env" 2>/dev/null; }

# has <dir> <line> — exact line present in the generated .env
has() {
  if grep -qxF "$2" "$WORK/$1/.env" 2>/dev/null; then pass "$2"; else
    fail "expected .env line '$2', got:$(printf '\n%s' "$(envfile "$1")")"
  fi
}

hasnt() {
  if grep -q "^$2=" "$WORK/$1/.env" 2>/dev/null; then
    fail "did not expect $2 in .env"
  else pass "no $2"; fi
}

# ---------------------------------------------------------------------------
case_name="defaults"
printf '\n%s\n' "$case_name"
run defaults AUTH_PASSWORD=hunter2 -- --yes --no-start
[ "$(exit_code defaults)" = 0 ] || fail "exit $(exit_code defaults): $(cat "$WORK/defaults/out.log")"
has defaults "AUTH_LOGIN=admin"
has defaults "AUTH_PASSWORD=hunter2"
has defaults "BASE_URL=http://localhost:8080"
hasnt defaults "DOMAIN"
hasnt defaults "DATABASE_URL"
hasnt defaults "S3_BUCKET"
hasnt defaults "OIDC_ISSUER"
if grep -qE '^AUTH_SECRET=[0-9a-f]{64}$' "$WORK/defaults/.env"; then pass "AUTH_SECRET is 32 random bytes"
else fail "AUTH_SECRET is not 64 hex chars: $(grep '^AUTH_SECRET=' "$WORK/defaults/.env")"; fi
if grep -qE '^POSTGRES_PASSWORD=[0-9a-f]{64}$' "$WORK/defaults/.env"; then pass "POSTGRES_PASSWORD generated"
else fail "POSTGRES_PASSWORD is not 64 hex chars"; fi
# .env holds the admin password and every secret in the deploy.
perms=$(ls -l "$WORK/defaults/.env" | cut -c1-10)
[ "$perms" = "-rw-------" ] && pass "mode 600" || fail "mode is $perms, want -rw-------"
grep -q "Not launching" "$WORK/defaults/out.log" && pass "--no-start stopped before launch" ||
  fail "--no-start still tried to launch"
if grep -qE '(^| )(pull|up)( |$)' "$WORK/defaults/docker.log" 2> /dev/null; then
  fail "--no-start ran docker: $(cat "$WORK/defaults/docker.log")"
else pass "--no-start invoked no docker pull/up"; fi

# ---------------------------------------------------------------------------
case_name="unattended without a password"
printf '\n%s\n' "$case_name"
run nopass -- --yes --no-start
[ "$(exit_code nopass)" != 0 ] && pass "refused to install" || fail "wrote an empty admin password"
grep -q "AUTH_PASSWORD" "$WORK/nopass/out.log" && pass "says which variable is missing" ||
  fail "error does not name AUTH_PASSWORD: $(cat "$WORK/nopass/out.log")"
[ -f "$WORK/nopass/.env" ] && fail "left a half-written .env behind" || pass "no .env written"

# ---------------------------------------------------------------------------
case_name="pre-supplied answers"
printf '\n%s\n' "$case_name"
run supplied \
  AUTH_LOGIN=rita AUTH_PASSWORD=s3cret \
  BASE_URL=http://box.local:9000 WEB_PORT=9000 \
  DATABASE_URL=postgres://u:p@db.example:5432/doska \
  S3_BUCKET=cards S3_REGION=eu-central-1 \
  AWS_ACCESS_KEY_ID=AKIA AWS_SECRET_ACCESS_KEY=shh \
  OIDC_ISSUER=https://auth.example OIDC_CLIENT_ID=doska OIDC_CLIENT_SECRET=oidcshh OIDC_NAME=Authentik \
  -- --yes --no-start
[ "$(exit_code supplied)" = 0 ] || fail "exit $(exit_code supplied): $(cat "$WORK/supplied/out.log")"
has supplied "AUTH_LOGIN=rita"
has supplied "BASE_URL=http://box.local:9000"
has supplied "WEB_PORT=9000"
has supplied "DATABASE_URL=postgres://u:p@db.example:5432/doska"
has supplied "S3_BUCKET=cards"
has supplied "S3_REGION=eu-central-1"
has supplied "AWS_ACCESS_KEY_ID=AKIA"
has supplied "AWS_SECRET_ACCESS_KEY=shh"
has supplied "OIDC_ISSUER=https://auth.example"
has supplied "OIDC_CLIENT_ID=doska"
has supplied "OIDC_CLIENT_SECRET=oidcshh"
has supplied "OIDC_NAME=Authentik"

# ---------------------------------------------------------------------------
case_name="https domain"
printf '\n%s\n' "$case_name"
run https AUTH_PASSWORD=x DOMAIN=doska.example.com -- --yes --no-start
has https "BASE_URL=https://doska.example.com"
has https "DOMAIN=doska.example.com"
# Caddy fronts the stack, so the plain-http port must not stay public.
has https "WEB_HOST_BIND=127.0.0.1"
grep -q -- "--profile https" "$WORK/https/out.log" && pass "start hint includes the https profile" ||
  fail "start hint omits --profile https: $(cat "$WORK/https/out.log")"

# ---------------------------------------------------------------------------
# An unescaped $ reaches compose as interpolation and locks the admin out.
case_name="dollar signs are escaped for compose"
printf '\n%s\n' "$case_name"
run dollars 'AUTH_PASSWORD=p@$$w0rd' -- --yes --no-start
has dollars 'AUTH_PASSWORD=p@$$$$w0rd'

# ---------------------------------------------------------------------------
case_name="re-run keeps the existing .env"
printf '\n%s\n' "$case_name"
run rerun AUTH_PASSWORD=first -- --yes --no-start
cp "$WORK/rerun/.env" "$WORK/rerun/.env.before"
( cd "$WORK/rerun" && env "DOSKA_RAW=file://$REPO_ROOT" AUTH_PASSWORD=second sh "$INSTALL" --yes --no-start ) \
  < /dev/null > "$WORK/rerun/out2.log" 2>&1
if diff -q "$WORK/rerun/.env.before" "$WORK/rerun/.env" > /dev/null; then
  pass "second run left .env untouched"
else
  fail "second run rewrote .env — existing secrets would stop matching the data"
fi

# ---------------------------------------------------------------------------
case_name="unresponsive docker daemon"
printf '\n%s\n' "$case_name"
run wedged AUTH_PASSWORD=x DOCKER_STUB_HANG=1 DOCKER_TIMEOUT=3 -- --yes --no-start
[ "$(exit_code wedged)" = 0 ] && pass "finished instead of hanging" ||
  fail "exit $(exit_code wedged): $(cat "$WORK/wedged/out.log")"
grep -qi "isn't answering" "$WORK/wedged/out.log" && pass "warned about the daemon" ||
  fail "no warning: $(cat "$WORK/wedged/out.log")"
has wedged "AUTH_LOGIN=admin"

# ---------------------------------------------------------------------------
case_name="missing docker compose"
printf '\n%s\n' "$case_name"
run nocompose AUTH_PASSWORD=x DOCKER_STUB_NO_COMPOSE=1 -- --yes --no-start
[ "$(exit_code nocompose)" != 0 ] && pass "refused to continue" || fail "installed without compose"
grep -qi "compose is not available" "$WORK/nocompose/out.log" && pass "says compose is missing" ||
  fail "unhelpful error: $(cat "$WORK/nocompose/out.log")"

# ---------------------------------------------------------------------------
case_name="bad flag"
printf '\n%s\n' "$case_name"
run badflag AUTH_PASSWORD=x -- --frobnicate
[ "$(exit_code badflag)" = 2 ] && pass "exits 2" || fail "exit $(exit_code badflag), want 2"
grep -q "unknown option" "$WORK/badflag/out.log" && pass "explains why" || fail "no explanation"

# ---------------------------------------------------------------------------
case_name="compose file is fetched when absent"
printf '\n%s\n' "$case_name"
run getcompose AUTH_PASSWORD=x -- --yes --no-start
if diff -q "$COMPOSE_SRC" "$WORK/getcompose/docker-compose.selfhost.yml" > /dev/null 2>&1; then
  pass "matches the source compose file"
else
  fail "compose file missing or wrong after a fresh install"
fi
[ -f "$WORK/getcompose/docker-compose.selfhost.yml.bak" ] &&
  fail "wrote a .bak on a fresh install" || pass "no .bak"

# ---------------------------------------------------------------------------
# The 0.18.0 regression: images moved to an nginx upstream whose network alias
# only existed in the newer compose file, and the installer kept the old one.
case_name="a stale compose file is refreshed"
printf '\n%s\n' "$case_name"
mkdir -p "$WORK/stale"
printf 'services:\n  server:\n    # the old shape, no doska-api alias\n' \
  > "$WORK/stale/docker-compose.selfhost.yml"
run stale AUTH_PASSWORD=x -- --yes --no-start
if diff -q "$COMPOSE_SRC" "$WORK/stale/docker-compose.selfhost.yml" > /dev/null 2>&1; then
  pass "replaced with the current one"
else
  fail "kept the stale compose file — new images would boot an old stack"
fi
grep -q "no doska-api alias" "$WORK/stale/docker-compose.selfhost.yml.bak" 2>/dev/null &&
  pass "previous copy kept as .bak" || fail "the user's compose file was lost"

# ---------------------------------------------------------------------------
case_name="an up-to-date compose file is left alone"
printf '\n%s\n' "$case_name"
mkdir -p "$WORK/current"
cp "$COMPOSE_SRC" "$WORK/current/"
run current AUTH_PASSWORD=x -- --yes --no-start
[ -f "$WORK/current/docker-compose.selfhost.yml.bak" ] &&
  fail "backed up an identical file" || pass "no .bak churn"

# ---------------------------------------------------------------------------
# The .bak from the first upgrade is the only copy of whatever the user had
# edited; a later upgrade must not overwrite it with a stock release file.
case_name="a second update keeps the first .bak"
printf '\n%s\n' "$case_name"
mkdir -p "$WORK/twobak"
printf 'services:\n  server:\n    # my own edits\n' > "$WORK/twobak/docker-compose.selfhost.yml"
run twobak AUTH_PASSWORD=x -- --yes --no-start
printf 'services:\n  server:\n    # a later release\n' > "$WORK/twobak/docker-compose.selfhost.yml"
run twobak -- --yes --no-start
grep -q "my own edits" "$WORK/twobak/docker-compose.selfhost.yml.bak" 2>/dev/null &&
  pass "the original .bak still holds the user's edits" ||
  fail "the second update clobbered the .bak: $(cat "$WORK/twobak/docker-compose.selfhost.yml.bak" 2>/dev/null)"
grep -q "a later release" "$WORK/twobak/docker-compose.selfhost.yml.bak.1" 2>/dev/null &&
  pass "the second copy is kept alongside it" ||
  fail "the second update saved no backup at all"

# ---------------------------------------------------------------------------
# backup.sh drives the pre-redeploy dump, so it drifts with the stack just like
# the compose file does.
case_name="a stale backup.sh is refreshed"
printf '\n%s\n' "$case_name"
mkdir -p "$WORK/staleback"
printf '#!/bin/sh\n# the helper from an old release\n' > "$WORK/staleback/backup.sh"
run staleback AUTH_PASSWORD=x -- --yes --no-start
if diff -q "$REPO_ROOT/backup.sh" "$WORK/staleback/backup.sh" > /dev/null 2>&1; then
  pass "replaced with the current one"
else
  fail "kept the stale backup.sh — it guards the database on every redeploy"
fi
grep -q "from an old release" "$WORK/staleback/backup.sh.bak" 2>/dev/null &&
  pass "previous copy kept as .bak" || fail "the previous backup.sh was lost"
[ -x "$WORK/staleback/backup.sh" ] && pass "still executable" || fail "lost the +x bit"

# ---------------------------------------------------------------------------
# The backup has to be taken with the compose file that created the running
# data; swapping first can point pg_dump at a service the old stack never had.
case_name="the backup runs before the compose file is replaced"
printf '\n%s\n' "$case_name"
mkdir -p "$WORK/order"
printf 'services:\n  server:\n    # the old shape\n' > "$WORK/order/docker-compose.selfhost.yml"
printf 'AUTH_LOGIN=admin\nAUTH_PASSWORD=x\nAUTH_SECRET=s\nBASE_URL=http://localhost:8080\n' \
  > "$WORK/order/.env"
cat > "$WORK/order/backup.sh" <<'FAKE'
#!/bin/sh
cp docker-compose.selfhost.yml backup-saw.yml
FAKE
run order -- --yes
grep -q "the old shape" "$WORK/order/backup-saw.yml" 2>/dev/null &&
  pass "backed up against the stack that is actually running" ||
  fail "backup saw the new compose file: $(cat "$WORK/order/backup-saw.yml" 2>/dev/null)"
diff -q "$COMPOSE_SRC" "$WORK/order/docker-compose.selfhost.yml" > /dev/null 2>&1 &&
  pass "the update still landed afterwards" || fail "the compose file was never updated"

# ---------------------------------------------------------------------------
# Continuing offline would pull new images onto whatever old stack is on disk.
case_name="an unreachable source stops the install"
printf '\n%s\n' "$case_name"
mkdir -p "$WORK/offline"
cp "$COMPOSE_SRC" "$WORK/offline/"
CASE_RAW="file:///nonexistent-doska-source"
run offline AUTH_PASSWORD=x -- --yes --no-start
unset CASE_RAW
[ "$(exit_code offline)" != 0 ] && pass "refused to continue" ||
  fail "installed against a compose file it could not verify"
grep -q "might break the server" "$WORK/offline/out.log" && pass "explains the risk" ||
  fail "unhelpful error: $(cat "$WORK/offline/out.log")"
diff -q "$COMPOSE_SRC" "$WORK/offline/docker-compose.selfhost.yml" > /dev/null 2>&1 &&
  pass "left the existing compose file intact" || fail "damaged the compose file on the way out"
[ -f "$WORK/offline/docker-compose.selfhost.yml.new" ] &&
  fail "left a .new temp file behind" || pass "no temp file left behind"

# ---------------------------------------------------------------------------
# The compose file has to come from the same release as the images
fetched_from() { grep -qF "$2" "$WORK/$1/curl.log" 2> /dev/null; }
CASE_RAW=""

case_name="a pinned version fetches that version's compose file"
printf '\n%s\n' "$case_name"
run pinned AUTH_PASSWORD=x DOCKER_IMAGE_TAG=0.17.0 -- --yes --no-start
fetched_from pinned "/romenkova/doska/v0.17.0/docker-compose.selfhost.yml" &&
  pass "fetched from v0.17.0" ||
  fail "wrong source: $(cat "$WORK/pinned/curl.log")"
grep -q "v0.17.0 stack definition" "$WORK/pinned/out.log" && pass "says which release it used" ||
  fail "did not report the release"

case_name="a version pinned with a leading v still resolves"
printf '\n%s\n' "$case_name"
run pinnedv AUTH_PASSWORD=x DOCKER_IMAGE_TAG=v0.17.0 -- --yes --no-start
fetched_from pinnedv "/doska/v0.17.0/docker-compose" && pass "no doubled v" ||
  fail "wrong source: $(cat "$WORK/pinnedv/curl.log")"

case_name="the latest channel resolves to the newest release"
printf '\n%s\n' "$case_name"
run chanlatest AUTH_PASSWORD=x -- --yes --no-start
fetched_from chanlatest "api.github.com/repos/romenkova/doska/releases/latest" &&
  pass "asked the API which release is latest" ||
  fail "did not resolve the channel: $(cat "$WORK/chanlatest/curl.log")"
fetched_from chanlatest "/doska/v0.18.0/docker-compose" && pass "fetched from that release" ||
  fail "wrong source: $(cat "$WORK/chanlatest/curl.log")"
fetched_from chanlatest "/doska/main/" && fail "still fetching from main" || pass "not from main"

case_name="the beta channel resolves to the newest prerelease"
printf '\n%s\n' "$case_name"
run chanbeta AUTH_PASSWORD=x DOCKER_IMAGE_TAG=beta -- --yes --no-start
fetched_from chanbeta "/doska/v0.19.0-beta.1/docker-compose" && pass "fetched from the prerelease" ||
  fail "wrong source: $(cat "$WORK/chanbeta/curl.log")"

# A stable release published after a prerelease is newer, but the `beta` image
# tag is only ever pushed for prerelease tags — taking the stable compose file
# would pair it with older images.
case_name="the beta channel skips a newer stable release"
printf '\n%s\n' "$case_name"
run betastable AUTH_PASSWORD=x DOCKER_IMAGE_TAG=beta \
  "CURL_RELEASES=v0.19.0 v0.19.0-beta.1 v0.18.0" -- --yes --no-start
fetched_from betastable "/doska/v0.19.0-beta.1/docker-compose" &&
  pass "fetched from the newest prerelease" ||
  fail "wrong source: $(cat "$WORK/betastable/curl.log")"

case_name="a tag pinned in an existing .env is honoured"
printf '\n%s\n' "$case_name"
mkdir -p "$WORK/envpin"
printf 'AUTH_LOGIN=admin\nAUTH_PASSWORD=x\nAUTH_SECRET=s\nBASE_URL=http://x\nDOCKER_IMAGE_TAG=0.16.2\n' \
  > "$WORK/envpin/.env"
run envpin -- --yes --no-start
fetched_from envpin "/doska/v0.16.2/docker-compose" && pass "read the pin out of .env" ||
  fail "ignored the .env pin: $(cat "$WORK/envpin/curl.log")"

# install.sh writes that pin as a commented hint with a trailing comment of its
# own; uncommenting it as instructed must not put the comment in the URL.
case_name="a pin with a trailing comment resolves to the version"
printf '\n%s\n' "$case_name"
mkdir -p "$WORK/envpincomment"
printf 'AUTH_LOGIN=admin\nAUTH_PASSWORD=x\nAUTH_SECRET=s\nBASE_URL=http://x\nDOCKER_IMAGE_TAG=0.4.0  # pin a release instead of latest\n' \
  > "$WORK/envpincomment/.env"
run envpincomment -- --yes --no-start
[ "$(exit_code envpincomment)" = 0 ] || fail "exit $(exit_code envpincomment): $(cat "$WORK/envpincomment/out.log")"
fetched_from envpincomment "/doska/v0.4.0/docker-compose" && pass "ignored the trailing comment" ||
  fail "wrong source: $(cat "$WORK/envpincomment/curl.log")"

# Unauthenticated api.github.com allows 60 requests an hour per IP, which a
# shared address reaches. Only the lookup failed, so what is on disk still runs.
case_name="a rate-limited API falls back to the compose file on disk"
printf '\n%s\n' "$case_name"
mkdir -p "$WORK/ratelimit"
cp "$COMPOSE_SRC" "$WORK/ratelimit/"
run ratelimit AUTH_PASSWORD=x CURL_API_FAIL=22 -- --yes --no-start
[ "$(exit_code ratelimit)" = 0 ] && pass "carried on with the existing compose file" ||
  fail "exit $(exit_code ratelimit): $(cat "$WORK/ratelimit/out.log")"
grep -qi "rate limited" "$WORK/ratelimit/out.log" && pass "names the rate limit" ||
  fail "blamed something else: $(cat "$WORK/ratelimit/out.log")"

case_name="a rate-limited API with nothing on disk still stops"
printf '\n%s\n' "$case_name"
run ratelimitbare AUTH_PASSWORD=x CURL_API_FAIL=22 -- --yes --no-start
[ "$(exit_code ratelimitbare)" != 0 ] && pass "refused to install without a compose file" ||
  fail "installed with no stack definition"
unset CASE_RAW

# ---------------------------------------------------------------------------
printf '\n'
if [ "$failures" -gt 0 ]; then
  printf '%d assertion(s) failed\n' "$failures" >&2
  exit 1
fi
printf 'install.sh: all cases passed\n'
