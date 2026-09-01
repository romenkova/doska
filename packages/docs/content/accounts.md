---
title: Accounts
nav: Accounts
description: "More than one person on your Doska server: adding accounts, what each one gets, and how boards are shared."
order: 3
updated: "2026-09-02"
---

Your server can hold more than one account. Everyone signs in with their own
login and password, or through your identity provider if you set up
[single sign-on](/docs/self-hosting/environment#single-sign-on).

## Add someone

Sign in as the admin, open **Accounts** in settings, and give them a login and a
first password. Only the admin sees that screen; there's no way for someone to
sign themselves up. Single sign-on is the exception: the first sign-in through
the provider creates the account, and Accounts tags it **SSO**.

The admin is the account from `AUTH_LOGIN` / `AUTH_PASSWORD`, see
[Environment](/docs/self-hosting/environment).

## What they get

Their own boards, private to them. Nothing is copied over from you, so they
start empty. Sync only ever serves the boards an account owns or has been added
to.

## Sharing a board

**Share** in the board menu opens its roster. The owner adds anyone who has an
account on this server, and takes them off again. There are no invites to send,
because everyone is already on the server.

A shared board syncs to everyone on it and is marked as shared in the sidebar.
Leaving a board, or being taken off one, drops it and its cards from your
devices.

Sharing is the one part of the app that needs the server there and then: with
the server unreachable, the roster won't open and nothing changes.

A board can also be opened up to people with no account at all. See
[Public sharing](/docs/public-sharing).

## Passwords

The admin can set anyone's password from the same screen, its own included.
Changing `AUTH_PASSWORD` in `.env` does nothing once the server is running.

## Turning someone off

Deactivate them: they can't sign in, and their boards stay exactly where they
are. Reactivate any time and everything is back.
