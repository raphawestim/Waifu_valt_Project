import type { Plugin } from 'vite';

interface IgdbPluginOptions {
  clientId?: string;
  clientSecret?: string;
}

interface IgdbTokenResponse {
  access_token: string;
  expires_in: number;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getIgdbToken(clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.value;
  }

  const tokenUrl = new URL('https://id.twitch.tv/oauth2/token');
  tokenUrl.searchParams.set('client_id', clientId);
  tokenUrl.searchParams.set('client_secret', clientSecret);
  tokenUrl.searchParams.set('grant_type', 'client_credentials');

  const response = await fetch(tokenUrl.toString(), { method: 'POST' });
  if (!response.ok) throw new Error('IGDB authentication failed.');

  const payload = (await response.json()) as IgdbTokenResponse;
  cachedToken = {
    value: payload.access_token,
    expiresAt: now + payload.expires_in * 1000,
  };
  return payload.access_token;
}

async function queryIgdb(clientId: string, clientSecret: string, endpoint: string, body: string): Promise<unknown> {
  const token = await getIgdbToken(clientId, clientSecret);
  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'text/plain',
    },
    body,
  });

  if (!response.ok) throw new Error('IGDB request failed.');
  return response.json();
}

export function igdbPlugin(options: IgdbPluginOptions): Plugin {
  return {
    name: 'igdb-secure-bridge',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/igdb/')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json');

        const clientId = options.clientId || process.env.VITE_IGDB_CLIENT_ID;
        const clientSecret = options.clientSecret || process.env.IGDB_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          res.statusCode = 501;
          res.end(JSON.stringify({ error: 'IGDB bridge is not configured.' }));
          return;
        }

        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const path = url.pathname.replace('/api/igdb/', '');

          if (path === 'search-games') {
            const query = (url.searchParams.get('q') || '').replace(/["\\]/g, ' ').trim();
            if (!query) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Query is required.' }));
              return;
            }

            const data = await queryIgdb(
              clientId,
              clientSecret,
              'games',
              `search "${query}"; fields name,slug,first_release_date,cover.url,total_rating,genres.name,platforms.name,summary,url; limit 12;`,
            );
            res.end(JSON.stringify(data));
            return;
          }

          if (path.startsWith('game/')) {
            const id = Number(path.replace('game/', ''));
            if (!Number.isFinite(id)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid game id.' }));
              return;
            }

            const data = await queryIgdb(
              clientId,
              clientSecret,
              'games',
              `fields name,slug,first_release_date,cover.url,total_rating,genres.name,platforms.name,summary,url,websites.url; where id = ${id}; limit 1;`,
            );
            res.end(JSON.stringify(data));
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Not found.' }));
        } catch {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: 'IGDB bridge request failed.' }));
        }
      });
    },
  };
}
