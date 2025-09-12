import { Character } from '@/lib/schemas/character';
import { CharacterStorageService } from './character-storage-service';
import { authService } from './auth-service';

export interface SyncStatus {
  characterCount: number;
  lastSyncedAt: string | null;
  maxCharacters: number;
}

export interface SyncResult {
  characters: Character[];
  syncedAt: string;
  characterCount: number;
  maxCharacters: number;
}

class SyncService {
  private static instance: SyncService;
  private apiUrl: string;
  private characterStorage: CharacterStorageService;

  private constructor() {
    // Use environment variable or default to localhost for development
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.characterStorage = new CharacterStorageService();
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
          console.log('User not authenticated');
          return null;
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync characters');
      }

      const result: SyncResult = await response.json();

      // Update local storage with merged characters
      if (result.characters && Array.isArray(result.characters)) {
        // Clear existing characters and replace with synced ones
        localStorage.setItem('nimble-navigator-characters', JSON.stringify(result.characters));
        
        // Notify any listeners about the update
        window.dispatchEvent(new CustomEvent('characters-synced', { 
          detail: { characters: result.characters } 
        }));
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
  formatLastSynced(lastSyncedAt: string | null): string {
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