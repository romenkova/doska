---
title: MCP
nav: MCP
description: "Connect Claude Code, Claude Desktop or claude.ai to your Doska server so an agent can read and edit your boards."
order: 5
updated: "2026-08-09"
---

Your server exposes the board as MCP tools, so an agent can read and edit it.

Edits go through the same sync tables the apps use,  they land in Postgres and
reach your other devices on their next sync.

## Connecting

The tools are served at `https://your-server/mcp`, behind OAuth. 

For example, with Claude Code:

```sh
claude mcp add --transport http doska https://your-server/mcp
```

The first call opens a browser to sign in; the client registers itself and holds
an access token from there on.

The agent gets the boards of whichever account you signed in as, and nothing
else. To point it at a different account, connect again and sign in as that one.
See [Accounts](/accounts).

> MCP OAuth advertises absolute URLs, so your server needs `BASE_URL` set to its
> public origin. See [Self-hosting](/self-hosting).

## Tools

| Tool                             | What it does                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| `list_boards`                    | Every board with its id and title                                                      |
| `get_board`                      | One board in full: columns with color and done flag, each with its cards               |
| `get_card`                       | One card, without pulling the whole board                                              |
| `create_board`                   | New board with the default To Do / In Progress / Done columns                          |
| `rename_board`, `delete_board`   | Rename; delete along with its columns and cards                                        |
| `create_column`, `delete_column` | Delete takes the column's cards with it                                                |
| `update_column`                  | Title, color, collapsed, or which column counts as done                                |
| `move_column`                    | Reorder: to either end, or next to another column                                      |
| `create_card`                    | Add a card to a column,  title, Markdown body, optional `YYYY-MM-DD` deadline          |
| `update_card`                    | Edit title, body, or deadline; or `append` to the body without rewriting it            |
| `move_card`                      | To another column, to an end of one, or directly above a named card                    |
| `set_card_done`                  | Into the board's done column, or back out to the leftmost open one                     |
| `check_task`                     | Tick or untick one task-list checkbox by index, leaving the rest of the body untouched |
| `delete_card`                    | Delete a card                                                                          |
| `search_cards`                   | Across every board, by text, deadline range, or column                                 |
| `list_upcoming`                  | The app's upcoming view: overdue first, then today, then out to 60 days                |

## What the agent is told

The server ships `instructions` alongside the tools: the board's own concepts, 
the done column, deadlines,  and the Markdown dialect card bodies are written
in. 

## Limits

- Deletes are tombstones, the same as in the app: they propagate to your other
  devices rather than letting a peer resurrect the record on its next sync.
- Attachments are read-only here.
