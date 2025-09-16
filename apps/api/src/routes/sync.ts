import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "../config/session";
import { CharacterSyncService } from "../services/character-sync-service";
import { AuthService } from "../services/auth-service";
import { SyncErrorCode } from "@nimble/shared";

const router = Router();

// Create a single instance of the services with Prisma client
const prisma = new PrismaClient();
const syncService = new CharacterSyncService(prisma);
const authService = new AuthService(prisma);

// Middleware to require authentication and ensure user exists in database
const requireAuth = async (req: any, res: any, next: any): Promise<void> => {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Ensure user exists in database
  const user = await authService.ensureUserExists(session);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.session = session;
  next();
};

// Sync characters - handles both upload and merge
router.post("/characters", requireAuth, async (req, res): Promise<void> => {
  try {
    const session = req.session as SessionData;
    const userId = session.user!.id;
    const userEmail = session.user!.email;
    const { characters } = req.body;

    console.log(
      `[Sync API] POST /sync/characters - User: ${userEmail} (${userId})`,
    );
    console.log(
      `[Sync API] Received ${characters?.length || 0} characters in request body`,
    );

    const result = await syncService.syncCharacters(userId, characters);

    console.log(`[Sync API] Sync successful for user ${userEmail}`);
    console.log(
      `[Sync API] Sending response with ${result.characterCount} characters`,
    );

    res.json(result);
  } catch (error) {
    console.error("[Sync API] Sync error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Character limit exceeded")) {
        res.status(400).json({
          error: error.message,
          code: SyncErrorCode.MAX_CHARACTERS_EXCEEDED,
        });
        return;
      }
      if (error.message.includes("Invalid request")) {
        res.status(400).json({
          error: error.message,
          code: SyncErrorCode.INVALID_CHARACTER_DATA,
        });
        return;
      }
    }

    res.status(500).json({
      error: "Failed to sync characters",
      code: SyncErrorCode.SERVER_ERROR,
    });
  }
});

// Get sync status
router.get("/status", requireAuth, async (req, res): Promise<void> => {
  try {
    const session = req.session as SessionData;
    const userId = session.user!.id;
    const userEmail = session.user!.email;

    console.log(`[Sync API] GET /sync/status - User: ${userEmail} (${userId})`);

    const status = await syncService.getSyncStatus(userId);

    console.log(`[Sync API] Status retrieved for user ${userEmail}:`, {
      characterCount: status.characterCount,
      lastSyncedAt: status.lastSyncedAt
        ? new Date(status.lastSyncedAt).toISOString()
        : "never",
      maxCharacters: status.maxCharacters,
    });

    res.json(status);
  } catch (error) {
    console.error("[Sync API] Status error:", error);
    res.status(500).json({ error: "Failed to get sync status" });
  }
});

// Delete a character backup
router.delete(
  "/characters/:characterId",
  requireAuth,
  async (req, res): Promise<void> => {
    try {
      const session = req.session as SessionData;
      const userId = session.user!.id;
      const userEmail = session.user!.email;
      const { characterId } = req.params;

      console.log(
        `[Sync API] DELETE /sync/characters/${characterId} - User: ${userEmail} (${userId})`,
      );

      await syncService.deleteCharacterBackup(userId, characterId);

      console.log(
        `[Sync API] Successfully deleted character ${characterId} for user ${userEmail}`,
      );

      res.json({ success: true });
    } catch (error) {
      // Check for Prisma not found error
      if (error instanceof Error && 'code' in error && error.code === "P2025") {
        res.status(404).json({ error: "Character backup not found" });
        return;
      }
      console.error("[Sync API] Delete error:", error);
      res.status(500).json({ error: "Failed to delete character backup" });
    }
  },
);

export default router;
