"use client";

import { AppSettings, settingsService } from "@/lib/services/settings-service";

import { ThemeSelector } from "./theme-selector";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Separator } from "./ui/separator";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function SettingsPanel({ isOpen, onClose, settings, onSettingsChange }: SettingsPanelProps) {
  const handleThemeChange = async () => {
    // Reload settings after theme change to sync state
    const updatedSettings = await settingsService.getSettings();
    onSettingsChange(updatedSettings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure app settings and preferences for your character sheet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <ThemeSelector currentThemeId={settings.themeId} onThemeChange={handleThemeChange} />
            </CardContent>
          </Card>

          <Separator />

          {/* Current Character Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active Character</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {settings.activeCharacterId ? (
                  <>Character ID: {settings.activeCharacterId}</>
                ) : (
                  "No active character selected"
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Use the Characters menu to switch between characters
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
