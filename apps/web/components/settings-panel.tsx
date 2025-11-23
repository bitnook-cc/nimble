"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import { beyond20SharingService } from "@/lib/integrations/beyond20";
import { useBeyond20 } from "@/lib/integrations/beyond20/use-beyond20";
import { AppSettings, settingsService } from "@/lib/services/settings-service";

import { ThemeSelector } from "./theme-selector";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function SettingsPanel({ isOpen, onClose, settings, onSettingsChange }: SettingsPanelProps) {
  const beyond20 = useBeyond20();

  const handleThemeChange = async () => {
    // Reload settings after theme change to sync state
    const updatedSettings = await settingsService.getSettings();
    onSettingsChange(updatedSettings);
  };

  const handleBeyond20Toggle = async (enabled: boolean) => {
    await settingsService.updateBeyond20Enabled(enabled);
    const updatedSettings = await settingsService.getSettings();
    onSettingsChange(updatedSettings);

    // Activate the Beyond20 icon when enabled
    if (enabled) {
      beyond20SharingService.activateIcon();
    }
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

          {/* Beyond20 Integration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">VTT Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Beyond20</Label>
                    {beyond20.isInstalled ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Send dice rolls to Roll20, Foundry VTT, and other platforms
                  </p>
                </div>
                <Switch
                  checked={settings.beyond20Enabled ?? false}
                  onCheckedChange={handleBeyond20Toggle}
                  disabled={!beyond20.isInstalled}
                />
              </div>
              {!beyond20.isInstalled && (
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  Beyond20 extension not detected. Install the extension and add this domain to
                  enable VTT integration.
                </p>
              )}
              {beyond20.isInstalled && (
                <p className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-2 rounded">
                  Beyond20 detected and ready
                </p>
              )}
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
