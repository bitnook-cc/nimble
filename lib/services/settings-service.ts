export type AppMode = 'basic' | 'full';

export interface AppSettings {
  mode: AppMode;
  activeCharacterId?: string; // Optional to allow null state when no characters exist
}

export class SettingsService {
  private readonly storageKey = 'nimble-navigator-settings';

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

  async updateMode(mode: AppMode): Promise<void> {
    const settings = await this.getSettings();
    await this.saveSettings({ ...settings, mode });
  }

  async updateActiveCharacter(characterId?: string): Promise<void> {
    const settings = await this.getSettings();
    await this.saveSettings({ ...settings, activeCharacterId: characterId });
  }

  async clearActiveCharacter(): Promise<void> {
    const settings = await this.getSettings();
    await this.saveSettings({ ...settings, activeCharacterId: undefined });
  }

  private getDefaultSettings(): AppSettings {
    return {
      mode: 'full',
      activeCharacterId: undefined, // No default character when starting fresh
    };
  }
}

export const settingsService = new SettingsService();