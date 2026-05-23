# The Vault

![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=111)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=fff)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=fff)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Utility_UI-06B6D4?logo=tailwindcss&logoColor=fff)
![Local First](https://img.shields.io/badge/Storage-Local_First-10B981)
![NSFW Gate](https://img.shields.io/badge/NSFW-Protected-DC2626)
![Roadmap](https://img.shields.io/badge/Roadmap-Fastify%20%2B%20Prisma%20%2B%20PostgreSQL-7C3AED)

**The Vault** is a modular personal command center for games, TCG decks, manga/anime discovery, D&D/RPG tools, AI prompt workflows, private media browsing and a global user profile.

The project started as a single adult media workspace and is being refactored into a broader ecosystem of isolated Vaults. The current frontend is built with **React**, **TypeScript**, **Vite** and **TailwindCSS**, with a local-first persistence layer that is prepared for a future backend using **Fastify**, **Prisma**, **PostgreSQL**, **Redis** and Docker Compose.

> Security note: API keys and secrets must not be committed. Any secrets previously shared in chat should be treated as compromised and rotated before production use.

![The Vault Portal](docs/screenshots/the-vault-portal.svg)

---

## Table of Contents

- [Product Overview](#product-overview)
- [Current Status](#current-status)
- [Vaults](#vaults)
- [Architecture](#architecture)
- [Security Model](#security-model)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Local Infrastructure with Docker](#local-infrastructure-with-docker)
- [Backend API](#backend-api)
- [Performance](#performance)
- [Manual Testing](#manual-testing)
- [Project Structure](#project-structure)
- [External APIs](#external-apis)
- [Roadmap](#roadmap)
- [Backend Plan](#backend-plan)
- [Limitations](#limitations)

---

## Product Overview

The Vault is designed as a premium, dark, modular dashboard where each area has its own identity but shares a common profile, navigation model and persistence strategy.

Core product pillars:

- **Portal-first navigation**: users start at `/` and choose a Vault.
- **Global profile**: one account/profile view for libraries, favorites, settings and NSFW access.
- **Local-first persistence**: collections work through local storage today and are structured for backend migration.
- **Protected adult area**: Vault NSFW is separate and gated by login, profile permission, adult confirmation and terms acceptance.
- **API-first Vaults**: RAWG, Scryfall, AniList/Jikan/MangaDex, D&D 5e API and future IGDB integrations live behind modular services.
- **Future AI workspace**: Vault Forge is reserved for Prompt Lab, Vault Chat, Ollama, ComfyUI and prompt template tooling.

---

## Current Status

| Area | Status | Notes |
| --- | --- | --- |
| Portal | Active | Registry-driven Vault selection with auth menu and NSFW state synced to profile permissions. |
| Auth MVP | Beta | Uses the Fastify backend when available, keeps the local/mock fallback when offline. |
| Global Profile | Beta | Profile, settings, NSFW access and global favorites prefer backend data with local fallback. |
| Vault Games | Active | RAWG discovery, backend/local library, Steam enhancement, SteamGridDB artwork metadata and global favorites. |
| Vault TCG | Beta | Scryfall cards, carousel/gallery, deck builder MVP and backend/local deck storage. |
| Vault Manga / Anime | Active | AniList/Jikan discovery, backend/local library, statuses, favorites and reading progress foundation. |
| Vault D&D / RPG | Beta | D&D 5e API sections plus backend/local characters, campaigns and sessions. |
| Vault Forge / Prompt Lab | Planned | Route and product shell are ready; AI implementation is future work. |
| Vault NSFW | Active | Existing internal area preserved, with updated branding and profile-based gate. |
| Local Infrastructure | Active | Docker Compose provides PostgreSQL, Redis and Adminer for the upcoming backend phase. |
| Backend | Beta | Fastify API, Prisma, JWT auth, protected collection endpoints, external API proxies and Redis cache. |
| Frontend Performance | Active | Route-level lazy loading and Vite manual chunks split Vaults into separate bundles. |

---

## Vaults

### Vault Games

Route: `/games`

Purpose:

- Discover games using RAWG.
- Track backlog, wishlist, playing, finished, completed and platinum status.
- Save games into a personal library.
- Prepare for IGDB through a backend bridge.

Current capabilities:

- Popular games.
- Recently released and trending sections.
- Game search.
- Game details modal.
- Backend/local hybrid user game library.
- Status tracking, notes and favorite sync to the global profile.
- Optional Steam app linking through the backend.
- Optional SteamGridDB artwork selection stored as metadata URLs.

### Vault TCG

Route: `/tcg`

Purpose:

- Search and browse trading cards.
- Build decks.
- Validate basic deck rules.
- Prepare for Scryfall, APITCG and future Pokémon TCG support.

Current capabilities:

- Scryfall card loading.
- Card carousel/gallery.
- Left deck builder sidebar on desktop.
- Backend/local hybrid deck persistence by user.
- Basic deck rule registry and validation.

### Vault Manga / Anime

Route: `/manga`

Purpose:

- Discover manga/anime metadata.
- Browse covers.
- Save reading list and favorites.
- Prepare for safe reading routes when sources allow it.

Current capabilities:

- Cover-first discovery.
- Search/library foundation.
- Backend/local hybrid user manga library statuses and progress.
- Safe-source policy in architecture.

### Vault D&D / RPG

Route: `/rpg`

Purpose:

- Build characters.
- Create campaigns.
- Browse classes, races, spells, monsters, equipment and rules from the D&D 5e API.
- Prepare future local AI Dungeon Master flows.

Current capabilities:

- D&D 5e service layer.
- Character builder MVP.
- Campaign creator MVP.
- Backend/local hybrid characters, campaigns and sessions.
- Spellbook, bestiary and equipment sections.

### Vault Forge / Prompt Lab

Route: `/forge`

Purpose:

- Centralize Prompt Lab, Vault Chat, ComfyUI and Ollama workflows.
- Save prompt history.
- Convert prompts across model families.
- Manage local performance constraints.

Current status:

- Product shell and route exist.
- AI execution is planned for a later phase.

Planned prompt presets:

- SDXL
- Pony
- Illustrious
- Animagine
- FLUX
- Z-Image
- Z-Image Turbo
- Anime Generic
- Realistic Generic
- Custom

### Vault NSFW

Route: `/nsfw`

Purpose:

- Preserve the existing adult Vault experience.
- Keep adult content isolated from SFW Vaults.
- Enforce login, profile permission, +18 confirmation and terms acceptance.

Access rules:

- User must be logged in.
- User must enable Vault NSFW access in the profile.
- User must confirm being 18+.
- User must accept Terms of Use and Privacy Policy.
- Acceptance is persisted using the current terms version.

---

## Architecture

The app currently runs as a frontend-first Vite application with modular areas:

- `areas/portal` for the main product portal.
- `areas/profile` for the global user profile.
- `areas/games` for RAWG/game library features.
- `areas/tcg` for Scryfall/deck builder features.
- `areas/manga` for manga/anime discovery.
- `areas/rpg` for D&D/RPG tools.
- `areas/forge` for future AI creative workflows.
- `features/nsfwGate` for NSFW access control.
- `shared` for common UI, auth menu and storage utilities.
- `services` for global services such as user profile persistence.
- `data/vaultRegistry.ts` for centralized Vault metadata.

The repository has not yet been moved into a monorepo layout. The planned future layout is:

```txt
apps/
  web/      React + Vite + TailwindCSS
  api/      Fastify + Prisma + Redis

packages/
  types/
  validators/
  config/
```

---

## Security Model

### Secrets

- Never hardcode API keys or secrets.
- Never commit `.env` or `.env.local`.
- `IGDB_CLIENT_SECRET` must only exist server-side.
- `RAWG_API_KEY` should preferably be proxied through the backend in production.
- Frontend-only RAWG usage may use `VITE_RAWG_API_KEY` for local development.

### NSFW

Vault NSFW is protected at the entry point and direct URL access:

```ts
isAuthenticated &&
settings.nsfwAccessEnabled &&
settings.nsfwTermsAccepted &&
settings.nsfwTermsVersion === CURRENT_NSFW_TERMS_VERSION
```

Current terms version:

```ts
CURRENT_NSFW_TERMS_VERSION = "1.0"
```

### External APIs

- Respect API rate limits.
- Use debounce and cache where possible.
- Do not bypass Cloudflare.
- Do not bypass paywalls.
- Do not implement aggressive scraping.
- Manga reader features must use only permitted APIs/sources.

---

## Environment Variables

Create `.env.local` or `.env` for local variables and keep real secrets out of git. Use `.env.example` as the safe template.

```bash
POSTGRES_USER=thevault
POSTGRES_PASSWORD=thevault_password
POSTGRES_DB=thevault_db
DATABASE_URL=postgresql://thevault:thevault_password@localhost:5432/thevault_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=change_me
CORS_ORIGIN=http://localhost:3000

VITE_RAWG_API_KEY=
RAWG_API_KEY=
VITE_IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=
STEAMGRIDDB_API_KEY=
STEAM_API_KEY=
VITE_API_URL=http://localhost:3333
```

Do not commit `.env`, `.env.local` or `.env.*.local`.

---

## Installation

```bash
npm install
```

---

## Running Locally

Development server:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

---

## Local Infrastructure with Docker

Docker is currently used only for local infrastructure. The React/Vite frontend and Fastify backend still run locally.

Services:

- PostgreSQL 16 on `localhost:5432`
- Redis 7 on `localhost:6379`
- Adminer on `http://localhost:8080`

Quick start:

```bash
docker compose up -d
```

Stop:

```bash
docker compose down
```

See the full guide in [docs/docker.md](docs/docker.md).

Next planned infrastructure step: gradual frontend migration from local storage to the Fastify API.

---

## Backend API

The first real backend lives in `apps/api` and uses Fastify, Prisma, PostgreSQL, Redis, Zod, JWT and bcryptjs.

Backend guide:

- [docs/backend.md](docs/backend.md)

Common commands:

```bash
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run api:dev
```

API URL:

```text
http://localhost:3333
```

Health check:

```text
GET /health
```

Implemented endpoint groups:

- Auth: `/auth/register`, `/auth/login`, `/auth/me`
- Profile/settings/NSFW: `/users/me`, `/users/me/settings`, `/users/me/nsfw`
- Favorites: `/me/favorites`
- Games: `/me/games`
- TCG decks/cards: `/me/decks`
- Manga / Anime library: `/me/manga`
- RPG characters, campaigns and sessions: `/me/rpg/...`
- External API proxies/cache: `/external/rawg/...`, `/external/steam/...`, `/external/steamgriddb/...`, `/external/scryfall/...`, `/external/anilist/...`, `/external/jikan/...`, `/external/dnd5e/...`

The frontend now uses the backend for Auth, Profile, User Settings, NSFW access, Global Favorites and migrated Vault libraries when the API is reachable. Local storage remains as the offline fallback.

Frontend backend state:

- Token key: `thevault.auth.token`
- Session key: `thevault.auth.session`
- Legacy session key still supported: `waifu-vault-user`
- Backend health: `GET /health`
- Cache health: `GET /health/cache`

External proxy examples:

```text
GET http://localhost:3333/external/rawg/games/popular
GET http://localhost:3333/external/steam/search?q=elden%20ring
GET http://localhost:3333/external/steamgriddb/search?q=elden%20ring
GET http://localhost:3333/external/scryfall/cards/search?q=sol%20ring
GET http://localhost:3333/external/dnd5e/classes
GET http://localhost:3333/external/anilist/search?q=Berserk&type=MANGA
```

RAWG should use `RAWG_API_KEY` in the backend. `VITE_RAWG_API_KEY` remains a development fallback only.

---

## Performance

The frontend uses route-level code splitting to keep the portal and initial shell light.

Current split strategy:

- Main Vault routes are loaded with `React.lazy` and `Suspense`.
- `RouteLoadingState` provides a dark premium loading state instead of a blank screen.
- Vite `manualChunks` separates `vendor-react`, `portal`, `profile`, `vault-games`, `vault-tcg`, `vault-manga`, `vault-rpg`, `vault-forge`, `nsfw-gate`, `nsfw-media` and `ai-tools`.
- Heavy NSFW modals and media views mount only when needed.

Latest build result:

- Main app chunk: about 51 kB.
- Largest isolated chunk: `vendor-react`, about 190 kB.
- The previous Vite warning for chunks larger than 500 kB has been removed without raising the warning limit.

---

## Manual Testing

### Portal and navigation

1. Open `/`.
2. Confirm the portal shows:
   - Vault Games
   - Vault TCG
   - Vault Manga / Anime
   - Vault D&D / RPG
   - Vault Forge / Prompt Lab
   - Vault NSFW
3. Click each SFW Vault and confirm the route changes correctly.
4. Confirm each Vault has a Back to Main Menu button.

### Auth and profile

1. Open `/login` or `/register`.
2. Enter a local username.
3. Confirm `/profile` opens.
4. Confirm the profile shows Vault summaries, global favorites and NSFW settings.
5. Reload the browser and confirm the session persists.
6. Use Logout from the portal/profile and confirm Login/Register return.

### NSFW access

1. Log out.
2. Open `/`.
3. Confirm Vault NSFW appears locked and cannot be clicked.
4. Open `/nsfw` directly.
5. Confirm the app returns to the portal and shows the access modal.
6. Log in.
7. Open `/profile`.
8. Enable Vault NSFW access and accept +18/terms.
9. Open `/nsfw` again.
10. Confirm it enters without repeating the warning.
11. Disable NSFW access in profile.
12. Confirm `/nsfw` is blocked again.

### Branding

Search visible UI/code for old names:

```bash
rg "WaifuVault|Waifu Vault|Waifu Valt|The Valt|Vault Gallery|No Waifus|WaifuLover"
```

The main UI should use **The Vault**, **Vault NSFW** or **The Vault NSFW**.

---

## Project Structure

Current relevant structure:

```txt
.
├─ App.tsx
├─ areas/
│  ├─ auth/
│  ├─ forge/
│  ├─ games/
│  ├─ manga/
│  ├─ portal/
│  ├─ profile/
│  ├─ rpg/
│  └─ tcg/
├─ components/
├─ data/
│  └─ vaultRegistry.ts
├─ docs/
│  └─ screenshots/
├─ features/
│  └─ nsfwGate/
├─ services/
│  └─ userProfileService.ts
├─ shared/
│  ├─ auth/
│  ├─ components/
│  └─ storage/
├─ types/
└─ vite.config.ts
```

---

## External APIs

| API | Vault | Status | Notes |
| --- | --- | --- | --- |
| RAWG | Games | Active | Prefer backend proxy with `RAWG_API_KEY`; `VITE_RAWG_API_KEY` remains a dev fallback. |
| Steam Store API | Games | Beta | Backend proxy for app search/details/store URLs; no SteamDB scraping. |
| SteamGridDB | Games | Beta | Backend-only `STEAMGRIDDB_API_KEY`; artwork URLs saved in game metadata. |
| IGDB | Games | Planned | Requires backend bridge; never expose client secret in frontend. |
| Scryfall | TCG | Active | Backend proxy + Redis cache, with direct frontend fallback. |
| APITCG | TCG | Planned | Future multi-TCG adapter. |
| AniList | Manga / Anime | Active/Beta | Backend proxy + Redis cache, with direct frontend fallback. |
| Jikan | Manga / Anime | Beta | Backend proxy + Redis cache, with direct frontend fallback. |
| MangaDex | Manga / Anime | Planned/Beta | Use carefully, respect API rules. |
| Kitsu | Manga / Anime | Planned | Future metadata source. |
| D&D 5e API | RPG | Active/Beta | Backend proxy + Redis cache, with direct frontend fallback. |
| Ollama | Forge | Planned | Local AI chat/prompt generation. |
| ComfyUI | Forge | Planned | Local generation/workflow UI. |

---

## Roadmap

### Phase 1 - Organization, Branding and Navigation

- [x] Rename visible product identity to The Vault.
- [x] Create portal with modular Vault cards.
- [x] Add centralized `vaultRegistry`.
- [x] Add Back to Main Menu button.
- [x] Add Vault Forge route shell.

### Phase 2 - Global Profile, Login and NSFW Control

- [x] Add login/register MVP.
- [x] Add global profile page.
- [x] Add global user settings.
- [x] Add NSFW profile settings.
- [x] Protect Vault NSFW with profile-based access control.
- [x] Add global favorites foundation.
- [x] Add local auth/session keys prepared for backend migration.
- [x] Add privacy mode and hide-NSFW portal setting.

### Phase 3 - Vault Games with RAWG

- [x] Add RAWG service and discovery UI.
- [x] Add user game library foundation.
- [x] Add game status selector and details modal.
- [x] Add debounced RAWG search.
- [x] Add dedicated local `thevault.userGames` storage.
- [x] Sync favorited games into global favorites.
- [x] Add RAWG API key fallback state and `.env.example`.
- [x] Move RAWG key usage behind backend proxy with frontend dev fallback.
- [ ] Add IGDB backend bridge.

### Phase 4 - Vault TCG with Scryfall

- [x] Add Scryfall card loading.
- [x] Add card carousel/gallery.
- [x] Add searchable card gallery with basic Scryfall filters.
- [x] Add deck builder MVP with active deck sidebar.
- [x] Add deck rules registry.
- [x] Add local deck storage in `thevault.userDecks:{userId}`.
- [x] Sync favorited cards and decks into global favorites.
- [x] Add card details modal and load-more pagination.
- [ ] Add dedicated deck list/detail pages.
- [ ] Add advanced deck editor routes and mobile drawer polish.

### Phase 5 - Vault Manga / Anime

- [x] Add cover-first manga/anime home.
- [x] Add library status model.
- [x] Add AniList GraphQL search/trending/details foundation.
- [x] Add Jikan REST search/top/details foundation.
- [x] Add MangaDex metadata/chapter discovery adapter.
- [x] Add local manga/anime storage in `thevault.userManga:{userId}`.
- [x] Sync favorite manga/anime into global favorites.
- [x] Add details modal with status, notes and reading progress.
- [x] Add library filters for status, type, source, favorites and local search.
- [ ] Add dedicated title details route.
- [ ] Add safe reader flow for permitted sources.

### Phase 6 - Vault D&D / RPG

- [x] Add D&D 5e API service.
- [x] Add character builder MVP.
- [x] Add campaign creator MVP.
- [x] Add spellbook/bestiary/equipment sections.
- [x] Add local RPG storage in `thevault.userRpgCharacters:{userId}`, `thevault.userRpgCampaigns:{userId}` and `thevault.userRpgSessions:{userId}`.
- [x] Sync favorite characters and campaigns into global favorites.
- [x] Add D&D 5e conditions/rules compendium preview.
- [x] Add campaign session notes.
- [ ] Add detail pages for characters and campaigns.
- [ ] Add dedicated RPG subroutes with full-page views.

### Phase 7 - Docker, Backend and Database

- [x] Add Docker Compose for PostgreSQL, Redis and Adminer.
- [x] Add Docker infrastructure documentation.
- [x] Add Docker helper scripts.
- [x] Add Fastify API in `apps/api`.
- [x] Add Prisma schema.
- [x] Add auth endpoints.
- [x] Add profile/library/favorites endpoints.
- [x] Add local API clients for future frontend migration.
- [ ] Commit initial Prisma migration after running PostgreSQL locally.

### Phase 8 - Real User Persistence

- [x] Add API client with online/offline backend detection.
- [x] Migrate Auth/Profile/Settings/NSFW/Favorites to backend with local fallback.
- [ ] Sync local collections to backend.
- [ ] Keep local fallback when backend is unavailable.

### Phase 9 - Vault Forge / AI

- [ ] Implement Prompt Lab route.
- [ ] Implement Vault Chat route.
- [ ] Add Ollama service.
- [ ] Add ComfyUI status/iframe integration.
- [ ] Add performance manager for RAM/VRAM protection.
- [ ] Add prompt template engine.

### Phase 10 - Markdown, Tags, Search and Command Palette

- [ ] Add Markdown document model.
- [ ] Add safe Markdown preview.
- [ ] Add universal tags.
- [ ] Add global search.
- [ ] Add command palette with `Ctrl + K`.

---

## Backend Plan

The backend uses:

- Fastify
- TypeScript
- Prisma
- PostgreSQL
- Redis
- Zod
- JWT auth in the MVP
- Docker Compose for local infrastructure

Local infrastructure services:

- `postgres`
- `redis`
- `adminer`

Initial API routes:

- `GET /health`
- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `GET /users/me`
- `PATCH /users/me/settings`
- `GET /me/games`
- `POST /me/games`
- `GET /me/decks`
- `POST /me/decks`
- `GET /me/manga`
- `POST /me/manga`
- `GET /me/rpg/characters`
- `POST /me/rpg/characters`
- `GET /me/favorites`
- `POST /me/favorites`
- `GET /users/me/nsfw`
- `POST /users/me/nsfw/enable`
- `POST /users/me/nsfw/disable`

See [docs/backend.md](docs/backend.md) for payload examples and operational notes.

---

## Limitations

- Auth uses backend JWT when available, but it is still MVP authentication, not production-grade auth.
- Backend, Prisma schema and protected collection endpoints exist, but Games/TCG/Manga/RPG Vault data still uses local storage by default.
- PostgreSQL, Redis and Adminer exist as local Docker infrastructure and are used by the backend when it is running.
- Some user collections still rely on local storage.
- Vault Forge is a planned shell, not an operational AI workspace yet.
- IGDB must wait for a backend bridge because its client secret must never reach the frontend.
- RAWG may still use a frontend `VITE_RAWG_API_KEY` in local development.
- The NSFW internal area is intentionally preserved to avoid breaking existing behavior.

---

## License

License has not been finalized yet. Add a license before public distribution.
