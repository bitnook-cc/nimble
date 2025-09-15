export type ThemeId =
  | "default"
  | "default-dark"
  | "nimble"
  | "nimble-dark"
  | "forest"
  | "forest-dark"
  | "ocean"
  | "ocean-dark"
  | "sunset"
  | "sunset-dark"
  | "midnight";

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
  };
  // Additional theme-specific CSS variables
  custom?: Record<string, string>;
}

export type ThemeFamily = "default" | "nimble" | "forest" | "ocean" | "sunset" | "midnight";
