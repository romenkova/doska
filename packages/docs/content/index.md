---
title: Documentation
nav: Overview
description: "Doska is a Kanban board where the cards are Markdown."
order: 1
updated: "2026-08-09"
---

Doska is a Kanban board where the cards are Markdown. 

Doska uses IndexedDB as the intermediate data source, and every few seconds (3 by default) syncs to the destination of choice: a local folder, or a sync server's database.

## How to run it

### Demo

The demo doesn't require any setup, and is available here: [app.doska.sh](https://app.doska.sh/d/welcome).
You can point it at your own sync server.

### Fully local setup: folder sync

Download the app from the [latest release](https://github.com/romenkova/doska/releases/latest). macOS, Linux (beta) and Windows (beta) are available.

Then, from the board page, select a folder to sync your data to. Columns are folders, and cards are Markdown files in that folder. Editing works both ways: edited files show up in the app, and vice versa.

More on how to sync to a folder in the [folder sync guide](/user-guides/local-sync).

### Self-hosting

More on self-hosting here: [Self-hosting guide](/self-hosting).

You will need Docker and Docker Compose. The self-hosting setup spins up the web server and the sync server. It also sets up the database and S3 (or local storage).

## What a card is

A card body is GitHub-flavored Markdown, with a few additions to the syntax:

- `- [ ]` task lists: the card header shows a done/total count and the boxes
  are clickable.
- `[[12|Card title]]` links to another card and picks up its column's color.
- A line containing only `-cut-` ends the card's preview: the board shows what's
  above it, the full body opens in the card view.

Cards also have deadlines and priorities. Boards support search and sort, as well as a simplified column view, and a cross-board view sorted by date.

## Where to go next

- [User guides](/user-guides).
- [Self-hosting](/self-hosting): installer, HTTPS, backups.
- [Accounts](/accounts): more than one person on your server.
- [MCP](/mcp): let an agent read and edit your boards.
- [Desktop and mobile](/desktop): the desktop apps and the PWA.
- [Development](/development): run the monorepo locally.
