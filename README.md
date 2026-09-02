<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset=".github/assets/logo-light.png">
  <img alt="Doska" src=".github/assets/logo-light.png" width="180">
</picture>
<p></p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/tagline-dark.png">
  <source media="(prefers-color-scheme: light)" srcset=".github/assets/tagline-light.png">
  <img alt="Open source · self-hosted · Kanban board · Markdown cards" src=".github/assets/tagline-light.png" width="460">
</picture>
<p></p>

<p align="center">
  <a href="https://github.com/romenkova/doska/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/romenkova/doska?color=9585ff&label=release"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/romenkova/doska?color=7b8199"></a>
</p>
<p></p>

<p align="center">
  <strong><a href="https://app.doska.sh/d/welcome">Open demo</a></strong> ·
  <a href="https://doska.sh/docs">Documentation</a> ·
  <a href="https://github.com/romenkova/doska/releases/latest">Download for macOS</a> ·
  <a href="https://doska.sh/docs/mcp">MCP</a>
</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/board-dark.png">
  <source media="(prefers-color-scheme: light)" srcset=".github/assets/board-light.png">
  <img alt="A Doska board with a card open in the editor" src=".github/assets/board-light.png" width="900">
</picture>

</div>

## Why?

I wanted a Kanban board that works natively with Markdown and fits my way of working:

- **Personal projects**: sync a board to a folder inside the project, so the cards are Markdown files.
- **Editing on the go**: spin up a sync server with Docker Compose, and have my data on my phone, or just in the browser.
- **Sharing with other people**: account management, SSO support, and public links for boards.
- **MCP**: let agents sort my cards and point out what I am missing.

## Where the data lives

Any of these, simultaneously, or not: local folder on the disk, sync server, browser persisted memory.

Browser persisted memory (it's IndexedDB) is quick, and makes Doska fast. It also survives reloads, and feels ok offline.

But I do recommend using local file storage (desktop app only) or a sync server for permanent storage. Doska will still hit browser storage first, and keep being quick, but on top of that it will sync to a destination too.

A sync server makes it possible to have other users, public boards, and sync across devices.

Local folder sync lets you sync to a folder and then back it up manually with the tool of your choice.

Both can be used simultaneously.

## On making it comfortable to use

- **Markdown editor**: syntax highlighting, a slash menu, attachments, and cards that cross-reference each other.
- **List view**: a to-do list of every card sorted by date, where ticking the checkbox marks the card done.
- **Deadlines and priorities**: both sortable, and deadlines are what make the list view more useful.
- **Search**: not much to tell, it just searches.

## Self-hosting guide

A script that sets up the environment: it asks for the variables it needs, backs up an existing setup if it finds one, and starts an instance.

```sh
curl -fsSL https://raw.githubusercontent.com/romenkova/doska/main/install.sh -o install.sh && sh install.sh
```

Then open `http://<your-host>:8080` and sign in with the credentials you gave it.

Setting it up by hand, every environment variable, HTTPS, attachments and
backups: [doska.sh/docs/self-hosting](https://doska.sh/docs/self-hosting).

Parts:

- Sync server
- Web interface server
- Database: pass a database URL, or the bundled Postgres is used.
- File storage: pass S3 credentials, or files are stored on the server.

## Updating

The same script updates an existing install, and the useful part is that it takes a backup first. You can also do it by hand, by re-running the images from the latest tag.

```sh
curl -fsSL https://raw.githubusercontent.com/romenkova/doska/main/install.sh -o install.sh && sh install.sh
```

The desktop app follows whatever version its server runs, so update the server
first. The app's settings modal then has a button to check for updates and
install them.

## Desktop app (macOS-only for now)

Download the latest macOS build from
[Releases](https://github.com/romenkova/doska/releases/latest). It wraps the same
client (with Tauri), is signed and notarized, and auto-updates.
[doska.sh/docs/desktop](https://doska.sh/docs/desktop).

## MCP

The server exposes your boards to an MCP client at `/mcp`, so an agent can create cards, tick off task lists and move
things between columns:

```sh
claude mcp add --transport http doska https://your-server/mcp
```

Tools are listed in [packages/mcp/README.md](packages/mcp/README.md); setup is at
[doska.sh/docs/mcp](https://doska.sh/docs/mcp).

## Development

```sh
pnpm install
pnpm dev        # web client + server, in watch mode
pnpm desktop    # native desktop shell (Tauri)
```

Requirements, the full command list and the repository layout:
[doska.sh/docs/development](https://doska.sh/docs/development).

## License

See [LICENSE](LICENSE).
