# Doska

[![Build](https://github.com/romenkova/doska/actions/workflows/build.yml/badge.svg)](https://github.com/romenkova/doska/actions/workflows/build.yml)

A local-first Kanban board with Markdown cards. Runs in the browser or as a
native desktop app, works fully offline with no account, and **optionally** syncs
to a server you control.

## Features

- **Boards & columns** — multiple boards, each a set of draggable columns.
- **Drag & drop** — reorder cards and move them between columns
  ([`@hello-pangea/dnd`](https://github.com/hello-pangea/dnd)), with positions
  held by fractional indexing so reorders never renumber siblings.
- **Markdown cards** — card bodies render GitHub-flavored Markdown with live
  editing, a slash menu, and task-list progress.
- **Local-first** — everything persists to IndexedDB; reads and writes are
  instant and work with no network and no login.
- **Opt-in sync** — enable sync, point at a server, sign in, and changes flush in
  the background and pull in updates from your other devices.
- **Desktop app** — a Tauri 2 shell (macOS today) that reuses the web client
  verbatim and auto-updates from signed GitHub Releases.

## Architecture

Doska is a [pnpm](https://pnpm.io) + [Turborepo](https://turbo.build) monorepo.
The client is the source of truth on each device; the server is an optional sync
backend.

```
apps/
  client    React 19 + Vite SPA. Local-first; IndexedDB store, opt-in sync.
  server    Fastify + oRPC sync API. Drizzle/Postgres. Single-user auth.
  desktop   Tauri 2 shell wrapping the client, with auto-updater.
packages/
  contract    oRPC contract + zod schemas shared by client and server.
  sync        Sync engine: dirty queue, driver, background loop.
  client-db   IndexedDB adapter and client data layer.
  markdown    Markdown rendering + editor (slash menu, task progress).
  ui-kit      Shared UI primitives (Base UI + Tailwind).
  configs     Shared ESLint / Prettier / TS config.
  e2e         Playwright end-to-end tests.
```

**Stack:** React 19, Vite, TanStack Query, Wouter, Tailwind, Base UI ·
Fastify, oRPC, Drizzle ORM, Postgres (or in-process
PGlite for dev) · Tauri 2.

### How sync works

The client writes locally first and queues changes in a dirty set. When sync is
enabled and authenticated, the background engine reconciles with the server over
oRPC. Auth is a single configured login/password exchanged for a session cookie;
the sync API (`/rpc/*`) is the only protected surface. On desktop, requests go
through `@tauri-apps/plugin-http` (native fetch, no CORS, own cookie jar), so the
server needs no special handling.

## Getting started

Requires **Node 22+** and **pnpm 11+** (see `.nvmrc` / `package.json` engines).

```sh
pnpm install
pnpm dev        # web client + server (Turbo), excludes desktop
```

The client dev server proxies the sync API to the local server, so sync works
end to end without extra setup. For the desktop shell:

```sh
pnpm desktop    # tauri dev — native window around the client
```

### Common scripts

| Command            | What it does                                          |
| ------------------ | ----------------------------------------------------- |
| `pnpm dev`         | Run client + server in watch mode (excludes desktop). |
| `pnpm build`       | Build all web/server packages.                        |
| `pnpm desktop`     | Run the Tauri desktop app in dev.                     |
| `pnpm lint`        | Lint all packages.                                    |
| `pnpm type-check`  | Type-check all packages.                              |
| `pnpm format`      | Prettier-format the repo.                             |
| `pnpm e2e`         | Run Playwright end-to-end tests.                      |

Server-only database scripts (run from `apps/server`): `db:generate`,
`db:migrate`, `db:studio`. In production, migrations run automatically on boot.

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

### Full deploy (web UI + server)

To host the web app alongside the server, use the bundled compose files instead:

- `docker-compose.yml` — generic Docker host; publishes the web UI on `WEB_PORT`
  (default `8080`), server stays internal. Requires an external `DATABASE_URL`
  (see `.env.example`).
- `docker-compose.dokploy.yml` — [Dokploy](https://dokploy.com) deploy; Traefik
  routes to the web service, all containers on `dokploy-network`.

## Desktop app

The desktop build is a Tauri 2 shell around the same client. Releases are built
and signed in CI (`.github/workflows/release.yml`) and published to GitHub
Releases; the installed app auto-updates by polling a signed `latest.json`. The
update endpoint is proxied through the server (`/desktop/*`) so the URL baked
into installed apps never changes, even when release hosting does.

> macOS builds aren't notarized yet, so on first launch clear the quarantine
> flag: `xattr -dr com.apple.quarantine /Applications/Doska.app`.

## License

See [LICENSE](LICENSE).
