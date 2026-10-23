#!/usr/bin/env bash
# Writes the .env the CI jobs boot against. Takes BASE_URL as its only argument.
set -euo pipefail

cat > .env <<EOF
AUTH_LOGIN=smoke
AUTH_PASSWORD=smoke-secret
AUTH_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=smoke-postgres
WEB_HOST_BIND=
BASE_URL=${1:?usage: write-env.sh <base-url>}
ALWAYS_AUTH=false
EOF
