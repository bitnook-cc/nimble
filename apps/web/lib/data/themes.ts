import { Theme } from "@/lib/types/theme";

export const themes: Theme[] = [
  // Default Light
  {
    id: "default",
    name: "Default",
    description: "Clean and modern design with blue accents",
    isDark: false,
    colors: {
      background: "hsl(0 0% 100%)",
      foreground: "hsl(222.2 84% 4.9%)",
      card: "hsl(0 0% 100%)",
      cardForeground: "hsl(222.2 84% 4.9%)",
      popover: "hsl(0 0% 100%)",
      popoverForeground: "hsl(222.2 84% 4.9%)",
      primary: "hsl(221.2 83.2% 53.3%)",
      primaryForeground: "hsl(210 40% 98%)",
      secondary: "hsl(210 40% 96%)",
      secondaryForeground: "hsl(222.2 84% 4.9%)",
      muted: "hsl(210 40% 96%)",
      mutedForeground: "hsl(215.4 16.3% 46.9%)",
      accent: "hsl(210 40% 96%)",
      accentForeground: "hsl(222.2 84% 4.9%)",
      destructive: "hsl(0 84.2% 60.2%)",
      destructiveForeground: "hsl(210 40% 98%)",
      border: "hsl(214.3 31.8% 91.4%)",
      input: "hsl(214.3 31.8% 91.4%)",
      ring: "hsl(221.2 83.2% 53.3%)",
    },
  },
  // Default Dark
  {
    id: "default-dark",
    name: "Default Dark",
    description: "Modern dark theme with blue accents",
    isDark: true,
    colors: {
      background: "hsl(222.2 84% 4.9%)",
      foreground: "hsl(210 40% 98%)",
      card: "hsl(222.2 84% 4.9%)",
      cardForeground: "hsl(210 40% 98%)",
      popover: "hsl(222.2 84% 4.9%)",
      popoverForeground: "hsl(210 40% 98%)",
      primary: "hsl(217.2 91.2% 59.8%)",
      primaryForeground: "hsl(222.2 84% 4.9%)",
      secondary: "hsl(217.2 32.6% 17.5%)",
      secondaryForeground: "hsl(210 40% 98%)",
      muted: "hsl(217.2 32.6% 17.5%)",
      mutedForeground: "hsl(215 20.2% 65.1%)",
      accent: "hsl(217.2 32.6% 17.5%)",
      accentForeground: "hsl(210 40% 98%)",
      destructive: "hsl(0 62.8% 30.6%)",
      destructiveForeground: "hsl(210 40% 98%)",
      border: "hsl(217.2 32.6% 17.5%)",
      input: "hsl(217.2 32.6% 17.5%)",
      ring: "hsl(224.3 76.3% 48%)",
    },
  },
  // Nimble Light
  {
    id: "nimble",
    name: "Nimble Classic",
    description: "Warm parchment tones inspired by tabletop RPGs",
    isDark: false,
    colors: {
      background: "hsl(43 30% 94%)", // Parchment white
      foreground: "hsl(25 20% 20%)", // Dark brown
      card: "hsl(40 35% 92%)", // Cream
      cardForeground: "hsl(25 20% 20%)",
      popover: "hsl(40 35% 92%)",
      popoverForeground: "hsl(25 20% 20%)",
      primary: "hsl(30 60% 50%)", // Warm orange-brown
      primaryForeground: "hsl(40 35% 95%)",
      secondary: "hsl(38 25% 85%)", // Light tan
      secondaryForeground: "hsl(25 20% 20%)",
      muted: "hsl(38 20% 80%)", // Muted tan
      mutedForeground: "hsl(25 15% 40%)",
      accent: "hsl(35 40% 75%)", // Soft gold
      accentForeground: "hsl(25 20% 20%)",
      destructive: "hsl(0 60% 50%)", // Muted red
      destructiveForeground: "hsl(40 35% 95%)",
      border: "hsl(35 20% 75%)", // Tan border
      input: "hsl(35 20% 75%)",
      ring: "hsl(30 60% 50%)",
    },
    custom: {
      "--nimble-solid-bg": "#f2ebda",
      "--nimble-passive-bg": "#d8d2c2",
      "--nimble-accent": "#8b7355",
      "--nimble-text": "#3a3028",
    },
  },
  // Nimble Dark
  {
    id: "nimble-dark",
    name: "Nimble Dark",
    description: "Dark parchment theme for nighttime adventures",
    isDark: true,
    colors: {
      background: "hsl(30 15% 12%)", // Very dark brown
      foreground: "hsl(40 20% 85%)", // Light cream
      card: "hsl(30 18% 15%)",
      cardForeground: "hsl(40 20% 85%)",
      popover: "hsl(30 18% 15%)",
      popoverForeground: "hsl(40 20% 85%)",
      primary: "hsl(30 50% 60%)", // Warm amber
      primaryForeground: "hsl(30 15% 12%)",
      secondary: "hsl(30 15% 22%)", // Dark brown
      secondaryForeground: "hsl(40 20% 85%)",
      muted: "hsl(30 12% 25%)",
      mutedForeground: "hsl(35 15% 60%)",
      accent: "hsl(35 35% 45%)", // Muted gold
      accentForeground: "hsl(40 20% 85%)",
      destructive: "hsl(0 50% 45%)", // Dark red
      destructiveForeground: "hsl(40 20% 85%)",
      border: "hsl(30 12% 25%)",
      input: "hsl(30 12% 25%)",
      ring: "hsl(30 50% 60%)",
    },
    custom: {
      "--nimble-solid-bg": "#2a2922",
      "--nimble-passive-bg": "#3a3930",
      "--nimble-accent": "#9b8365",
      "--nimble-text": "#e5dfd5",
    },
  },
  // Forest Light
  {
    id: "forest",
    name: "Forest",
    description: "Deep greens and earthy browns for nature lovers",
    isDark: false,
    colors: {
      background: "hsl(60 10% 96%)", // Very light green-gray
      foreground: "hsl(140 30% 15%)", // Deep forest green
      card: "hsl(60 15% 94%)",
      cardForeground: "hsl(140 30% 15%)",
      popover: "hsl(60 15% 94%)",
      popoverForeground: "hsl(140 30% 15%)",
      primary: "hsl(140 40% 40%)", // Forest green
      primaryForeground: "hsl(60 20% 96%)",
      secondary: "hsl(80 20% 85%)", // Light sage
      secondaryForeground: "hsl(140 30% 15%)",
      muted: "hsl(80 15% 80%)",
      mutedForeground: "hsl(140 20% 35%)",
      accent: "hsl(100 30% 65%)", // Leaf green
      accentForeground: "hsl(140 30% 15%)",
      destructive: "hsl(10 60% 45%)", // Autumn red
      destructiveForeground: "hsl(60 20% 96%)",
      border: "hsl(80 15% 75%)",
      input: "hsl(80 15% 75%)",
      ring: "hsl(140 40% 40%)",
    },
  },
  // Forest Dark
  {
    id: "forest-dark",
    name: "Forest Night",
    description: "Deep forest at night with moonlit greens",
    isDark: true,
    colors: {
      background: "hsl(140 20% 10%)", // Very dark green
      foreground: "hsl(80 15% 85%)", // Light sage
      card: "hsl(140 22% 13%)",
      cardForeground: "hsl(80 15% 85%)",
      popover: "hsl(140 22% 13%)",
      popoverForeground: "hsl(80 15% 85%)",
      primary: "hsl(140 35% 50%)", // Brighter forest green
      primaryForeground: "hsl(140 20% 10%)",
      secondary: "hsl(140 18% 20%)", // Dark forest
      secondaryForeground: "hsl(80 15% 85%)",
      muted: "hsl(140 15% 25%)",
      mutedForeground: "hsl(100 15% 60%)",
      accent: "hsl(100 30% 45%)", // Muted leaf green
      accentForeground: "hsl(80 15% 85%)",
      destructive: "hsl(10 50% 40%)", // Dark autumn red
      destructiveForeground: "hsl(80 15% 85%)",
      border: "hsl(140 15% 25%)",
      input: "hsl(140 15% 25%)",
      ring: "hsl(140 35% 50%)",
    },
  },
  // Ocean Light
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool blues and teals for a calming experience",
    isDark: false,
    colors: {
      background: "hsl(200 20% 97%)", // Very light blue-gray
      foreground: "hsl(200 50% 15%)", // Deep ocean blue
      card: "hsl(200 25% 95%)",
      cardForeground: "hsl(200 50% 15%)",
      popover: "hsl(200 25% 95%)",
      popoverForeground: "hsl(200 50% 15%)",
      primary: "hsl(200 60% 45%)", // Ocean blue
      primaryForeground: "hsl(200 20% 97%)",
      secondary: "hsl(180 20% 85%)", // Light teal
      secondaryForeground: "hsl(200 50% 15%)",
      muted: "hsl(180 15% 80%)",
      mutedForeground: "hsl(200 30% 35%)",
      accent: "hsl(180 40% 60%)", // Turquoise
      accentForeground: "hsl(200 50% 15%)",
      destructive: "hsl(350 60% 50%)", // Coral
      destructiveForeground: "hsl(200 20% 97%)",
      border: "hsl(180 15% 75%)",
      input: "hsl(180 15% 75%)",
      ring: "hsl(200 60% 45%)",
    },
  },
  // Ocean Dark
  {
    id: "ocean-dark",
    name: "Deep Ocean",
    description: "Deep sea darkness with bioluminescent blues",
    isDark: true,
    colors: {
      background: "hsl(200 30% 8%)", // Very dark ocean blue
      foreground: "hsl(180 20% 85%)", // Light teal
      card: "hsl(200 32% 11%)",
      cardForeground: "hsl(180 20% 85%)",
      popover: "hsl(200 32% 11%)",
      popoverForeground: "hsl(180 20% 85%)",
      primary: "hsl(200 55% 55%)", // Bright ocean blue
      primaryForeground: "hsl(200 30% 8%)",
      secondary: "hsl(200 25% 18%)", // Dark ocean
      secondaryForeground: "hsl(180 20% 85%)",
      muted: "hsl(200 20% 22%)",
      mutedForeground: "hsl(180 18% 60%)",
      accent: "hsl(180 40% 45%)", // Deep turquoise
      accentForeground: "hsl(180 20% 85%)",
      destructive: "hsl(350 50% 40%)", // Deep coral
      destructiveForeground: "hsl(180 20% 85%)",
      border: "hsl(200 20% 22%)",
      input: "hsl(200 20% 22%)",
      ring: "hsl(200 55% 55%)",
    },
  },
  // Sunset Light
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm oranges and purples for a vibrant feel",
    isDark: false,
    colors: {
      background: "hsl(30 30% 96%)", // Warm off-white
      foreground: "hsl(280 30% 20%)", // Deep purple
      card: "hsl(30 35% 94%)",
      cardForeground: "hsl(280 30% 20%)",
      popover: "hsl(30 35% 94%)",
      popoverForeground: "hsl(280 30% 20%)",
      primary: "hsl(15 70% 55%)", // Sunset orange
      primaryForeground: "hsl(30 30% 96%)",
      secondary: "hsl(280 25% 85%)", // Light lavender
      secondaryForeground: "hsl(280 30% 20%)",
      muted: "hsl(280 20% 80%)",
      mutedForeground: "hsl(280 20% 40%)",
      accent: "hsl(300 40% 65%)", // Pink-purple
      accentForeground: "hsl(280 30% 20%)",
      destructive: "hsl(0 70% 55%)", // Bright red
      destructiveForeground: "hsl(30 30% 96%)",
      border: "hsl(280 15% 75%)",
      input: "hsl(280 15% 75%)",
      ring: "hsl(15 70% 55%)",
    },
  },
  // Sunset Dark
  {
    id: "sunset-dark",
    name: "Twilight",
    description: "Deep purples and oranges of dusk",
    isDark: true,
    colors: {
      background: "hsl(280 25% 10%)", // Very dark purple
      foreground: "hsl(30 25% 85%)", // Light warm
      card: "hsl(280 28% 13%)",
      cardForeground: "hsl(30 25% 85%)",
      popover: "hsl(280 28% 13%)",
      popoverForeground: "hsl(30 25% 85%)",
      primary: "hsl(15 65% 60%)", // Bright sunset orange
      primaryForeground: "hsl(280 25% 10%)",
      secondary: "hsl(280 20% 20%)", // Dark purple
      secondaryForeground: "hsl(30 25% 85%)",
      muted: "hsl(280 18% 25%)",
      mutedForeground: "hsl(300 20% 60%)",
      accent: "hsl(300 35% 50%)", // Muted pink-purple
      accentForeground: "hsl(30 25% 85%)",
      destructive: "hsl(0 60% 45%)", // Deep red
      destructiveForeground: "hsl(30 25% 85%)",
      border: "hsl(280 18% 25%)",
      input: "hsl(280 18% 25%)",
      ring: "hsl(15 65% 60%)",
    },
  },
  // Midnight (inherently dark)
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep blues and purples for late night coding",
    isDark: true,
    colors: {
      background: "hsl(220 20% 10%)", // Very dark blue
      foreground: "hsl(210 20% 90%)", // Light gray
      card: "hsl(220 25% 13%)",
      cardForeground: "hsl(210 20% 90%)",
      popover: "hsl(220 25% 13%)",
      popoverForeground: "hsl(210 20% 90%)",
      primary: "hsl(260 60% 60%)", // Purple
      primaryForeground: "hsl(220 20% 10%)",
      secondary: "hsl(220 20% 20%)", // Dark blue-gray
      secondaryForeground: "hsl(210 20% 90%)",
      muted: "hsl(220 15% 25%)",
      mutedForeground: "hsl(210 15% 65%)",
      accent: "hsl(280 50% 50%)", // Violet
      accentForeground: "hsl(210 20% 90%)",
      destructive: "hsl(0 60% 60%)", // Light red
      destructiveForeground: "hsl(220 20% 10%)",
      border: "hsl(220 15% 25%)",
      input: "hsl(220 15% 25%)",
      ring: "hsl(260 60% 60%)",
    },
  },
];

// Helper function to get theme family from theme ID
export function getThemeFamily(themeId: string): string {
  return themeId.replace(/-dark$/, "");
}

// Helper function to find matching theme for a color mode
export function findThemeForMode(currentFamily: string, isDark: boolean): Theme | undefined {
  // First try to find a theme in the same family
  const familyTheme = themes.find(
    (t) => getThemeFamily(t.id) === currentFamily && t.isDark === isDark
  );
  
  if (familyTheme) return familyTheme;
  
  // Otherwise, return the first theme matching the mode
  return themes.find((t) => t.isDark === isDark);
}