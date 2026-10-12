import { PrismaClient, Prisma } from "@prisma/client";
import {
  Syncable,
  SyncResult,
  SyncStatus,
  CharacterImageMetadata,
  isNewerThan,
} from "@nimble/shared";
import { list } from "@vercel/blob";
import { SERVER_CONFIG } from "../config/server-config.js";
import { track } from "@vercel/analytics/server";

// Type alias for clarity - any object with syncable fields
type SyncCharacterData = Syncable & Record<string, unknown>;

export class LegacyInventoryConflictError extends Error {
  constructor() {
    super(
      "Party inventory changed. Update Sidekick before syncing this character. Your local edits have not been replaced.",
    );
  }
}

export class CharacterSyncService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Sync characters - merges local and remote based on timestamps
   */
  async syncCharacters(
    userId: string,
    characters: Syncable[],
    supportsInventoryConflicts = true,
  ): Promise<SyncResult> {
    if (!Array.isArray(characters))
      throw new Error("Invalid request: characters must be an array");
    const maxCharacters = SERVER_CONFIG.sync.maxCharactersPerUser;
    const ids = new Set<string>();
    for (const character of characters) {
      if (
        !character ||
        typeof character.id !== "string" ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(character.id) ||
        ids.has(character.id) ||
        typeof character.timestamps?.updatedAt !== "number" ||
        !Number.isSafeInteger(character.timestamps.updatedAt) ||
        character.timestamps.updatedAt <= 0 ||
        character.timestamps.updatedAt > Date.now() + 300000
      ) {
        throw new Error(
          "Invalid request: character IDs must be unique and timestamps valid",
        );
      }
      ids.add(character.id);
    }
    if (characters.length > maxCharacters)
      throw new Error(
        "Character limit exceeded. Maximum allowed: " + maxCharacters,
      );
    const inventoryConflicts: string[] = [];
    const syncedCharacters = await this.prisma.$transaction(async (tx) => {
      // Serialize all backup changes for an account, including first-time uploads.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      const backups = await tx.characterBackup.findMany({ where: { userId } });
      const merged = new Map<string, SyncCharacterData>(
        backups.map((backup) => [
          backup.characterId,
          backup.characterData as SyncCharacterData,
        ]),
      );
      for (const character of characters) {
        const remote = merged.get(character.id);
        const revision =
          backups.find((b) => b.characterId === character.id)
            ?.inventoryRevision ?? 0;
        const localRevision =
          (character as SyncCharacterData)._inventoryRevision ?? 0;
        if (localRevision !== revision) {
          // Older clients replace their entire local collection with a success
          // response. Reject the transaction instead of returning stale data.
          if (remote && !supportsInventoryConflicts)
            throw new LegacyInventoryConflictError();
          if (remote) inventoryConflicts.push(character.id);
          else
            throw new Error(
              "Invalid request: inventory revision is not recognized",
            );
          continue;
        }
        if (!remote || isNewerThan(character, remote))
          merged.set(character.id, character as SyncCharacterData);
      }
      if (merged.size > maxCharacters)
        throw new Error(
          "Character limit exceeded. Maximum allowed: " + maxCharacters,
        );
      for (const character of characters) {
        if (merged.get(character.id) !== character) continue;
        const data = {
          characterData: character as Prisma.InputJsonValue,
          updatedAt: new Date(character.timestamps!.updatedAt!),
          syncedAt: new Date(),
        };
        await tx.characterBackup.upsert({
          where: { userId_characterId: { userId, characterId: character.id } },
          update: data,
          create: { userId, characterId: character.id, ...data },
        });
      }
      return [...merged.values()];
    });

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

    void track("character-sync", {
      user_id: userId,
      character_count: syncedCharacters.length,
      image_count: images.length,
      from_client: characters.length,
      to_client: syncedCharacters.length,

      images: images.length,
    }).catch(() => {});

    const result: SyncResult = {
      characters: syncedCharacters,
      inventoryConflicts: inventoryConflicts.length
        ? inventoryConflicts
        : undefined,
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
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      await tx.characterBackup.delete({
        where: {
          userId_characterId: {
            userId,
            characterId,
          },
        },
      });
    });
  }
}
