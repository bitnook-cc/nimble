import { Router } from 'express';
import { put, del, list } from '@vercel/blob';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '../config/session';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth-service';

const router = Router();
const prisma = new PrismaClient();
const authService = new AuthService(prisma);

// Check if blob storage is configured
const isBlobStorageConfigured = !!process.env.BLOB_READ_WRITE_TOKEN;

// Middleware to require authentication
const requireAuth = async (req: any, res: any, next: any): Promise<void> => {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  // Ensure user exists in database
  const user = await authService.ensureUserExists(session);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  req.session = session;
  next();
};

// Middleware to check if blob storage is configured
const requireBlobStorage = (_req: any, res: any, next: any): void => {
  if (!isBlobStorageConfigured) {
    console.warn('[Images API] Blob storage not configured - BLOB_READ_WRITE_TOKEN is missing');
    res.status(503).json({ 
      error: 'Image storage not configured',
      message: 'Blob storage token is not configured. Images cannot be synced in this environment.'
    });
    return;
  }
  next();
};

// Upload character image
router.post('/characters/:characterId/avatar', requireAuth, requireBlobStorage, async (req, res): Promise<void> => {
  try {
    const session = req.session as SessionData;
    const userId = session.user!.id;
    const { characterId } = req.params;
    const { imageData } = req.body;

    if (!imageData) {
      res.status(400).json({ error: 'Missing image data' });
      return;
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Path structure: users/{userId}/characters/{characterId}/avatar.webp
    const pathname = `users/${userId}/characters/${characterId}/avatar.webp`;

    console.log(`[Images API] Uploading image for user ${userId}, character ${characterId}`);

    // Delete existing image if it exists
    try {
      await del(pathname);
    } catch (error) {
      // Ignore errors - image might not exist
    }

    // Upload new image
    // Note: metadata field is not supported in current version of @vercel/blob
    // We'll store metadata in the path structure instead
    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000 // 1 year cache
    });

    console.log(`[Images API] Image uploaded successfully: ${blob.url}`);

    res.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname
    });

  } catch (error) {
    console.error('[Images API] Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get character image URL
router.get('/characters/:characterId/avatar', requireAuth, requireBlobStorage, async (req, res): Promise<void> => {
  try {
    const session = req.session as SessionData;
    const userId = session.user!.id;
    const { characterId } = req.params;

    const pathname = `users/${userId}/characters/${characterId}/avatar.webp`;

    // List blobs to check if image exists
    const { blobs } = await list({
      prefix: pathname,
      limit: 1
    });

    if (blobs.length === 0) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    const blob = blobs[0];
    
    res.json({
      url: blob.url,
      pathname: blob.pathname
    });

  } catch (error) {
    console.error('[Images API] Get error:', error);
    res.status(500).json({ 
      error: 'Failed to get image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete character image
router.delete('/characters/:characterId/avatar', requireAuth, requireBlobStorage, async (req, res): Promise<void> => {
  try {
    const session = req.session as SessionData;
    const userId = session.user!.id;
    const { characterId } = req.params;

    const pathname = `users/${userId}/characters/${characterId}/avatar.webp`;

    console.log(`[Images API] Deleting image for user ${userId}, character ${characterId}`);

    await del(pathname);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('[Images API] Delete error:', error);
    res.status(500).json({ 
      error: 'Failed to delete image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// List all character images for a user
router.get('/characters/avatars', requireAuth, requireBlobStorage, async (req, res): Promise<void> => {
  try {
    const session = req.session as SessionData;
    const userId = session.user!.id;

    const prefix = `users/${userId}/characters/`;

    console.log(`[Images API] Listing images for user ${userId}`);

    const { blobs } = await list({
      prefix,
      limit: 100
    });

    const images = blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      characterId: blob.pathname.split('/')[3] // Extract character ID from path
    }));

    res.json({
      images,
      count: images.length
    });

  } catch (error) {
    console.error('[Images API] List error:', error);
    res.status(500).json({ 
      error: 'Failed to list images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;