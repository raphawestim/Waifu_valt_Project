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
| Portal | Active | Registry-driven Vault selection with auth menu and locked NSFW card when logged out. |
| Global Profile | Beta | Local-first profile summary, global favorites and NSFW settings. |
| Vault Games | Active | RAWG discovery, search and user library foundation. |
| Vault TCG | Beta | Scryfall cards, carousel/gallery and deck builder MVP. |
| Vault Manga / Anime | Active | AniList/Jikan-oriented discovery and library foundation. |
| Vault D&D / RPG | Beta | D&D 5e API sections and local character/campaign storage. |
| Vault Forge / Prompt Lab | Planned | Route and product shell are ready; AI implementation is future work. |
| Vault NSFW | Active | Existing internal area preserved, with updated branding and profile-based gate. |
| Backend | Planned | Fastify/Prisma/PostgreSQL/Redis not implemented yet. |

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
- Local user game library.

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
- Deck persistence by user.
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
- User manga library statuses.
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

Create `.env.local` for local frontend variables and keep it out of git.

```bash
VITE_RAWG_API_KEY=
VITE_IGDB_CLIENT_ID=
VITE_API_URL=http://localhost:3333
```

Future backend variables:

```bash
DATABASE_URL=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
REDIS_URL=
RAWG_API_KEY=
IGDB_CLIENT_SECRET=
JWT_SECRET=
CORS_ORIGIN=http://localhost:3000
```

An `.env.example` should be added when the backend phase starts.

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
| RAWG | Games | Active | Uses `VITE_RAWG_API_KEY` in frontend until backend proxy exists. |
| IGDB | Games | Planned | Requires backend bridge; never expose client secret in frontend. |
| Scryfall | TCG | Active | Used for Magic card search/gallery/deck builder. |
| APITCG | TCG | Planned | Future multi-TCG adapter. |
| AniList | Manga / Anime | Active/Beta | Metadata and cover discovery. |
| Jikan | Manga / Anime | Beta | Metadata fallback/search. |
| MangaDex | Manga / Anime | Planned/Beta | Use carefully, respect API rules. |
| Kitsu | Manga / Anime | Planned | Future metadata source. |
| D&D 5e API | RPG | Active/Beta | Classes, races, spells, monsters and equipment. |
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

### Phase 3 - Vault Games with RAWG

- [x] Add RAWG service and discovery UI.
- [x] Add user game library foundation.
- [x] Add game status selector and details modal.
- [ ] Move RAWG key usage behind backend proxy.
- [ ] Add IGDB backend bridge.

### Phase 4 - Vault TCG with Scryfall

- [x] Add Scryfall card loading.
- [x] Add card carousel/gallery.
- [x] Add deck builder MVP.
- [x] Add deck rules registry.
- [ ] Add dedicated deck list/detail pages.
- [ ] Add advanced filters and pagination.

### Phase 5 - Vault Manga / Anime

- [x] Add cover-first manga/anime home.
- [x] Add library status model.
- [x] Add AniList/Jikan-oriented search foundation.
- [ ] Add dedicated title details route.
- [ ] Add safe reader flow for permitted sources.

### Phase 6 - Vault D&D / RPG

- [x] Add D&D 5e API service.
- [x] Add character builder MVP.
- [x] Add campaign creator MVP.
- [x] Add spellbook/bestiary/equipment sections.
- [ ] Add detail pages for characters and campaigns.

### Phase 7 - Docker, Backend and Database

- [ ] Add Docker Compose for PostgreSQL, Redis and Adminer.
- [ ] Add Fastify API in `apps/api`.
- [ ] Add Prisma schema and migrations.
- [ ] Add auth endpoints.
- [ ] Add profile/library/favorites endpoints.

### Phase 8 - Real User Persistence

- [ ] Add API client with online/offline backend detection.
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

The future backend will use:

- Fastify
- TypeScript
- Prisma
- PostgreSQL
- Redis
- Zod
- JWT or httpOnly cookie auth
- Docker Compose for local infrastructure

Initial services:

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
- `GET /me/nsfw-consent`
- `POST /me/nsfw-consent`

---

## Limitations

- Auth is currently MVP/local-first, not production authentication.
- Backend, PostgreSQL, Redis and Prisma are not implemented yet.
- Some user collections still rely on local storage.
- Vault Forge is a planned shell, not an operational AI workspace yet.
- IGDB must wait for a backend bridge because its client secret must never reach the frontend.
- RAWG may still use a frontend `VITE_RAWG_API_KEY` in local development.
- The NSFW internal area is intentionally preserved to avoid breaking existing behavior.

---

## License

License has not been finalized yet. Add a license before public distribution.
