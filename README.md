# Deck

[![CI](https://github.com/romenkova/deck.md/actions/workflows/ci.yml/badge.svg)](https://github.com/romenkova/deck.md/actions/workflows/ci.yml)

A Kanban board web app with markdown cards

## Features

- **Boards & columns** — multiple dashboards, each a board of draggable columns.
- **Drag & drop** — reorder cards and move them between columns
  (`@hello-pangea/dnd`).
- **Markdown cards** — card bodies render Markdown (GFM) with live editing.
- **Local-first storage** — all data persists in IndexedDB; reads and writes are
  effectively instant.
- **Background sync** — when sync is enabled, local changes flush to a remote
  server and pull in updates from other devices.

## Self-hosting the sync server

The app is local-first and works fully offline with no account. Sync is opt-in:
point the desktop app at a sync server you control and your boards replicate to
your own machine. You only need the **server** — there's no web UI to host.

```sh
cp .env.sync-selfhost.example .env
# edit .env — set AUTH_PASSWORD and AUTH_SECRET (e.g. `openssl rand -hex 32`)
```

Then pick a database:

```sh
# A) Bundled Postgres — zero setup, data lives in a Docker volume:
docker compose -f docker-compose.sync-selfhost.yml --profile bundled-db up -d --build

# B) Your own managed Postgres — set DATABASE_URL in .env, omit the profile:
docker compose -f docker-compose.sync-selfhost.yml up -d --build
```

This brings up the sync server on `SERVER_PORT` (default `3000`). Then in the
desktop app's sync settings, set the server URL to `http://<your-host>:3000`,
enable sync, and sign in with the `AUTH_LOGIN` / `AUTH_PASSWORD` from your
`.env`.

> Single user per server: the credentials in `.env` are the only account. Put it
> behind HTTPS (a reverse proxy) if you expose it beyond your local network.
