import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required for the API.'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173'),
  RAWG_API_KEY: z.string().optional(),
  VITE_IGDB_CLIENT_ID: z.string().optional(),
  IGDB_CLIENT_SECRET: z.string().optional(),
  STEAMGRIDDB_API_KEY: z.string().optional(),
  STEAM_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
  throw new Error(`Invalid API environment:\n${message}`);
}

const jwtSecret = parsed.data.JWT_SECRET || 'dev-only-the-vault-secret-change-me';

if (!parsed.data.JWT_SECRET && parsed.data.NODE_ENV !== 'production') {
  console.warn('[the-vault-api] JWT_SECRET missing. Using development-only fallback.');
}

if (!parsed.data.JWT_SECRET && parsed.data.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production.');
}

export const env = {
  ...parsed.data,
  JWT_SECRET: jwtSecret,
};
