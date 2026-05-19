import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { comfyuiPlugin } from './comfyui-plugin';
import { nhentaiPlugin } from './nhentai-plugin';
import r34videoPlugin from './r34video-plugin';
import hhPlugin from './hh-plugin';
import { prismaPlugin } from './prisma-plugin';
import { ehentaiPlugin } from './ehentai-plugin';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), comfyuiPlugin(), nhentaiPlugin(env.NHENTAI_API_KEY), r34videoPlugin(), hhPlugin(), ehentaiPlugin(), prismaPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.NHENTAI_API_KEY': JSON.stringify(env.NHENTAI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
