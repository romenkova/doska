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
- **Installable** — install the web app to your home screen or dock and it runs
  standalone, fully offline.
- **Opt-in sync** — point at a server you control and your boards replicate
  across your devices in the background.
- **Desktop app** — a native macOS app that reuses the web client and
  auto-updates.

## Self-hosting

Doska works fully offline with no account. Host your own server if you want your
boards to sync across devices.

```sh
curl -fsSL https://raw.githubusercontent.com/romenkova/doska/main/install.sh | sh
```

The installer asks for a login, password, and (optionally) a domain, generates
the secrets for you, and brings the stack up. Re-run it any time to pull newer
images — it keeps your existing `.env`.

<details>
<summary>Or set it up by hand</summary>

```sh
curl -O https://raw.githubusercontent.com/romenkova/doska/main/docker-compose.selfhost.yml
curl -o .env https://raw.githubusercontent.com/romenkova/doska/main/.env.selfhost.example
# edit .env — set AUTH_PASSWORD, AUTH_SECRET (e.g. `openssl rand -hex 32`),
# and BASE_URL (this server's public origin, e.g. http://<your-host>:8080)
docker compose -f docker-compose.selfhost.yml up -d
```

</details>

Open the web UI at `http://<your-host>:8080` and sign in with the `AUTH_LOGIN` /
`AUTH_PASSWORD` from your `.env`. To sync the **desktop app**, open its sync
settings and set the server URL to the same address.

Postgres is bundled and stored in a Docker volume, but recommended is to use managed one.

- `WEB_PORT` — host port for the web UI (default `8080`).
- `DOCKER_IMAGE_TAG` — pin a release (e.g. `0.4.0`) instead of `latest`.
- `DATABASE_URL` — point at your own managed Postgres (optional).
- `BASE_URL` — this server's public origin. Cookie sync works without it; MCP
  OAuth needs it.

> **Single user per server:** the credentials in `.env` are the only account currently.

See `docker-compose.dokploy.yml` for [Dokploy](https://dokploy.com)).

### HTTPS

For a public deployment, set `DOMAIN` in `.env` (point its DNS at the host
first), set `BASE_URL=https://$DOMAIN`, and start with the `https` profile. A
bundled Caddy proxy fetches and auto-renews a Let's Encrypt certificate:

```sh
docker compose -f docker-compose.selfhost.yml --profile https up -d
```

### Backups

Your boards live in the bundled Postgres. Dump it to `./backups/` any time:

```sh
./backup.sh
```

`install.sh` also runs this automatically before it redeploys over an existing
database. Restore a dump with:

```sh
gunzip -c backups/doska-XXXX.sql.gz | \
  docker compose -f docker-compose.selfhost.yml exec -T db psql -U doska doska
```

(If you use a managed `DATABASE_URL`, back it up through your provider instead —
`backup.sh` skips it.)

## Desktop app

Download the latest macOS build from
[Releases](https://github.com/romenkova/doska/releases). It wraps the same client (with Tauri)
and auto-updates.

> macOS builds aren't notarized yet, so on first launch clear the quarantine
> flag: `xattr -dr com.apple.quarantine /Applications/Doska.app`.

## MCP

The server exposes your boards to an MCP client (Claude Code, Claude Desktop,
claude.ai) at `/mcp`, so an agent can read and edit them — create cards, tick off
task lists, move things between columns:

```sh
claude mcp add --transport http doska https://your-server/mcp
```

Sign-in happens in the browser on the first call (OAuth). Edits go through the
same sync tables the apps use, so they reach your other devices on their next
sync. Tools are listed in [packages/mcp/README.md](packages/mcp/README.md).

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
