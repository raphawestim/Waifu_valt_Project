import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { comfyuiPlugin } from './comfyui-plugin';
import { nhentaiPlugin } from './nhentai-plugin';
import r34videoPlugin from './r34video-plugin';
import hhPlugin from './hh-plugin';
import { prismaPlugin } from './prisma-plugin';
import { ehentaiPlugin } from './ehentai-plugin';
import { igdbPlugin } from './igdb-plugin';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), comfyuiPlugin(), nhentaiPlugin(env.NHENTAI_API_KEY), r34videoPlugin(), hhPlugin(), ehentaiPlugin(), prismaPlugin(), igdbPlugin({ clientId: env.VITE_IGDB_CLIENT_ID, clientSecret: env.IGDB_CLIENT_SECRET })],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.NHENTAI_API_KEY': JSON.stringify(env.NHENTAI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              const normalizedId = id.replace(/\\/g, '/');
              if (normalizedId.includes('node_modules')) {
                if (normalizedId.includes('/react/') || normalizedId.includes('/react-dom/')) return 'vendor-react';
                return 'vendor';
              }
              if (normalizedId.includes('/areas/games/')) return 'vault-games';
              if (normalizedId.includes('/areas/tcg/')) return 'vault-tcg';
              if (normalizedId.includes('/areas/manga/')) return 'vault-manga';
              if (normalizedId.includes('/areas/rpg/')) return 'vault-rpg';
              if (normalizedId.includes('/areas/forge/')) return 'vault-forge';
              if (normalizedId.includes('/areas/profile/')) return 'profile';
              if (normalizedId.includes('/areas/portal/')) return 'portal';
              if (normalizedId.includes('/features/nsfwGate/')) return 'nsfw-gate';
              if (normalizedId.includes('/components/PromptLab/') || normalizedId.includes('/components/VaultChat/') || normalizedId.includes('/components/AI/')) return 'ai-tools';
              if (
                normalizedId.includes('/components/NHentai') ||
                normalizedId.includes('/components/EHentai') ||
                normalizedId.includes('/components/R34Video') ||
                normalizedId.includes('/components/HHView') ||
                normalizedId.includes('/components/MangaReaderModal')
              ) {
                return 'nsfw-media';
              }
              return undefined;
            },
          },
        },
      }
    };
});
