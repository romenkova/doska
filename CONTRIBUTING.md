# Contributing to Doska

Contributions are welcome, thank you for your interest!

## New features

The project has an internal roadmap, so before you start we need to align your suggestion with it and consider how it would influence other upcoming features. Please open an issue and we'll discuss the possible code changes.

I respond within a week.

## Bugfixes and docs

Ordinary bugfixes and documentation updates can be submitted via PR right away.

## AI and vibecoding

Contributions should be made by humans, and so should commits. The commit author is the one who owns a commit and is responsible for it, so AI commits are forbidden.

AI assisted coding is allowed, but all code changes should be reviewed and tested by humans.

## Dev setup

Node 22+ and pnpm 11+ are required.

### Running locally

1. Clone the repo, install deps, I use pnpm
2. Run `pnpm dev` - both server and client will run

Dev setup spins up client and server, including local MySQL db, and performs migrations on it.

To spin up a desktop app, run `pnpm desktop`.

The repo is a pnpm + turbo monorepo: `apps/` has the runnable apps (client, server, desktop), `packages/` has everything they share.

## Tests

1. e2e tests: `pnpm e2e`
2. unit and integration tests: `pnpm test`
3. selfhosting, and selfhosting regression tests run in ci

## Contact

You can contact me at rita.romenkova@gmail.com
