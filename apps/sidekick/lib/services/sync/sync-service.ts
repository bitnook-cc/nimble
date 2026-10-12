import { SYNC_PROTOCOL_VERSION, SyncResult, SyncStatus } from "@nimble/shared";

import { Character } from "@/lib/schemas/character";
import { apiUrl } from "@/lib/utils/api";

import { characterFingerprint, serializeCharacter } from "../../utils/character-serialization";
import { authService } from "../auth-service";
import { CharacterService } from "../character-service";
import { ICharacterStorage } from "../interfaces";
import { SERVICE_KEYS } from "../service-container";
import { ServiceFactory } from "../service-factory";
import { imageSyncService } from "./image-sync-service";

class SyncService {
  private static instance: SyncService;
  private syncPromise: Promise<SyncResult | null> | null = null;
  private apiUrl: string;
  private characterStorage: ICharacterStorage;
  private characterService: CharacterService;
  private pendingImages = new Set<string>();
  private lastSyncedCharacters: Map<string, string> = new Map(); // characterId -> JSON hash
  private syncAccountId: string | null = null;
  private lastSyncTime: Date | null = null;
  private hasUnsyncedChanges: boolean = false;

  private constructor() {
    // Use the centralized API URL
    this.apiUrl = apiUrl;
    // Get services from the service factory
    this.characterStorage = ServiceFactory.getService<ICharacterStorage>(
      SERVICE_KEYS.CHARACTER_STORAGE,
    );
    this.characterService = ServiceFactory.getService<CharacterService>(
      SERVICE_KEYS.CHARACTER_SERVICE,
    );

    // Load last sync state from localStorage
    this.loadSyncState();
  }

  private loadSyncState() {
    try {
      // Check if we're in a browser environment
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        const syncState = localStorage.getItem(`nimble-sync-state:${this.syncAccountId}`);
        if (syncState) {
          const parsed = JSON.parse(syncState);
          this.lastSyncedCharacters = new Map(parsed.characters || []);
          this.pendingImages = new Set(parsed.pendingImages || []);
          this.lastSyncTime = parsed.lastSyncTime ? new Date(parsed.lastSyncTime) : null;
        }
      }
    } catch (error) {
      console.error("Failed to load sync state:", error);
    }
  }

  private saveSyncState() {
    try {
      // Check if we're in a browser environment
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        const syncState = {
          characters: Array.from(this.lastSyncedCharacters.entries()),
          pendingImages: [...this.pendingImages],
          lastSyncTime: this.lastSyncTime?.toISOString(),
        };
        localStorage.setItem(`nimble-sync-state:${this.syncAccountId}`, JSON.stringify(syncState));
      }
    } catch (error) {
      console.error("Failed to save sync state:", error);
    }
  }

  private createCharacterHash(character: Character): string {
    // Create a hash of the character data for change detection
    return characterFingerprint(character);
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
      const localIds = new Set(localCharacters.map((c) => c.id));
      for (const [syncedId] of this.lastSyncedCharacters) {
        if (!localIds.has(syncedId)) {
          this.hasUnsyncedChanges = true;
          return true;
        }
      }

      if (this.pendingImages.size) {
        this.hasUnsyncedChanges = true;
        return true;
      }
      this.hasUnsyncedChanges = false;
      return false;
    } catch (error) {
      console.error("Failed to check for changes:", error);
      this.hasUnsyncedChanges = true;
      return true;
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
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log("User not authenticated");
          return null;
        }
        throw new Error("Failed to get sync status");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get sync status:", error);
      return null;
    }
  }

  /**
   * Sync characters with the server
   * Merges local and remote characters based on timestamps
   */
  syncCharacters(): Promise<SyncResult | null> {
    if (!this.syncPromise) {
      this.syncPromise = this.performSync().finally(() => {
        this.syncPromise = null;
      });
    }
    return this.syncPromise;
  }

  private async performSync(): Promise<SyncResult | null> {
    const accountId = authService.getCurrentUserId() || (await authService.fetchUser()).user?.id;
    if (!accountId) return null;
    if (accountId !== this.syncAccountId) {
      this.syncAccountId = accountId;
      this.lastSyncedCharacters.clear();
      this.pendingImages.clear();
      this.lastSyncTime = null;
      this.loadSyncState();
    }
    const localCharacters = structuredClone(await this.characterStorage.getAllCharacters());
    const response = await fetch(`${this.apiUrl}/sync/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        accountId,
        protocolVersion: SYNC_PROTOCOL_VERSION,
        characters: localCharacters.map(serializeCharacter),
      }),
    });
    if (!response.ok) {
      if (response.status === 401) return null;
      const error = await response.json();
      throw new Error(error.error || "Failed to sync characters");
    }
    const result: SyncResult = await response.json();
    if (!Array.isArray(result.characters) || !Number.isFinite(result.syncedAt))
      throw new Error("Invalid sync response");
    if (authService.getCurrentUserId() !== accountId)
      throw new Error("Account changed during sync; please sync again");

    const conflicts = new Set(result.inventoryConflicts || []);
    const safeCharacters = result.characters.map((c) =>
      conflicts.has(c.id) ? localCharacters.find((local) => local.id === c.id) || c : c,
    );
    const merged = await this.characterStorage.mergeSyncedCharacters(
      localCharacters,
      safeCharacters,
    );
    this.lastSyncedCharacters = new Map(
      result.characters.map((c) => [c.id, this.createCharacterHash(c)]),
    );
    this.lastSyncTime = new Date(result.syncedAt);
    this.saveSyncState();
    await this.checkForChanges();

    const currentCharacter = this.characterService.getCurrentCharacter();
    if (currentCharacter && merged.some((c) => c.id === currentCharacter.id)) {
      await this.characterService.loadCharacter(currentCharacter.id);
    }
    this.pendingImages = new Set(
      [...this.pendingImages].filter((id) => merged.some((c) => c.id === id && c.imageId)),
    );
    for (const character of merged) {
      if (!character.imageId) continue;
      try {
        const imageResult = await imageSyncService.syncCharacterImage(
          character.id,
          character.imageId,
        );
        if (imageResult.success) this.pendingImages.delete(character.id);
        else this.pendingImages.add(character.id);
      } catch (error) {
        this.pendingImages.add(character.id);
        console.warn("Portrait sync will be retried", error);
      }
    }
    this.saveSyncState();
    await this.checkForChanges();
    window.dispatchEvent(new CustomEvent("characters-synced", { detail: { characters: merged } }));
    if (conflicts.size)
      throw new Error(
        "Party inventory changed. Open Campaigns to review the cloud inventory before syncing this character.",
      );
    if (this.pendingImages.size)
      throw new Error(
        "Character data synced, but some portraits could not be synced. Please try again.",
      );
    return { ...result, characters: merged, characterCount: merged.length };
  }

  /**
   * Delete a character backup from the server
   */
  async deleteCharacterBackup(characterId: string): Promise<boolean> {
    try {
      // Delete character data
      const response = await fetch(`${this.apiUrl}/sync/characters/${characterId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Character doesn't exist on server, that's ok
          console.log(`Character ${characterId} doesn't exist on server, skipping deletion`);
        } else {
          throw new Error("Failed to delete character backup");
        }
      }

      // Also try to delete character image
      try {
        const imageResponse = await fetch(
          `${this.apiUrl}/images/characters/${characterId}/avatar`,
          {
            method: "DELETE",
            credentials: "include",
          },
        );

        if (!imageResponse.ok && imageResponse.status !== 404 && imageResponse.status !== 503) {
          console.warn(`Failed to delete character image: ${imageResponse.status}`);
        }
      } catch (imageError) {
        console.warn("Failed to delete character image:", imageError);
        // Don't fail the whole operation if image deletion fails
      }

      return true;
    } catch (error) {
      console.error("Failed to delete character backup:", error);
      return false;
    }
  }

  /**
   * Format last synced time for display
   */
  formatLastSynced(lastSyncedAt: number | null): string {
    if (!lastSyncedAt) {
      return "Never synced";
    }

    const date = new Date(lastSyncedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

export const syncService = SyncService.getInstance();
