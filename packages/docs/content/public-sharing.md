---
title: Public sharing
nav: Public sharing
description: "Publish a Doska board to a read-only link anyone can open, with no account."
order: 4
updated: "2026-08-11"
---

A board can be published to a link that anyone can open. It is read-only, needs
no account, and stores nothing in the visitor's browser.

## Publish one

Open **Share** in the board menu and press **Create link**. Only the board's
owner sees that button. Copy the link and hand it to whoever you like.

Pressing publish again while a board is published hands back the same link, so
you can not break a link you have already sent by pressing the button twice.

## What a visitor sees

The board as it stands: its columns in order, the cards in them, card bodies,
attachments and inline images, deadlines and task counts. References between
cards resolve inside the board. 

Nothing is editable, there is no session, and no local database is created.

## Turn it back off

**Share** again, then **Turn off**. Every link handed out so far stops working
on its next load. Publishing later mints a different token, so the old link
never comes back to life.

A board also stops being readable if you delete it, or if the server's admin
deactivates the account that owns it.

## Freshness

The server keeps a published board's snapshot for about ten seconds, so an edit
you make shows up on the public link a few seconds later rather than instantly.

## Sharing with people who have accounts

Publishing is for people outside your server. To give someone edit access, they
need an account on it and a place on the board's roster. See
[Accounts](/accounts).
