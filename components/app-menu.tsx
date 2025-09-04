"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Menu, Settings, Users, Plus, Database, Download } from "lucide-react";
import { SettingsPanel } from "./settings-panel";
import { CharacterSelector } from "./character-selector";
import { CharacterCreateForm } from "./character-create-form";
import { ContentManagementPanel } from "./content-management-panel";
import { AppSettings } from "@/lib/services/settings-service";
import { Character } from "@/lib/types/character";
import { pdfExportService } from "@/lib/services/pdf-export-service";
import { getCharacterService } from "@/lib/services/service-factory";

interface AppMenuProps {
  settings: AppSettings;
  characters: Character[];
  onSettingsChange: (settings: AppSettings) => void;
}

export function AppMenu({ 
  settings, 
  characters,
  onSettingsChange
}: AppMenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const [showCreateCharacter, setShowCreateCharacter] = useState(false);
  const [showContentManagement, setShowContentManagement] = useState(false);

  const handleExportPDF = async () => {
    const characterService = getCharacterService();
    const activeCharacter = characterService.character;
    
    if (activeCharacter) {
      try {
        await pdfExportService.exportCharacterToPDF(activeCharacter, characterService);
      } catch (error) {
        console.error('Failed to export PDF:', error);
        // Could add toast notification here
      }
    }
  };

  const activeCharacter = characters.find(c => c.id === settings.activeCharacterId);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Menu className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setShowCharacterSelector(true)}>
              <Users className="w-4 h-4 mr-2" />
              Characters
            </DropdownMenuItem>
            {activeCharacter && (
              <DropdownMenuItem onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setShowContentManagement(true)}>
              <Database className="w-4 h-4 mr-2" />
              Manage Content
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setShowCreateCharacter(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Character
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      <SettingsPanel 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />

      <CharacterSelector 
        isOpen={showCharacterSelector}
        onClose={() => setShowCharacterSelector(false)}
        characters={characters}
        activeCharacterId={settings.activeCharacterId}
      />

      <ContentManagementPanel 
        isOpen={showContentManagement}
        onClose={() => setShowContentManagement(false)}
      />

      <Dialog open={showCreateCharacter} onOpenChange={setShowCreateCharacter}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Character</DialogTitle>
          </DialogHeader>
          <CharacterCreateForm
            onComplete={() => setShowCreateCharacter(false)}
            onCancel={() => setShowCreateCharacter(false)}
            showAsCard={false}
            autoFocus={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}