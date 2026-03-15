export interface AppSettings {
  activeCharacterId?: string; // Optional to allow null state when no characters exist
  themeId?: string; // Store theme ID as string to handle any theme
  beyond20Enabled?: boolean; // Enable Beyond20 VTT integration
}

export class SettingsService {
  private readonly storageKey = "sheets-settings";
  private readonly oldStorageKeys = ["nimble-navigator-settings"];

  constructor() {
    this.migrateFromOldKeys();
  }

  /**
   * Migrate data from old storage keys to new key
   */
  private migrateFromOldKeys(): void {
    // Only run in browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    // Check if new key already has data
    const existingData = localStorage.getItem(this.storageKey);
    if (existingData) {
      return; // Already migrated or has data
    }

    // Try to find data in old keys
    for (const oldKey of this.oldStorageKeys) {
      const oldData = localStorage.getItem(oldKey);
      if (oldData) {
        // Copy to new key
        localStorage.setItem(this.storageKey, oldData);
        // Remove old key
        localStorage.removeItem(oldKey);
        console.log(`Migrated settings data from ${oldKey} to ${this.storageKey}`);
        return;
      }
    }
  }

  async getSettings(): Promise<AppSettings> {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      return this.getDefaultSettings();
    }

    try {
      return JSON.parse(stored);
    } catch {
      return this.getDefaultSettings();
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    localStorage.setItem(this.storageKey, JSON.stringify(settings));
  }

  async updateActiveCharacter(characterId?: string): Promise<void> {
    const settings = await this.getSettings();
    await this.saveSettings({ ...settings, activeCharacterId: characterId });
  }

  async clearActiveCharacter(): Promise<void> {
    const settings = await this.getSettings();
    await this.saveSettings({ ...settings, activeCharacterId: undefined });
  }

  async updateTheme(themeId: string): Promise<void> {
    const settings = await this.getSettings();
    await this.saveSettings({ ...settings, themeId });
  }

  async updateBeyond20Enabled(enabled: boolean): Promise<void> {
    const settings = await this.getSettings();
    await this.saveSettings({ ...settings, beyond20Enabled: enabled });
  }

  private getDefaultSettings(): AppSettings {
    return {
      activeCharacterId: undefined, // No default character when starting fresh
      themeId: "default", // Default to light theme
      beyond20Enabled: false, // Disabled by default
    };
  }
}

export const settingsService = new SettingsService();
