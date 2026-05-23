# The Vault Backend

This document covers the first real backend phase for The Vault.

The backend is intentionally incremental. The React/Vite frontend still works with local storage, while the API prepares the project for PostgreSQL-backed user data, global favorites, NSFW consent and future Vault synchronization.

## Stack

- Fastify
- TypeScript
- Prisma
- PostgreSQL
- Redis
- Zod
- JWT
- bcryptjs

## Requirements

1. Copy `.env.example` to your local `.env`.
2. Keep real secrets out of Git.
3. Start the local infrastructure:

```bash
docker compose up -d
```

## Environment

Required for the API:

```bash
DATABASE_URL=postgresql://thevault:thevault_password@localhost:5432/thevault_db
REDIS_URL=redis://localhost:6379
PORT=3333
JWT_SECRET=change_me
CORS_ORIGIN=http://localhost:5173
```

`JWT_SECRET=change_me` is acceptable only for local development. Use a strong secret before production.

## Install And Generate Prisma

```bash
npm install
npm run prisma:generate
```

## Migrations

Create and apply the first migration:

```bash
npm run prisma:migrate
```

Prisma will ask for a migration name. A good first name is:

```text
init
```

Open Prisma Studio:

```bash
npm run prisma:studio
```

## Run The API

```bash
npm run api:dev
```

The API listens on:

```text
http://localhost:3333
```

## Health Check

```bash
GET http://localhost:3333/health
```

Expected shape:

```json
{
  "ok": true,
  "service": "the-vault-api",
  "timestamp": "2026-05-23T00:00:00.000Z",
  "database": "connected",
  "redis": "connected",
  "cache": "available"
}
```

If PostgreSQL or Redis is offline, the API returns `unknown` for that service instead of crashing the whole health route.

## Auth Endpoints

```text
POST /auth/register
POST /auth/login
GET /auth/me
```

Register payload:

```json
{
  "username": "raphael",
  "email": "raphael@example.com",
  "password": "local-dev-password",
  "displayName": "Raphael"
}
```

Login payload:

```json
{
  "usernameOrEmail": "raphael",
  "password": "local-dev-password"
}
```

Authenticated requests require:

```text
Authorization: Bearer <token>
```

## User And NSFW Endpoints

```text
GET /users/me
PATCH /users/me
GET /users/me/settings
PATCH /users/me/settings
GET /users/me/nsfw
POST /users/me/nsfw/enable
POST /users/me/nsfw/disable
```

The NSFW endpoints mirror the frontend profile gate:

- authenticated user required;
- access must be enabled;
- terms version and accepted timestamp are saved;
- disabling access blocks the protected Vault again.

## Collection Endpoints

Favorites:

```text
GET /me/favorites
POST /me/favorites
DELETE /me/favorites/:id
```

Games:

```text
GET /me/games
POST /me/games
PATCH /me/games/:id
DELETE /me/games/:id
```

TCG decks:

```text
GET /me/decks
POST /me/decks
GET /me/decks/:id
PATCH /me/decks/:id
DELETE /me/decks/:id
POST /me/decks/:id/cards
PATCH /me/decks/:id/cards/:cardId
DELETE /me/decks/:id/cards/:cardId
```

Manga / Anime:

```text
GET /me/manga
POST /me/manga
PATCH /me/manga/:id
DELETE /me/manga/:id
```

RPG:

```text
GET /me/rpg/characters
POST /me/rpg/characters
PATCH /me/rpg/characters/:id
DELETE /me/rpg/characters/:id
GET /me/rpg/campaigns
POST /me/rpg/campaigns
PATCH /me/rpg/campaigns/:id
DELETE /me/rpg/campaigns/:id
GET /me/rpg/campaigns/:campaignId/sessions
POST /me/rpg/campaigns/:campaignId/sessions
PATCH /me/rpg/campaigns/:campaignId/sessions/:sessionId
DELETE /me/rpg/campaigns/:campaignId/sessions/:sessionId
```

## Redis Cache And External API Proxy

The backend exposes internal Redis cache helpers:

- `getCache(key)`
- `setCache(key, payload, ttlSeconds)`
- `deleteCache(key)`
- `buildCacheKey(provider, endpoint, params)`

Redis cache is best-effort: if Redis is unavailable, proxy routes continue without cache instead of crashing.

Cache status:

```text
GET /health/cache
```

External proxy routes:

```text
GET /external/rawg/games/popular
GET /external/rawg/games/top-rated
GET /external/rawg/games/recent
GET /external/rawg/games/search?q=elden%20ring
GET /external/rawg/games/:id
GET /external/rawg/genres
GET /external/rawg/platforms

GET /external/steam/search?q=elden%20ring
GET /external/steam/apps/:appId
GET /external/steam/apps/:appId/store-url

GET /external/steamgriddb/search?q=elden%20ring
GET /external/steamgriddb/games/:gameId
GET /external/steamgriddb/games/:gameId/grids
GET /external/steamgriddb/games/:gameId/heroes
GET /external/steamgriddb/games/:gameId/logos
GET /external/steamgriddb/games/:gameId/icons

GET /external/scryfall/cards/search?q=sol%20ring
GET /external/scryfall/cards/random
GET /external/scryfall/cards/:id
GET /external/scryfall/sets

GET /external/anilist/search?q=Berserk&type=MANGA
GET /external/anilist/trending?type=MANGA
GET /external/anilist/popular?type=MANGA
GET /external/anilist/media/:id

GET /external/jikan/search?q=One%20Piece&type=manga
GET /external/jikan/top?type=anime
GET /external/jikan/media/:type/:id

GET /external/dnd5e/classes
GET /external/dnd5e/races
GET /external/dnd5e/spells
GET /external/dnd5e/monsters
GET /external/dnd5e/equipment
GET /external/dnd5e/rules
GET /external/dnd5e/conditions
```

RAWG should use `RAWG_API_KEY` on the backend. `VITE_RAWG_API_KEY` remains only as a frontend development fallback.

SteamGridDB requires `STEAMGRIDDB_API_KEY` on the backend. Do not expose this key with a `VITE_` prefix. `STEAM_API_KEY` is reserved for future Steam Web API features.

## Frontend Migration Status

The frontend now has prepared API clients:

- `shared/services/apiClient.ts`
- `shared/services/authClient.ts`
- `shared/services/profileClient.ts`
- `shared/services/favoritesClient.ts`

The existing local-first storage remains active. Auth, Profile, User Settings, NSFW access and Global Favorites now prefer the API when it is available, then fall back to local storage when it is offline.

Frontend token/session keys:

- `thevault.auth.token`
- `thevault.auth.session`
- legacy compatibility: `waifu-vault-user`

The Vault collections for Games, TCG, Manga and RPG now use backend storage for Backend Accounts and local storage for Local Profiles/offline fallback.

## Current Limits

- No refresh token flow yet.
- No production cookie strategy yet.
- No backend Dockerfile yet.
- No automatic local-to-backend synchronization yet.
- Prisma migrations must be created locally with `npm run prisma:migrate`.
