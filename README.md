# Doska

A local-first Kanban board with Markdown cards. Runs in your browser or as a
native desktop app, works fully offline with no account, and **optionally** syncs
to a server you control.

## Features

- **Boards & columns** — multiple boards, each a set of draggable columns.
- **Drag & drop** — reorder cards and move them between columns.
- **Markdown cards** — GitHub-flavored Markdown with live editing, a slash menu,
  and task-list progress.
- **Local-first** — everything persists in your browser (IndexedDB); reads and
  writes are instant and work with no network and no login.
- **Opt-in sync** — point at a server you control and your boards replicate
  across your devices in the background.
- **Desktop app** — a native macOS app that reuses the web client and
  auto-updates.

## Self-hosting

Doska works fully offline with no account. Host your own server if you want your
boards to sync across devices. 

```sh
curl -O https://raw.githubusercontent.com/romenkova/doska/main/docker-compose.selfhost.yml
curl -o .env https://raw.githubusercontent.com/romenkova/doska/main/.env.selfhost.example
# edit .env — set AUTH_PASSWORD and AUTH_SECRET (e.g. `openssl rand -hex 32`)
docker compose -f docker-compose.selfhost.yml up -d
```

Open the web UI at `http://<your-host>:8080` and sign in with the `AUTH_LOGIN` /
`AUTH_PASSWORD` from your `.env`. To sync the **desktop app**, open its sync
settings and set the server URL to the same address.

Postgres is bundled and stored in a Docker volume, but recommended is to use managed one.

- `WEB_PORT` — host port for the web UI (default `8080`).
- `DOCKER_IMAGE_TAG` — pin a release (e.g. `0.4.0`) instead of `latest`.
- `DATABASE_URL` — point at your own managed Postgres (optional).

> **Single user per server:** the credentials in `.env` are the only account currently.

See `docker-compose.dokploy.yml` for [Dokploy](https://dokploy.com)).

## Desktop app

Download the latest macOS build from
[Releases](https://github.com/romenkova/doska/releases). It wraps the same client (with Tauri)
and auto-updates.

> macOS builds aren't notarized yet, so on first launch clear the quarantine
> flag: `xattr -dr com.apple.quarantine /Applications/Doska.app`.

## Development

Requires **Node 22+** and **pnpm 11+** (see `.nvmrc` / `package.json` engines).

```sh
pnpm install
pnpm dev        # web client + server, in watch mode
pnpm desktop    # native desktop shell (Tauri)
```

The client dev server proxies the sync API to the local server, so sync works end
to end with no extra setup.

| Command           | What it does                     |
| ----------------- | -------------------------------- |
| `pnpm build`      | Build all web/server packages.   |
| `pnpm lint`       | Lint all packages.               |
| `pnpm type-check` | Type-check all packages.         |
| `pnpm format`     | Prettier-format the repo.        |
| `pnpm e2e`        | Run Playwright end-to-end tests. |

## License

See [LICENSE](LICENSE).
