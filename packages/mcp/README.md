# @doska/mcp

The board as MCP tools, so an agent can read and edit it: create cards from a
discussion, tick off task lists, move things between columns, tidy up a board.

The tools are transport-agnostic — they talk to a `BoardStore`, and the server
(`apps/server`) implements it straight onto the sync tables. Edits land in
Postgres and reach your other devices on their next sync, exactly as if you had
made them in the app.

## Connecting

The server serves these at `/mcp`, behind OAuth. From Claude Code:

```sh
claude mcp add --transport http doska https://your-server/mcp
```

The first call opens a browser to sign in; the client registers itself and holds
an access token from there on. Same URL works for Claude Desktop and claude.ai.

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
