import { PrismaClient, UserSettings } from '@prisma/client';

export interface SyncCharacterData {
  id: string;
  timestamps?: {
    updatedAt: string;
  };
  [key: string]: any; // Allow any character data structure
}

export interface SyncResult {
  characters: SyncCharacterData[];
  syncedAt: string;
  characterCount: number;
  maxCharacters: number;
}

export interface SyncStatus {
  characterCount: number;
  lastSyncedAt: Date | null;
  maxCharacters: number;
}

export class CharacterSyncService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Sync characters - merges local and remote based on timestamps
   */
  async syncCharacters(userId: string, characters: SyncCharacterData[]): Promise<SyncResult> {
    // Validate input
    if (!Array.isArray(characters)) {
      throw new Error('Invalid request: characters must be an array');
    }

    // Get or create user settings
    let userSettings = await this.getUserSettings(userId);

    // Validate character count
    if (characters.length > userSettings.maxCharacters) {
      throw new Error(`Character limit exceeded. Maximum allowed: ${userSettings.maxCharacters}`);
    }

    // Fetch existing backups
    const existingBackups = await this.prisma.characterBackup.findMany({
      where: { userId }
    });

    // Create a map for quick lookup
    const backupMap = new Map(
      existingBackups.map(backup => [backup.characterId, backup])
    );

    // Process each character
    const syncedCharacters: SyncCharacterData[] = [];
    const operations: any[] = []; // Prisma transaction operations

    for (const character of characters) {
      if (!character.id || !character.timestamps?.updatedAt) {
        console.warn('Skipping character without id or updatedAt:', character.name);
        continue;
      }

      const characterId = character.id;
      const characterUpdatedAt = new Date(character.timestamps.updatedAt);
      const existingBackup = backupMap.get(characterId);

      // Determine which version to keep (newer one wins)
      let characterToKeep = character;
      let needsUpdate = true;

      if (existingBackup) {
        const backupUpdatedAt = new Date(existingBackup.updatedAt);
        
        if (backupUpdatedAt > characterUpdatedAt) {
          // Remote is newer, use it
          characterToKeep = existingBackup.characterData as SyncCharacterData;
          needsUpdate = false; // No need to update database
        }
        // If local is newer or equal, we'll update the database
      }

      syncedCharacters.push(characterToKeep);

      // Prepare database operation if needed
      if (needsUpdate) {
        operations.push(
          this.prisma.characterBackup.upsert({
            where: {
              userId_characterId: {
                userId,
                characterId
              }
            },
            update: {
              characterData: character as any,
              updatedAt: characterUpdatedAt,
              syncedAt: new Date()
            },
            create: {
              userId,
              characterId,
              characterData: character as any,
              updatedAt: characterUpdatedAt
            }
          })
        );
      }
    }

    // Add remote-only characters to the result
    for (const backup of existingBackups) {
      if (!characters.find(c => c.id === backup.characterId)) {
        syncedCharacters.push(backup.characterData as SyncCharacterData);
      }
    }

    // Execute all database operations in a transaction
    if (operations.length > 0) {
      await this.prisma.$transaction(operations);
    }

    return {
      characters: syncedCharacters,
      syncedAt: new Date().toISOString(),
      characterCount: syncedCharacters.length,
      maxCharacters: userSettings.maxCharacters
    };
  }

  /**
   * Get sync status for a user
   */
  async getSyncStatus(userId: string): Promise<SyncStatus> {
    // Get user settings
    const userSettings = await this.getUserSettings(userId);

    // Get character count and last sync time
    const [characterCount, lastBackup] = await Promise.all([
      this.prisma.characterBackup.count({
        where: { userId }
      }),
      this.prisma.characterBackup.findFirst({
        where: { userId },
        orderBy: { syncedAt: 'desc' },
        select: { syncedAt: true }
      })
    ]);

    return {
      characterCount,
      lastSyncedAt: lastBackup?.syncedAt || null,
      maxCharacters: userSettings.maxCharacters
    };
  }

  /**
   * Delete a character backup
   */
  async deleteCharacterBackup(userId: string, characterId: string): Promise<void> {
    await this.prisma.characterBackup.delete({
      where: {
        userId_characterId: {
          userId,
          characterId
        }
      }
    });
  }

  /**
   * Get or create user settings
   */
  private async getUserSettings(userId: string): Promise<UserSettings> {
    let userSettings = await this.prisma.userSettings.findUnique({
      where: { userId }
    });

    if (!userSettings) {
      // Create default settings if they don't exist
      userSettings = await this.prisma.userSettings.create({
        data: { 
          userId, 
          maxCharacters: 30 
        }
      });
    }

    return userSettings;
  }
}