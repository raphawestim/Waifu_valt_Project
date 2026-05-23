import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { redis } from '../lib/redis.js';
import { getCache, setCache } from '../lib/cache.js';
import { anilistService } from '../services/anilist.service.js';
import { dnd5eService } from '../services/dnd5e.service.js';
import { jikanService } from '../services/jikan.service.js';
import { rawgService } from '../services/rawg.service.js';
import { scryfallService } from '../services/scryfall.service.js';
import { steamService } from '../services/steam.service.js';
import { steamGridDbService } from '../services/steamgriddb.service.js';

const listQuerySchema = z.object({
  page_size: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  ordering: z.string().optional(),
  genre: z.string().optional(),
  genres: z.string().optional(),
  platform: z.string().optional(),
  platforms: z.string().optional(),
});

const searchQuerySchema = listQuerySchema.extend({
  q: z.string().min(1),
  page: z.coerce.number().optional(),
});

const typeQuerySchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
});
const requiredSearchTypeQuerySchema = z.object({
  q: z.string().min(1),
  type: z.string().optional(),
});

export async function externalRoutes(app: FastifyInstance) {
  app.get('/health/cache', async () => {
    const key = 'thevault:health:cache';
    const payload = { ok: true, timestamp: new Date().toISOString() };
    await setCache(key, payload, 30);
    const readBack = await getCache<typeof payload>(key);
    return {
      ok: Boolean(readBack?.ok),
      redis: redis.status === 'ready' ? 'connected' : 'unknown',
      cache: readBack?.ok ? 'available' : 'unavailable',
    };
  });

  app.get('/external/rawg/games/popular', async (request) => rawgService.getPopularGames(listQuerySchema.parse(request.query)));
  app.get('/external/rawg/games/top-rated', async (request) => rawgService.getTopRatedGames(listQuerySchema.parse(request.query)));
  app.get('/external/rawg/games/recent', async (request) => rawgService.getRecentlyReleasedGames(listQuerySchema.parse(request.query)));
  app.get('/external/rawg/games/search', async (request) => {
    const query = searchQuerySchema.parse(request.query);
    return rawgService.searchGames(query.q, query);
  });
  app.get('/external/rawg/games/:id', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    return rawgService.getGameDetails(params.id);
  });
  app.get('/external/rawg/genres', async () => rawgService.getGenres());
  app.get('/external/rawg/platforms', async () => rawgService.getPlatforms());

  app.get('/external/steam/search', async (request) => {
    const query = z.object({ q: z.string().min(1) }).parse(request.query);
    return { apps: await steamService.searchSteamApps(query.q) };
  });
  app.get('/external/steam/apps/:appId', async (request) => {
    const params = z.object({ appId: z.string() }).parse(request.params);
    return steamService.getSteamAppDetails(params.appId);
  });
  app.get('/external/steam/apps/:appId/store-url', async (request) => {
    const params = z.object({ appId: z.string() }).parse(request.params);
    return steamService.getSteamStoreUrl(params.appId);
  });

  app.get('/external/steamgriddb/search', async (request) => {
    const query = z.object({ q: z.string().min(1) }).parse(request.query);
    return steamGridDbService.searchSteamGridDbGames(query.q);
  });
  app.get('/external/steamgriddb/games/:gameId', async (request) => {
    const params = z.object({ gameId: z.string() }).parse(request.params);
    return steamGridDbService.getSteamGridDbGame(params.gameId);
  });
  app.get('/external/steamgriddb/games/:gameId/grids', async (request) => {
    const params = z.object({ gameId: z.string() }).parse(request.params);
    return steamGridDbService.getSteamGridDbGrids(params.gameId);
  });
  app.get('/external/steamgriddb/games/:gameId/heroes', async (request) => {
    const params = z.object({ gameId: z.string() }).parse(request.params);
    return steamGridDbService.getSteamGridDbHeroes(params.gameId);
  });
  app.get('/external/steamgriddb/games/:gameId/logos', async (request) => {
    const params = z.object({ gameId: z.string() }).parse(request.params);
    return steamGridDbService.getSteamGridDbLogos(params.gameId);
  });
  app.get('/external/steamgriddb/games/:gameId/icons', async (request) => {
    const params = z.object({ gameId: z.string() }).parse(request.params);
    return steamGridDbService.getSteamGridDbIcons(params.gameId);
  });

  app.get('/external/scryfall/cards/search', async (request) => {
    const query = searchQuerySchema.parse(request.query);
    return scryfallService.searchCards(query.q, query);
  });
  app.get('/external/scryfall/cards/random', async () => scryfallService.getRandomCard());
  app.get('/external/scryfall/cards/:id', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    return scryfallService.getCardById(params.id);
  });
  app.get('/external/scryfall/sets', async () => scryfallService.getSets());

  app.get('/external/anilist/search', async (request) => {
    const query = requiredSearchTypeQuerySchema.parse(request.query);
    return anilistService.search(query.q, query.type);
  });
  app.get('/external/anilist/trending', async (request) => {
    const query = typeQuerySchema.parse(request.query);
    return anilistService.trending(query.type);
  });
  app.get('/external/anilist/popular', async (request) => {
    const query = typeQuerySchema.parse(request.query);
    return anilistService.popular(query.type);
  });
  app.get('/external/anilist/media/:id', async (request) => {
    const params = z.object({ id: z.coerce.number() }).parse(request.params);
    return anilistService.mediaDetails(params.id);
  });

  app.get('/external/jikan/search', async (request) => {
    const query = requiredSearchTypeQuerySchema.parse(request.query);
    return jikanService.search(query.q, query.type);
  });
  app.get('/external/jikan/top', async (request) => {
    const query = typeQuerySchema.parse(request.query);
    return jikanService.top(query.type);
  });
  app.get('/external/jikan/media/:type/:id', async (request) => {
    const params = z.object({ type: z.string(), id: z.string() }).parse(request.params);
    return jikanService.mediaDetails(params.type, params.id);
  });

  app.get('/external/dnd5e/classes', async () => dnd5eService.get('/classes'));
  app.get('/external/dnd5e/classes/:index', async (request) => {
    const params = z.object({ index: z.string() }).parse(request.params);
    return dnd5eService.get(`/classes/${params.index}`);
  });
  app.get('/external/dnd5e/races', async () => dnd5eService.get('/races'));
  app.get('/external/dnd5e/races/:index', async (request) => {
    const params = z.object({ index: z.string() }).parse(request.params);
    return dnd5eService.get(`/races/${params.index}`);
  });
  app.get('/external/dnd5e/spells', async (request) => {
    const query = z.object({ level: z.union([z.string(), z.number()]).optional() }).parse(request.query);
    return dnd5eService.get('/spells', query.level === undefined || query.level === 'all' ? {} : { level: query.level });
  });
  app.get('/external/dnd5e/spells/:index', async (request) => {
    const params = z.object({ index: z.string() }).parse(request.params);
    return dnd5eService.get(`/spells/${params.index}`);
  });
  app.get('/external/dnd5e/monsters', async () => dnd5eService.get('/monsters'));
  app.get('/external/dnd5e/monsters/:index', async (request) => {
    const params = z.object({ index: z.string() }).parse(request.params);
    return dnd5eService.get(`/monsters/${params.index}`);
  });
  app.get('/external/dnd5e/equipment', async () => dnd5eService.get('/equipment'));
  app.get('/external/dnd5e/equipment/:index', async (request) => {
    const params = z.object({ index: z.string() }).parse(request.params);
    return dnd5eService.get(`/equipment/${params.index}`);
  });
  app.get('/external/dnd5e/rules', async () => dnd5eService.get('/rules'));
  app.get('/external/dnd5e/conditions', async () => dnd5eService.get('/conditions'));
}
