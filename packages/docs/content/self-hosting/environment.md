---
title: Environment variables
nav: Environment
description: "Every variable a self-hosted Doska reads from .env: what it does, and whether it is required."
order: 1
updated: "2026-09-02"
---

`AUTH_LOGIN`, `AUTH_PASSWORD` and `AUTH_SECRET` are required: the server has no
defaults and won't start without them. Everything else is optional.

| Variable             | Required           | What it does                                                                                      |
| -------------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| `AUTH_LOGIN`         | yes                | Login of the first admin account, created on first boot.                                          |
| `AUTH_PASSWORD`      | yes                | That account's first password.                                                                    |
| `AUTH_SECRET`        | yes                | Signs session tokens. Generate with `openssl rand -hex 32`.                                       |
| `BASE_URL`           | no                 | This server's public origin, no trailing slash. Cookie sync works without it; MCP OAuth needs it. |
| `WEB_PORT`           | no                 | Host port the web UI is published on (default `8080`).                                            |
| `DOCKER_IMAGE_TAG`   | no                 | Release channel: `latest` (stable), `beta` (prerelease), or an exact version.                     |
| `POSTGRES_PASSWORD`  | no                 | Secures the bundled Postgres.                                                                     |
| `DATABASE_URL`       | no                 | Point at your own managed Postgres; the bundled db is then ignored.                               |
| `OIDC_ISSUER`        | no                 | Issuer URL of your identity provider. Set it and single sign-on is on.                            |
| `OIDC_CLIENT_ID`     | with `OIDC_ISSUER` | Client id from the provider.                                                                      |
| `OIDC_CLIENT_SECRET` | with `OIDC_ISSUER` | Client secret from the provider.                                                                  |
| `OIDC_NAME`          | no                 | Name on the sign-in button (default `SSO`).                                                       |
| `OIDC_AUTO_CREATE`   | no                 | `off`: signing in through the provider no longer creates accounts.                                |

## AUTH_LOGIN and AUTH_PASSWORD

These create one account, once, on the server's first boot. It's the admin, so
it can add everyone else from the app's [Accounts](/docs/accounts) screen.

After that they do nothing. Editing `AUTH_PASSWORD` and restarting won't change
the password. Use Accounts, where the admin can set anyone's, its own
included. Leave the pair in `.env` regardless: the server won't start without
it.

`DOCKER_IMAGE_TAG` also decides what the desktop app runs: it follows whatever
version the server it syncs with runs, so `beta` here puts the connected desktop
app on beta too.

## Single sign-on

Any OpenID Connect provider: Authentik, Keycloak, Pocket ID, Google. Register
Doska there as a web app with this redirect URI

```
<BASE_URL>/api/auth/oauth2/callback/oidc
```

and put the issuer URL, client id and secret into the `OIDC_*` variables. The
sign-in page gets a **Continue with SSO** button, or whatever `OIDC_NAME` says.
Passwords keep working, so the admin can always get in.

First sign-in through the provider creates an account, named after the
provider's username or the email's local part. It never takes over an existing
one: to attach the provider to an account you already have, sign in with the
password and press **Connect** under Sign-in in Settings.
`OIDC_AUTO_CREATE=off` makes that the only way in through the provider.
