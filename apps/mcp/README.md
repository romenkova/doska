# MCP server

Exposes a Doska board to any MCP client (Claude Code, Claude Desktop, …) so an
agent can read and edit it: create cards from a discussion, tick off task lists,
move things between columns, tidy up a board.

It is a sync client like the web and desktop apps — it reads and writes through
the server's sync API, so its edits land in Postgres and reach your other
devices on their next sync.

> **Needs a server.** Doska is local-first: with no sync configured, your boards
> live in the browser's IndexedDB, which a separate process cannot reach. This
> only sees boards that sync to a server you run.

## Setup

Point it at your server and give it that server's single account:

```sh
cp .env.example .env   # DOSKA_URL, DOSKA_LOGIN, DOSKA_PASSWORD
```

Register it with Claude Code from the repo root:

```sh
claude mcp add doska \
  --env DOSKA_URL=http://localhost:3000 \
  --env DOSKA_LOGIN=admin \
  --env DOSKA_PASSWORD=change-me \
  -- pnpm --filter mcp start
```

## Tools

| Tool                                              | What it does                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `list_boards`                                     | Every board with its id and title                                             |
| `get_board`                                       | One board in full: columns in order, each with its cards and Markdown bodies  |
| `create_board`                                    | New board with the default To Do / In Progress / Done columns                 |
| `rename_board`, `delete_board`                    | Rename; delete along with its columns and cards                               |
| `create_column`, `rename_column`, `delete_column` | Delete takes the column's cards with it                                       |
| `create_card`                                     | Add a card to a column — title, Markdown body, optional `YYYY-MM-DD` deadline |
| `update_card`                                     | Edit title, body, or deadline; omitted fields are left alone                  |
| `move_card`                                       | To another column, or to the other end of its own                             |
| `delete_card`                                     | Delete a card                                                                 |

Deletes are tombstones, the same as in the app: they propagate to your other
devices rather than letting a peer resurrect the record on its next sync.

Attachments are read-only here — a card's files come back on `get_board`, but
uploading one goes through the server's file endpoints, not the sync channel.
