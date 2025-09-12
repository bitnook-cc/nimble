export interface AppSettings {
  activeCharacterId?: string; // Optional to allow null state when no characters exist
  themeId?: string; // Store theme ID as string to handle any theme
}

export class SettingsService {
  private readonly storageKey = "nimble-navigator-settings";

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

  private getDefaultSettings(): AppSettings {
    return {
      activeCharacterId: undefined, // No default character when starting fresh
      themeId: "default", // Default to light theme
    };
  }
}

export const settingsService = new SettingsService();
