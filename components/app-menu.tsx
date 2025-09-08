"use client";

import { Database, Download, Menu, Plus, Settings, Users } from "lucide-react";

import { useState } from "react";

import { pdfExportService } from "@/lib/services/pdf-export-service";
import { getCharacterService } from "@/lib/services/service-factory";
import { AppSettings } from "@/lib/services/settings-service";
import { Character } from "@/lib/schemas/character";

import { CharacterCreateForm } from "./character-create-form";
import { CharacterSelector } from "./character-selector";
import { ContentManagementPanel } from "./content-management-panel";
import { PDFExportDialog, PDFExportOptions } from "./pdf-export-dialog";
import { SettingsPanel } from "./settings-panel";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface AppMenuProps {
  settings: AppSettings;
  characters: Character[];
  onSettingsChange: (settings: AppSettings) => void;
}

export function AppMenu({ settings, characters, onSettingsChange }: AppMenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const [showCreateCharacter, setShowCreateCharacter] = useState(false);
  const [showContentManagement, setShowContentManagement] = useState(false);
  const [showPDFExport, setShowPDFExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleShowPDFExport = () => {
    setShowPDFExport(true);
  };

  const handlePDFExport = async (options: PDFExportOptions) => {
    const characterService = getCharacterService();
    const activeCharacter = characterService.character;

    if (activeCharacter) {
      setIsExporting(true);
      try {
        await pdfExportService.exportCharacterToPDF(activeCharacter, characterService, options);
        setShowPDFExport(false);
      } catch (error) {
        console.error("Failed to export PDF:", error);
        // Could add toast notification here
      } finally {
        setIsExporting(false);
      }
    }
  };

  const activeCharacter = characters.find((c) => c.id === settings.activeCharacterId);

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
            <DropdownMenuItem onClick={handleShowPDFExport}>
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
          <DropdownMenuItem onClick={() => setShowCreateCharacter(true)}>
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

      <PDFExportDialog
        isOpen={showPDFExport}
        onClose={() => setShowPDFExport(false)}
        onExport={handlePDFExport}
        isExporting={isExporting}
      />
    </>
  );
}
