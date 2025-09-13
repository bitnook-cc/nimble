import { Character } from '@/lib/schemas/character';
import { ICharacterStorage, ICharacterService } from './interfaces';
import { authService } from './auth-service';
import { SyncStatus, SyncResult } from '@nimble/shared';
import { apiUrl } from '@/lib/utils/api';
import { ServiceFactory } from './service-factory';
import { SERVICE_KEYS } from './service-container';
import { imageSyncService } from './image-sync-service';
import { characterImageService } from './character-image-service';

class SyncService {
  private static instance: SyncService;
  private apiUrl: string;
  private characterStorage: ICharacterStorage;
  private characterService: ICharacterService;
  private lastSyncedCharacters: Map<string, string> = new Map(); // characterId -> JSON hash
  private lastSyncTime: Date | null = null;
  private hasUnsyncedChanges: boolean = false;

  private constructor() {
    // Use the centralized API URL
    this.apiUrl = apiUrl;
    // Get services from the service factory
    this.characterStorage = ServiceFactory.getService<ICharacterStorage>(SERVICE_KEYS.CHARACTER_STORAGE);
    this.characterService = ServiceFactory.getService<ICharacterService>(SERVICE_KEYS.CHARACTER_SERVICE);
    
    // Load last sync state from localStorage
    this.loadSyncState();
  }

  private loadSyncState() {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const syncState = localStorage.getItem('nimble-sync-state');
        if (syncState) {
          const parsed = JSON.parse(syncState);
          this.lastSyncedCharacters = new Map(parsed.characters || []);
          this.lastSyncTime = parsed.lastSyncTime ? new Date(parsed.lastSyncTime) : null;
        }
      }
    } catch (error) {
      console.error('Failed to load sync state:', error);
    }
  }

  private saveSyncState() {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const syncState = {
          characters: Array.from(this.lastSyncedCharacters.entries()),
          lastSyncTime: this.lastSyncTime?.toISOString(),
        };
        localStorage.setItem('nimble-sync-state', JSON.stringify(syncState));
      }
    } catch (error) {
      console.error('Failed to save sync state:', error);
    }
  }

  private createCharacterHash(character: Character): string {
    // Create a hash of the character data for change detection
    // We exclude the id from the hash since we track by id
    const { id, ...characterData } = character;
    return JSON.stringify(characterData);
  }

  /**
   * Check if there are unsynced changes
   */
  async checkForChanges(): Promise<boolean> {
    try {
      const localCharacters = await this.characterStorage.getAllCharacters();
      
      // Check if any character has changed
      for (const character of localCharacters) {
        const currentHash = this.createCharacterHash(character);
        const lastHash = this.lastSyncedCharacters.get(character.id);
        
        if (!lastHash || lastHash !== currentHash) {
          this.hasUnsyncedChanges = true;
          return true;
        }
      }
      
      // Check if any characters were deleted
      const localIds = new Set(localCharacters.map(c => c.id));
      for (const [syncedId] of this.lastSyncedCharacters) {
        if (!localIds.has(syncedId)) {
          this.hasUnsyncedChanges = true;
          return true;
        }
      }
      
      this.hasUnsyncedChanges = false;
      return false;
    } catch (error) {
      console.error('Failed to check for changes:', error);
      return false;
    }
  }

  /**
   * Get whether there are unsynced changes
   */
  getHasUnsyncedChanges(): boolean {
    return this.hasUnsyncedChanges;
  }

  /**
   * Get the last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Check if user is authenticated using auth service
   */
  async isAuthenticated(): Promise<boolean> {
    // First check local auth state
    if (authService.isAuthenticated()) {
      return true;
    }
    
    // If not authenticated locally, try fetching user to update auth state
    const response = await authService.fetchUser();
    return !!response.user;
  }

  /**
   * Get sync status from the server
   */
  async getSyncStatus(): Promise<SyncStatus | null> {
    try {
      const response = await fetch(`${this.apiUrl}/sync/status`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('User not authenticated');
          return null;
        }
        throw new Error('Failed to get sync status');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return null;
    }
  }

  /**
   * Sync characters with the server
   * Merges local and remote characters based on timestamps
   */
  async syncCharacters(): Promise<SyncResult | null> {
    try {
      // Get all local characters from storage
      const localCharacters = await this.characterStorage.getAllCharacters();
      
      console.log('[Sync Client] Starting sync with server');
      console.log(`[Sync Client] Sending ${localCharacters.length} local characters to sync`);
      console.log('[Sync Client] Character IDs being sent:', localCharacters.map(c => ({
        id: c.id,
        name: c.name,
        updatedAt: c.timestamps?.updatedAt ? new Date(c.timestamps.updatedAt).toISOString() : 'unknown'
      })));

      // Send to server for sync
      const response = await fetch(`${this.apiUrl}/sync/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ characters: localCharacters }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[Sync Client] User not authenticated');
          return null;
        }
        const error = await response.json();
        console.error('[Sync Client] Sync failed:', error);
        throw new Error(error.error || 'Failed to sync characters');
      }

      const result: SyncResult = await response.json();
      
      console.log('[Sync Client] Sync response received');
      console.log(`[Sync Client] Received ${result.characterCount} characters from server`);
      console.log(`[Sync Client] Max characters allowed: ${result.maxCharacters}`);
      console.log('[Sync Client] Synced at:', new Date(result.syncedAt).toISOString());
      console.log('[Sync Client] Character IDs received:', result.characters?.map(c => ({
        id: c.id,
        name: c.name,
        updatedAt: c.timestamps?.updatedAt ? new Date(c.timestamps.updatedAt).toISOString() : 'unknown'
      })));

      // Update local storage with merged characters using character storage service
      if (result.characters && Array.isArray(result.characters)) {
        // Use character storage service to validate and store all characters
        await this.characterStorage.replaceAllCharacters(result.characters);
        
        console.log(`[Sync Client] Updated local storage with ${result.characters.length} synced characters`);
        
        // Update sync state tracking
        this.lastSyncedCharacters.clear();
        for (const character of result.characters) {
          this.lastSyncedCharacters.set(character.id, this.createCharacterHash(character));
        }
        this.lastSyncTime = new Date(result.syncedAt);
        this.hasUnsyncedChanges = false;
        this.saveSyncState();
        
        // Reload the current character if it exists
        const currentCharacter = this.characterService.getCurrentCharacter();
        if (currentCharacter) {
          console.log(`[Sync Client] Reloading current character: ${currentCharacter.id}`);
          await this.characterService.loadCharacter(currentCharacter.id);
        }
        
        // Notify any listeners about the update
        window.dispatchEvent(new CustomEvent('characters-synced', { 
          detail: { characters: result.characters } 
        }));
      }

      // Sync character images if any are provided
      if (result.images && result.images.length > 0) {
        console.log(`[Sync Client] Processing ${result.images.length} character images`);
        
        for (const imageMetadata of result.images) {
          try {
            // Check if we have the image locally
            const character = result.characters?.find(c => c.id === imageMetadata.characterId);
            if (character) {
              // Properly check if the image exists in IndexedDB, not just if character has imageId
              const hasLocalImage = character.imageId ? 
                await characterImageService.imageExists(character.id, character.imageId) : false;
              
              if (!hasLocalImage && imageMetadata.url) {
                // Download image from server
                console.log(`[Sync Client] Downloading image for character ${imageMetadata.characterId}`);
                const downloadResult = await imageSyncService.downloadCharacterImage(
                  imageMetadata.characterId,
                  imageMetadata.url
                );
                
                if (downloadResult.success) {
                  console.log(`[Sync Client] Image downloaded successfully for character ${imageMetadata.characterId}`);
                  // Note: The downloadCharacterImage method already saves to IndexedDB
                  // and returns the new imageId, but we don't update the character here
                  // since that would require another sync cycle
                }
              } else if (hasLocalImage && character.imageId) {
                // We already have a local image and server has an image
                // No need to sync - local image takes precedence
                console.log(`[Sync Client] Both local and server images exist for character ${imageMetadata.characterId}, keeping local`);
              }
            }
          } catch (error) {
            console.error(`[Sync Client] Failed to sync image for character ${imageMetadata.characterId}:`, error);
            // Don't fail the entire sync if one image fails
          }
        }
      } else if (result.images === undefined) {
        console.log('[Sync Client] No images returned from server - blob storage may not be configured');
      }

      // Also check for characters with local images that weren't in the server response
      if (result.characters && Array.isArray(result.characters)) {
        for (const character of result.characters) {
          if (character.imageId) {
            // First verify the image actually exists in IndexedDB
            const imageExists = await characterImageService.imageExists(character.id, character.imageId);
            if (imageExists) {
              const hasServerImage = result.images?.some(img => img.characterId === character.id);
              if (!hasServerImage) {
                try {
                  console.log(`[Sync Client] Uploading missing image for character ${character.id}`);
                  await imageSyncService.uploadCharacterImage(character.id, character.imageId);
                } catch (error) {
                  console.error(`[Sync Client] Failed to upload image for character ${character.id}:`, error);
                }
              }
            } else if (character.imageId) {
              // Character has imageId but image doesn't exist in IndexedDB
              console.warn(`[Sync Client] Character ${character.id} has imageId ${character.imageId} but image not found in IndexedDB`);
            }
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to sync characters:', error);
      throw error;
    }
  }

  /**
   * Delete a character backup from the server
   */
  async deleteCharacterBackup(characterId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/sync/characters/${characterId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Character doesn't exist on server, that's ok
          return true;
        }
        throw new Error('Failed to delete character backup');
      }

      return true;
    } catch (error) {
      console.error('Failed to delete character backup:', error);
      return false;
    }
  }

  /**
   * Format last synced time for display
   */
  formatLastSynced(lastSyncedAt: number | null): string {
    if (!lastSyncedAt) {
      return 'Never synced';
    }

    const date = new Date(lastSyncedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

export const syncService = SyncService.getInstance();