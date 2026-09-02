---
title: Single sign-on
nav: Single sign-on
description: "Let people sign in to your self-hosted Doska through your identity provider: Authentik, Keycloak, Pocket ID, Google, or any OpenID Connect server."
order: 5
updated: "2026-09-02"
---

Single sign-on is available only with the [self-hosted setup](/docs/self-hosting). It works with any OpenID Connect provider: Authentik, Keycloak, Pocket ID, Google, etc.

## How to enable single sign-on?

### 1. Register Doska in your identity provider

Create a web application with a client secret. Set the redirect URI to

```
<BASE_URL>/api/auth/oauth2/callback/oidc
```

and allow the `openid`, `profile` and `email` scopes. Doska takes the login from the `preferred_username` claim, or from the email when there is none.

Copy the issuer URL, the client id and the client secret.

### 2. Add them to .env

```sh
BASE_URL=https://doska.example.com
OIDC_ISSUER=https://auth.example.com
OIDC_CLIENT_ID=doska
OIDC_CLIENT_SECRET=...
OIDC_NAME=Authentik
```

`OIDC_NAME` is optional and names the button. `BASE_URL` has to match the redirect URI you registered.

### 3. Restart the server

```sh
docker compose -f docker-compose.selfhost.yml up -d
```

**Important:** the admin should sign in with env credentials and connect the seeded account to the provider, see [How to connect an existing account?](#how-to-connect-an-existing-account) below. Members can use SSO without any limits.

The sign-in dialog now has a **Continue with SSO** button. 

## How to sign in?

The admin should sign in with the login and password from `.env` first, and then connect the provider to that account (see [How to connect an existing account?](#how-to-connect-an-existing-account)). Going through the provider straight away creates a member instead.

## How to connect an existing account?

The provider never takes over an account that already exists. Sign in with the password on the web, open your account from the bottom of the sidebar, and press **Connect** under Sign-in. From then on the provider opens that account.

To stop the provider from creating accounts, set `OIDC_AUTO_CREATE=off`. Only connected accounts can then sign in through it.
