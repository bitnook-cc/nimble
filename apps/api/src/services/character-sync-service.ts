import { PrismaClient, CharacterBackup, Prisma } from "@prisma/client";
import {
  Syncable,
  SyncResult,
  SyncStatus,
  CharacterImageMetadata,
  isNewerThan,
} from "@nimble/shared";
import { list } from "@vercel/blob";
import { SERVER_CONFIG } from "../config/server-config";

// Type alias for clarity - any object with syncable fields
type SyncCharacterData = Syncable & Record<string, any>;

export class CharacterSyncService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Sync characters - merges local and remote based on timestamps
   */
  async syncCharacters(
    userId: string,
    characters: Syncable[],
  ): Promise<SyncResult> {
    console.log(`[Sync Server] Starting sync for user: ${userId}`);
    console.log(
      `[Sync Server] Received ${characters?.length || 0} characters from client`,
    );

    // Validate input
    if (!Array.isArray(characters)) {
      console.error("[Sync Server] Invalid input: characters is not an array");
      throw new Error("Invalid request: characters must be an array");
    }

    // Validate character count
    if (characters.length > SERVER_CONFIG.sync.maxCharactersPerUser) {
      console.error(
        `[Sync Server] Character limit exceeded for user ${userId}: ${characters.length} > ${SERVER_CONFIG.sync.maxCharactersPerUser}`,
      );
      throw new Error(
        `Character limit exceeded. Maximum allowed: ${SERVER_CONFIG.sync.maxCharactersPerUser}`,
      );
    }

    console.log(
      "[Sync Server] Client characters:",
      characters.map((c) => ({
        id: c.id,
        updatedAt: c.timestamps?.updatedAt
          ? new Date(c.timestamps.updatedAt).toISOString()
          : "unknown",
      })),
    );

    // Fetch existing backups
    const existingBackups = await this.prisma.characterBackup.findMany({
      where: { userId },
    });

    console.log(
      `[Sync Server] Found ${existingBackups.length} existing backups for user ${userId}`,
    );
    console.log(
      "[Sync Server] Existing backups:",
      existingBackups.map((b: CharacterBackup) => ({
        characterId: b.characterId,
        updatedAt: b.updatedAt.toISOString(),
        syncedAt: b.syncedAt.toISOString(),
      })),
    );

    // Create a map for quick lookup
    const backupMap = new Map(
      existingBackups.map((backup: CharacterBackup) => [
        backup.characterId,
        backup,
      ]),
    );

    // Process each character
    const syncedCharacters: SyncCharacterData[] = [];
    const operations: any[] = []; // Prisma transaction operations

    for (const character of characters) {
      if (!character.id || !character.timestamps?.updatedAt) {
        console.warn(
          `[Sync Server] Skipping character without id or updatedAt: ${character.id}`,
        );
        continue;
      }

      const characterId = character.id;
      // timestamps.updatedAt is a Unix timestamp in milliseconds
      const characterUpdatedAt = new Date(character.timestamps.updatedAt);
      const existingBackup = backupMap.get(characterId);

      // Determine which version to keep (newer one wins)
      let characterToKeep = character;
      let needsUpdate = true;

      if (existingBackup) {
        // Safely parse the JSON data from Prisma
        const backupData = existingBackup.characterData as SyncCharacterData;

        // Use the shared helper to compare timestamps
        if (!isNewerThan(character, backupData)) {
          // Remote is newer or equal, use it
          console.log(
            `[Sync Server] Character ${characterId}: Server version is newer or equal, keeping server version`,
          );
          characterToKeep = backupData;
          needsUpdate = false; // No need to update database
        } else {
          console.log(
            `[Sync Server] Character ${characterId}: Client version is newer, will update server`,
          );
        }
      } else {
        console.log(
          `[Sync Server] Character ${characterId}: New character, will create backup`,
        );
      }

      syncedCharacters.push(characterToKeep);

      // Prepare database operation if needed
      if (needsUpdate) {
        operations.push(
          this.prisma.characterBackup.upsert({
            where: {
              userId_characterId: {
                userId,
                characterId,
              },
            },
            update: {
              characterData: character as Prisma.InputJsonValue,
              updatedAt: characterUpdatedAt,
              syncedAt: new Date(),
            },
            create: {
              userId,
              characterId,
              characterData: character as Prisma.InputJsonValue,
              updatedAt: characterUpdatedAt,
            },
          }),
        );
      }
    }

    // Add remote-only characters to the result
    for (const backup of existingBackups) {
      if (!characters.find((c) => c.id === backup.characterId)) {
        console.log(
          `[Sync Server] Including server-only character: ${backup.characterId}`,
        );
        syncedCharacters.push(backup.characterData as SyncCharacterData);
      }
    }

    // Execute all database operations in a transaction
    if (operations.length > 0) {
      console.log(
        `[Sync Server] Executing ${operations.length} database operations for user ${userId}`,
      );
      await this.prisma.$transaction(operations);
      console.log(`[Sync Server] Database operations completed successfully`);
    } else {
      console.log(
        `[Sync Server] No database updates needed for user ${userId}`,
      );
    }

    // Fetch character images from Blob Storage (only if configured)
    let images: CharacterImageMetadata[] = [];
    const isBlobStorageConfigured = !!process.env.BLOB_READ_WRITE_TOKEN;

    if (isBlobStorageConfigured) {
      try {
        const prefix = `users/${userId}/characters/`;
        const { blobs } = await list({
          prefix,
          limit: 100,
        });

        images = blobs.map((blob) => ({
          characterId: blob.pathname.split("/")[3], // Extract character ID from path
          url: blob.url,
          // Note: clientImageId would be in metadata, but metadata is not supported in current version
        }));

        console.log(
          `[Sync Server] Found ${images.length} character images for user ${userId}`,
        );
      } catch (error) {
        console.error("[Sync Server] Failed to fetch character images:", error);
        // Don't fail the sync if images can't be fetched
      }
    } else {
      console.log(
        "[Sync Server] Blob storage not configured - skipping image sync",
      );
    }

    const result: SyncResult = {
      characters: syncedCharacters,
      syncedAt: Date.now(),
      characterCount: syncedCharacters.length,
      maxCharacters: SERVER_CONFIG.sync.maxCharactersPerUser,
      images: images.length > 0 ? images : undefined,
    };

    console.log(`[Sync Server] Sync complete for user ${userId}`);
    console.log(`[Sync Server] Returning ${result.characterCount} characters`);
    console.log(
      "[Sync Server] Final character IDs:",
      syncedCharacters.map((c) => ({
        id: c.id,
        updatedAt: c.timestamps?.updatedAt
          ? new Date(c.timestamps.updatedAt).toISOString()
          : "unknown",
      })),
    );

    return result;
  }

  /**
   * Get sync status for a user
   */
  async getSyncStatus(userId: string): Promise<SyncStatus> {
    // Get character count and last sync time
    const [characterCount, lastBackup] = await Promise.all([
      this.prisma.characterBackup.count({
        where: { userId },
      }),
      this.prisma.characterBackup.findFirst({
        where: { userId },
        orderBy: { syncedAt: "desc" },
        select: { syncedAt: true },
      }),
    ]);

    return {
      characterCount,
      lastSyncedAt: lastBackup?.syncedAt?.getTime() || null,
      maxCharacters: SERVER_CONFIG.sync.maxCharactersPerUser,
    };
  }

  /**
   * Delete a character backup
   */
  async deleteCharacterBackup(
    userId: string,
    characterId: string,
  ): Promise<void> {
    await this.prisma.characterBackup.delete({
      where: {
        userId_characterId: {
          userId,
          characterId,
        },
      },
    });
  }
}
