---
title: Backups
nav: Backups
description: "Dump a self-hosted Doska's database and attachments with backup.sh, and restore them into an empty stack."
order: 4
updated: "2026-08-07"
---

The backup script covers the bundled database and the local files volume. If you use S3 or a managed database, this guide **doesn't apply**.

Run `backup.sh` from your Doska directory any time:

```sh
./backup.sh
```

`install.sh` downloads it for you. If you set the stack up by hand, fetch it
first:

```sh
curl -O https://raw.githubusercontent.com/romenkova/doska/main/backup.sh
chmod +x backup.sh
```

It writes two files to `./backups/`, both stamped with the same timestamp:

| File                         | What's in it                             |
| ---------------------------- | ---------------------------------------- |
| `doska-<stamp>.sql.gz`       | The bundled Postgres.                    |
| `doska-files-<stamp>.tar.gz` | Card attachments, from the files volume. |


`install.sh` runs this for you before it redeploys over an existing database.

## Restoring

### Database

Restore the database into an **empty** one, with only `db` running. A booted
server has already migrated the schema and seeded the admin account, and the
dump would land on tables and rows that already exist:

```sh
docker compose -f docker-compose.selfhost.yml down --volumes
docker compose -f docker-compose.selfhost.yml up -d --wait db
gunzip -c backups/doska-XXXX.sql.gz | \
  docker compose -f docker-compose.selfhost.yml exec -T db \
    psql -v ON_ERROR_STOP=1 -U doska doska
```

### Attachments

Put the attachments back into the recreated volume, before the server
starts:

```sh
docker compose -f docker-compose.selfhost.yml up -d --no-start server
gunzip -c backups/doska-files-XXXX.tar.gz | \
  docker run --rm -i -v <project>_doska-files:/data alpine tar xf - -C /data
docker compose -f docker-compose.selfhost.yml up -d
```

`<project>` is the compose project name, by default the lowercased name of the
directory you run from (with anything outside `a-z0-9_-` dropped, and any
leading `-` or `_` stripped), or `COMPOSE_PROJECT_NAME` if you set one.
`docker compose config | head -1` prints the one in effect.

**Restore both halves from the same timestamp.** The database holds the rows
that name the files, so a mismatched pair leaves cards pointing at blobs that
aren't there.

## What the script does

1. Checks that `docker` and either `docker compose` or `docker-compose` are
   available, and that `docker-compose.selfhost.yml` sits in the current
   directory, otherwise you are not in your Doska directory and it stops.
2. Works out the compose project name (`COMPOSE_PROJECT_NAME`, or the lowercased
   name of the directory, normalised the way compose normalises it), that is
   the prefix on the volumes.
3. Creates `./backups/` and takes one timestamp, shared by both files.
4. **Database.** Skipped if `.env` sets `DATABASE_URL` (yours to back up through
   your provider), or if the `doska-pgdata` volume doesn't exist yet. Otherwise
   it starts the `db` service, waits up to 30s for `pg_isready`, and runs
   `pg_dump` into a temp file before gzipping it to
   `backups/doska-<stamp>.sql.gz`. If `pg_dump` fails, nothing is written.
5. **Attachments.** Skipped if there is no `doska-files` volume. Otherwise a
   throwaway `alpine` container mounts the volume read-only and tars it to
   `backups/doska-files-<stamp>.tar.gz`.
