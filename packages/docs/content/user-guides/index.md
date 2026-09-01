---
title: User guides
nav: User guides
description: "User guides"
order: 1
updated: "2026-09-01"
---

## Prerequisites

You need a host with Docker and Docker Compose.

## One-line installer

```sh
curl -fsSL https://raw.githubusercontent.com/romenkova/doska/main/install.sh -o install.sh && sh install.sh
```

This command downloads and launches an [install script](https://raw.githubusercontent.com/romenkova/doska/main/install.sh). The script backs up data if any data is present, helps to fill in env variables, and launches containers.

To upgrade, run the whole command above again rather than the `install.sh` you
already have. The script might change between releases. It keeps your existing `.env`, and
takes a database and files volume backup first if it's redeploying over an existing database.

## By hand

```sh
curl -O https://raw.githubusercontent.com/romenkova/doska/main/docker-compose.selfhost.yml
curl -o .env https://raw.githubusercontent.com/romenkova/doska/main/.env.selfhost.example
# edit .env,  set AUTH_PASSWORD, AUTH_SECRET (e.g. `openssl rand -hex 32`),
# and BASE_URL (this server's public origin, e.g. http://<your-host>:8080)
docker compose -f docker-compose.selfhost.yml up -d
```

Instead of downloading the files via the links, you can also find them in the GitHub repo and copy them.

1. [docker-compose.selfhost.yml](https://github.com/romenkova/doska/blob/main/docker-compose.selfhost.yml)
2. [.env.selfhost.example](https://github.com/romenkova/doska/blob/main/.env.selfhost.example),
   rename to `.env`

Open the web UI at `http://<your-host>:8080` and sign in with the `AUTH_LOGIN` /
`AUTH_PASSWORD` from your `.env`.

Those credentials create the **first admin** account on first boot. The admin
can add more accounts from the app, and a board's owner can share it with them
or publish it as a read-only link. See [Accounts](/docs/accounts).

## Configuration

See [Environment](/docs/self-hosting/environment) for every variable the server
reads from `.env`.

## Connecting your devices

- **Browser:** open the server's own web UI and sign in.
- **Desktop app:** open its sync settings and set the server URL to the same
  address.
- **Agents:** see [MCP](/docs/mcp).

## Dokploy

Deploying with [Dokploy](https://dokploy.com)? Use `docker-compose.dokploy.yml`
instead of the self-host compose file.

## Next

- [Environment](/docs/self-hosting/environment): every variable in `.env`.
- [Accounts](/docs/accounts): add more people to this server.
- [HTTPS](/docs/self-hosting/https): a certificate for a public deployment.
- [Attachments](/docs/self-hosting/attachments): keep files in S3 instead of a
  local volume.
- [Backups](/docs/self-hosting/backups): dump the database and files, and restore.
