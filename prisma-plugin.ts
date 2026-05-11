import { Plugin } from 'vite';
import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

const UPLOADS_DIR = path.resolve(process.cwd(), 'public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

export function prismaPlugin(): Plugin {
  return {
    name: 'waifu-vault-prisma-api',
    configureServer(server) {
      const app = express();
      app.use(express.json());

      // Login / Get User
      app.post('/api/user/login', async (req, res) => {
        const { username } = req.body;
        if (!username) return res.status(400).json({ error: 'Username required' });

        let user = await prisma.user.findUnique({
          where: { username },
          include: { favorites: true }
        });

        if (!user) {
          user = await prisma.user.create({
            data: { username },
            include: { favorites: true }
          });
        }
        res.json(user);
      });

      // Update User Profile (Avatar & Username & Blacklist)
      app.post('/api/user/update', upload.single('avatar'), async (req, res) => {
        const { id, newUsername, blacklistTags } = req.body;
        const file = req.file;

        if (!id) return res.status(400).json({ error: 'User ID required' });

        const updateData: any = {};
        if (newUsername) updateData.username = newUsername;
        if (blacklistTags !== undefined) updateData.blacklistTags = blacklistTags;
        if (file) {
          updateData.avatar_url = `/uploads/${file.filename}`;
        }

        try {
          const user = await prisma.user.update({
            where: { id },
            data: updateData,
            include: { favorites: true }
          });
          res.json(user);
        } catch (e) {
          res.status(500).json({ error: 'Update failed', details: e });
        }
      });

      // Favorites
      app.post('/api/favorites/add', async (req, res) => {
        const { userId, image } = req.body;
        try {
          const favorite = await prisma.favorite.create({
            data: {
              userId,
              imageId: image.id,
              thumbnailUrl: image.thumbnailUrl,
              fullUrl: image.fullUrl,
              tags: image.tags.join(','),
              score: image.score || 0,
              artist: image.artist || '',
              sourceApi: image.sourceApi,
              rating: image.rating,
              width: image.width || 0,
              height: image.height || 0,
              type: image.type
            }
          });
          res.json(favorite);
        } catch (e) {
          res.status(500).json({ error: 'Failed to add favorite' });
        }
      });

      app.post('/api/favorites/remove', async (req, res) => {
        const { userId, imageId } = req.body;
        try {
          await prisma.favorite.delete({
            where: {
              userId_imageId: { userId, imageId }
            }
          });
          res.json({ success: true });
        } catch (e) {
          res.status(500).json({ error: 'Failed to remove favorite' });
        }
      });

      server.middlewares.use(app);
    }
  };
}
