import { findThemeForMode, getThemeFamily, themes } from "@/lib/data/themes";
import { Theme, ThemeId } from "@/lib/types/theme";

import { settingsService } from "./settings-service";

export class ThemeService {
  private isInitialized = false;
  private currentThemeId: string = "default";

  async initializeTheme(): Promise<void> {
    if (this.isInitialized || typeof window === "undefined") return;

    this.isInitialized = true;

    // Get theme from app settings
    const settings = await settingsService.getSettings();
    const themeId = settings.themeId || "default";

    // Update current theme ID
    this.currentThemeId = themeId;

    // Apply the theme
    this.applyTheme(themeId);
  }

  getThemeById(id: string): Theme | undefined {
    return themes.find((theme) => theme.id === id);
  }

  getAllThemes(): Theme[] {
    return themes;
  }

  async setTheme(themeId: string): Promise<void> {
    // Validate theme exists, fallback to default if not
    const theme = this.getThemeById(themeId);
    const validThemeId = theme ? themeId : "default";

    this.currentThemeId = validThemeId;

    // Save to settings
    await settingsService.updateTheme(validThemeId);

    // Apply the theme
    this.applyTheme(validThemeId);
  }

  async setColorMode(colorMode: "light" | "dark" | "system"): Promise<void> {
    // Find appropriate theme based on color mode
    const currentFamily = getThemeFamily(this.currentThemeId);
    let targetTheme: Theme | undefined;

    if (colorMode === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      targetTheme = findThemeForMode(currentFamily, prefersDark);
    } else {
      targetTheme = findThemeForMode(currentFamily, colorMode === "dark");
    }

    if (targetTheme) {
      await this.setTheme(targetTheme.id);
    }
  }

  getCurrentThemeId(): string {
    return this.currentThemeId;
  }

  getCurrentTheme(): Theme | undefined {
    return this.getThemeById(this.currentThemeId);
  }

  private applyTheme(themeId: string): void {
    const theme = this.getThemeById(themeId);

    // Fallback to default if theme not found
    const finalTheme = theme || this.getThemeById("default");
    if (!finalTheme) return;

    this.currentThemeId = finalTheme.id;
    const root = document.documentElement;

    // Add or remove dark class based on theme
    if (finalTheme.isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply theme colors directly
    const colors = finalTheme.colors;
    root.style.setProperty("--background", colors.background);
    root.style.setProperty("--foreground", colors.foreground);
    root.style.setProperty("--card", colors.card);
    root.style.setProperty("--card-foreground", colors.cardForeground);
    root.style.setProperty("--popover", colors.popover);
    root.style.setProperty("--popover-foreground", colors.popoverForeground);
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", colors.primaryForeground);
    root.style.setProperty("--secondary", colors.secondary);
    root.style.setProperty("--secondary-foreground", colors.secondaryForeground);
    root.style.setProperty("--muted", colors.muted);
    root.style.setProperty("--muted-foreground", colors.mutedForeground);
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--accent-foreground", colors.accentForeground);
    root.style.setProperty("--destructive", colors.destructive);
    root.style.setProperty("--destructive-foreground", colors.destructiveForeground);
    root.style.setProperty("--border", colors.border);
    root.style.setProperty("--input", colors.input);
    root.style.setProperty("--ring", colors.ring);

    // Apply custom theme variables if any
    if (finalTheme.custom) {
      Object.entries(finalTheme.custom).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }

    // Add theme class for theme-specific styles
    root.setAttribute("data-theme", getThemeFamily(finalTheme.id));
  }

  // Get light/dark themes grouped by family
  getThemesByFamily(): Map<string, { light?: Theme; dark?: Theme }> {
    const families = new Map<string, { light?: Theme; dark?: Theme }>();

    themes.forEach((theme) => {
      const family = getThemeFamily(theme.id);
      const existing = families.get(family) || {};

      if (theme.isDark) {
        existing.dark = theme;
      } else {
        existing.light = theme;
      }

      families.set(family, existing);
    });

    return families;
  }

  // Infer color mode from current theme
  getColorMode(): "light" | "dark" {
    const theme = this.getCurrentTheme();
    return theme?.isDark ? "dark" : "light";
  }
}

export const themeService = new ThemeService();
