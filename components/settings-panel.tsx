"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { AppSettings } from "@/lib/services/settings-service";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function SettingsPanel({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange 
}: SettingsPanelProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Character Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active Character</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Character ID: {settings.activeCharacterId}
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