"use client";

import { Monitor, Moon, Palette, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { getThemeFamily, themes } from "@/lib/data/themes";
import { themeService } from "@/lib/services/theme-service";

import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";

interface ThemeSelectorProps {
  currentThemeId?: string;
  onThemeChange?: () => void;
}

export function ThemeSelector({ currentThemeId: propThemeId, onThemeChange }: ThemeSelectorProps) {
  const [currentThemeId, setCurrentThemeId] = useState(propThemeId || themeService.getCurrentThemeId());
  const [colorMode, setColorMode] = useState<"light" | "dark" | "system">("light");
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // Initialize from prop or service
    const themeId = propThemeId || themeService.getCurrentThemeId();
    const theme = themeService.getThemeById(themeId);
    if (theme) {
      setCurrentThemeId(theme.id);
      setColorMode(theme.isDark ? "dark" : "light");
    }
  }, [propThemeId]);

  useEffect(() => {
    // Listen for system theme changes if in system mode
    if (colorMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = async () => {
        setIsChanging(true);
        await themeService.setColorMode("system");
        setCurrentThemeId(themeService.getCurrentThemeId());
        onThemeChange?.();
        setIsChanging(false);
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [colorMode, onThemeChange]);

  const handleThemeChange = async (themeId: string) => {
    setIsChanging(true);
    await themeService.setTheme(themeId);
    setCurrentThemeId(themeId);
    
    // Update color mode based on the selected theme
    const theme = themeService.getThemeById(themeId);
    if (theme) {
      setColorMode(theme.isDark ? "dark" : "light");
    }
    
    onThemeChange?.();
    setIsChanging(false);
  };

  const handleColorModeChange = async (mode: "light" | "dark" | "system") => {
    setIsChanging(true);
    setColorMode(mode);
    await themeService.setColorMode(mode);
    setCurrentThemeId(themeService.getCurrentThemeId());
    onThemeChange?.();
    setIsChanging(false);
  };

  // Get current theme family
  const currentFamily = getThemeFamily(currentThemeId);

  // Filter themes to show only those matching current color mode preference
  const visibleThemes = themes.filter((theme) => {
    if (colorMode === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return theme.isDark === prefersDark;
    }
    return theme.isDark === (colorMode === "dark");
  });

  return (
    <div className="space-y-6">
      {/* Color Mode Selection */}
      <div className="space-y-3">
        <Label>Color Mode</Label>
        <RadioGroup 
          value={colorMode} 
          onValueChange={handleColorModeChange}
          disabled={isChanging}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="light" id="light-mode" />
            <Label htmlFor="light-mode" className="flex items-center gap-2 cursor-pointer">
              <Sun className="w-4 h-4" />
              Light
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dark" id="dark-mode" />
            <Label htmlFor="dark-mode" className="flex items-center gap-2 cursor-pointer">
              <Moon className="w-4 h-4" />
              Dark
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="system" id="system-mode" />
            <Label htmlFor="system-mode" className="flex items-center gap-2 cursor-pointer">
              <Monitor className="w-4 h-4" />
              System
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Theme Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <Label htmlFor="theme-select">Theme Style</Label>
        </div>
        <Select 
          value={currentThemeId} 
          onValueChange={handleThemeChange}
          disabled={isChanging}
        >
          <SelectTrigger id="theme-select" className="w-full">
            <SelectValue placeholder="Select a theme" />
          </SelectTrigger>
          <SelectContent>
            {visibleThemes.map((theme) => (
              <SelectItem key={theme.id} value={theme.id}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{theme.name}</span>
                  <span className="text-xs text-muted-foreground">{theme.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {colorMode === "system" 
            ? "Showing themes for your system preference" 
            : `Showing ${colorMode} themes`}
        </p>
      </div>

      {/* Theme Preview */}
      <div className="space-y-3">
        <Label>Preview</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-md border bg-background text-foreground">
            <div className="text-xs font-medium mb-1">Background</div>
            <div className="text-xs text-muted-foreground">Default surface</div>
          </div>
          <div className="p-3 rounded-md border bg-card text-card-foreground">
            <div className="text-xs font-medium mb-1">Card</div>
            <div className="text-xs text-muted-foreground">Content cards</div>
          </div>
          <div className="p-3 rounded-md bg-primary text-primary-foreground">
            <div className="text-xs font-medium mb-1">Primary</div>
            <div className="text-xs">Main actions</div>
          </div>
          <div className="p-3 rounded-md bg-secondary text-secondary-foreground">
            <div className="text-xs font-medium mb-1">Secondary</div>
            <div className="text-xs">Supporting elements</div>
          </div>
        </div>
      </div>
    </div>
  );
}