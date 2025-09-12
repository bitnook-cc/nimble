import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '../config/session';
import { CharacterSyncService } from '../services/character-sync-service';

const router = Router();

// Create a single instance of the service with Prisma client
const prisma = new PrismaClient();
const syncService = new CharacterSyncService(prisma);

// Middleware to require authentication
const requireAuth = async (req: any, res: any, next: any): Promise<void> => {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.session = session;
  next();
};

// Sync characters - handles both upload and merge
router.post('/characters', requireAuth, async (req, res): Promise<void> => {
  try {
    const session = req.session as SessionData;
    const userId = session.user!.id;
    const { characters } = req.body;

    const result = await syncService.syncCharacters(userId, characters);
    res.json(result);

  } catch (error) {
    console.error('Sync error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Character limit exceeded')) {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message.includes('Invalid request')) {
        res.status(400).json({ error: error.message });
        return;
      }
    }
    
    res.status(500).json({ error: 'Failed to sync characters' });
  }
});

// Get sync status
router.get('/status', requireAuth, async (req, res): Promise<void> => {
  try {
    const session = req.session as SessionData;
    const userId = session.user!.id;

    const status = await syncService.getSyncStatus(userId);
    res.json(status);

  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// Delete a character backup
router.delete('/characters/:characterId', requireAuth, async (req, res): Promise<void> => {
  try {
    const session = req.session as SessionData;
    const userId = session.user!.id;
    const { characterId } = req.params;

    await syncService.deleteCharacterBackup(userId, characterId);
    res.json({ success: true });

  } catch (error) {
    if ((error as any).code === 'P2025') {
      res.status(404).json({ error: 'Character backup not found' });
      return;
    }
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete character backup' });
  }
});

export default router;