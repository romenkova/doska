---
title: HTTPS
nav: HTTPS
description: "Give a public Doska deployment a certificate: Caddy proxy handles Let's Encrypt."
order: 2
updated: "2026-08-07"
---

Use this guide if you need your deployment to be served over HTTPS.

## Setup

Point the domain's DNS at the host first, then in `.env`:

```sh
DOMAIN=doska.example.com
BASE_URL=https://doska.example.com
```

Start with the `https` profile:

```sh
docker compose -f docker-compose.selfhost.yml --profile https up -d
```

That launches a bundled [Caddy](https://caddyserver.com) proxy, which fetches a
Let's Encrypt certificate for `DOMAIN` and renews it automatically.

## Notes

- `BASE_URL` has to match the origin visitors actually use, with no trailing
  slash.
- The certificate is issued on demand, so the domain must resolve to this host
  before you start the profile; otherwise the challenge fails and Caddy retries.
- Already behind your own reverse proxy or a tunnel? Skip the profile entirely,
  leave the app on `WEB_PORT`, and set `BASE_URL` to the public origin your
  proxy serves.
