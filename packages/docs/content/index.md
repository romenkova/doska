---
title: Documentation
nav: Overview
description: "Doska is a local-first Kanban board with first-class Markdown support."
order: 1
updated: "2026-08-09"
---

Doska is a Kanban board where the cards are Markdown. 

Doska uses IndexedDB as the intermediate data source, and every few seconds (3 by default) syncs to the destination of choice: a local folder, or a sync server's database.

## How to run it

### Demo

The demo doesn't require any setup, and is available here: [app.doska.sh](https://app.doska.sh/d/welcome).
You can even point it at your own sync server.

### Fully local setup: folder sync

Download the app (currently only macOS is supported) from the [latest release](https://github.com/romenkova/doska/releases/latest), or grab the `.dmg` straight from [doska.sh](https://doska.sh).

Local folder sync is fairly new, so please [submit an issue](https://github.com/romenkova/doska/issues/new) if you find anything buggy. More on it in the [folder sync guide](/docs/user-guides/local-sync).

### Self-hosting

More on self-hosting here: [Self-hosting guide](/docs/self-hosting).

You will need Docker and Docker Compose. The self-hosting setup spins up the web server and the sync server. It also sets up the database and S3 (or local storage).

## What a card is

A card body is GitHub-flavored Markdown, with a few additions to the syntax:

- `- [ ]` task lists are first class,  the card header carries a live done/total
  count and the boxes are clickable.
- `[[12|Card title]]` links to another card and picks up its column's color.
- A line containing only `-cut-` ends the card's preview: the board shows what's
  above it, the full body opens in the card view.

Cards also have deadlines and priorities. Boards support search and sort, as well as a simplified column view, and a cross-board view sorted by date.

## Where to go next

- [User guides](/docs/user-guides).
- [Self-hosting](/docs/self-hosting),  one-line installer, HTTPS, backups.
- [Accounts](/docs/accounts),  more than one person on your server.
- [MCP](/docs/mcp),  let an agent read and edit your boards.
- [Desktop and mobile](/docs/desktop),  the macOS app and the PWA.
- [Development](/docs/development),  run the monorepo locally.
