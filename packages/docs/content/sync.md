---
title: Sync
nav: Sync
description: "How Doska keeps devices in sync: two channels, one reconcile pass per board, and last-writer-wins on a hybrid logical clock."
order: 7
updated: "2026-08-09"
---

Doska is local-first. Every device holds a full copy of your boards and reads
and writes it directly, so the UI never waits on the network.

Sync runs behind
that copy, reconciling it with the server. With no server configured, or while
signed out, sync simply doesn't run and the app stays local.

## Two channels

Sync is two independent engines:

- **The dashboard list**, your boards and their metadata. Account-level, so it
  is always active.
- **The board channel**, the columns and cards of the open board, plus any
  board you are watching in a cross-board view, plus any board holding edits
  that haven't reached the server yet.

## One reconcile

Each pass, per board:

1. Read the stored cursor for that board.
2. Collect the locally-changed records for it.
3. Push changes with cursor.
4. The server applies each change, then answers with everything changed past the
   cursor plus a new cursor.
5. Once that answer arrives are the pushed records dropped from the dirty
   queue.
6. Apply the returned changes locally and store the new cursor.

The cursor is not a timestamp. The server keeps a counter per board, bumped once
per accepted write and stamped on the row, and a pull is "every row stamped
higher than what you last saw".

## Conflicts

Records are merged last-writer-wins on `updatedAt`, one record at a time, on
both ends, two people editing different cards never conflict, and two people
editing the same card end up with the later edit.

Local timestamps come from a hybrid logical clock: `updatedAt` is ordinary
wall-clock milliseconds, but always ahead of every timestamp the device has seen,
local or pulled. An edit you make after seeing someone else's change therefore
outranks it even if your machine's clock is behind theirs.

## Cadence

While the app is in front of you it reconciles periodically, and immediately
when you open a board, sign in, or the network comes back. Backgrounded, the
poll stops.

A failed push leaves its records queued and is retried on the next tick.

## Deletes

Deleting anything writes a tombstone. Tombstones are kept for 14 days.
