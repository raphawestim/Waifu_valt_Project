# The Vault Docker Infrastructure

This document covers the first Docker phase for The Vault. At this stage Docker is used only for local infrastructure: PostgreSQL, Redis and Adminer.

The React/Vite frontend still runs locally with `npm run dev`. There is no Dockerfile for the frontend, backend, Ollama or ComfyUI in this phase.

## Services

| Service | Container | Port | Purpose |
| --- | --- | --- | --- |
| PostgreSQL | `the-vault-postgres` | `5432` | Future persistent database for users, profiles, libraries, decks, manga, RPG data and favorites. |
| Redis | `the-vault-redis` | `6379` | Future cache for external APIs, rate-limit buffers, sessions and background work. |
| Adminer | `the-vault-adminer` | `8080` | Browser UI for inspecting PostgreSQL during development. |

## Why Only Infrastructure

The project is still running the frontend locally and uses localStorage for user data. Dockerizing only infrastructure keeps this step small and safe:

- The current React app remains unchanged.
- PostgreSQL and Redis are ready for the upcoming Fastify/Prisma backend.
- Adminer gives a simple way to inspect the database once backend migrations exist.
- Ollama and ComfyUI are intentionally excluded until the AI/Forge phase.

## Start Containers

```bash
docker compose up -d
```

Or using npm:

```bash
npm run docker:up
```

## Stop Containers

```bash
docker compose down
```

Or:

```bash
npm run docker:down
```

## Check Status

```bash
docker compose ps
```

Or:

```bash
npm run docker:ps
```

## View Logs

```bash
docker compose logs postgres
docker compose logs redis
```

Or:

```bash
npm run docker:logs:postgres
npm run docker:logs:redis
```

## Restart Services

```bash
docker compose restart
```

## List Volumes

```bash
docker volume ls
```

## Reset Database Volume

Warning: this deletes all PostgreSQL data stored in the Docker volume.

```bash
docker compose down -v
docker compose up -d
```

Use this only when you intentionally want a clean local database.

## Adminer

Open:

http://localhost:8080

Login with:

| Field | Value |
| --- | --- |
| System | PostgreSQL |
| Server | `postgres` |
| Username | `thevault` |
| Password | `thevault_password` |
| Database | `thevault_db` |

When connecting to PostgreSQL from your host machine or a local backend process, use:

```text
localhost:5432
```

When connecting from another container in the same `docker-compose.yml`, use:

```text
postgres:5432
```

## Environment Variables

Copy values from `.env.example` into your own `.env` or `.env.local` when needed. Do not commit real secrets.

Important local examples:

```env
POSTGRES_USER=thevault
POSTGRES_PASSWORD=thevault_password
POSTGRES_DB=thevault_db
DATABASE_URL=postgresql://thevault:thevault_password@localhost:5432/thevault_db
REDIS_URL=redis://localhost:6379
```

## Redis Future Use

Redis is not used by the current frontend. It is reserved for the backend phase, where it can cache:

- RAWG responses.
- Scryfall responses.
- AniList/Jikan/MangaDex responses.
- D&D 5e API responses.
- Session or rate-limit metadata.

## Next Phase

The next infrastructure step is to create a Fastify API with Prisma connected to this PostgreSQL service.
