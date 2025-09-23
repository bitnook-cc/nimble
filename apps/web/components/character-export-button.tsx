"use client";

import { Download } from "lucide-react";

import { useState } from "react";

import { useToastService } from "@/lib/hooks/use-toast-service";
import type { Character } from "@/lib/schemas/character";
import { characterImportExportService } from "@/lib/services/character-import-export-service";

import { Button } from "./ui/button";

interface CharacterExportButtonProps {
  character: Character;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "sm" | "default" | "lg";
  showText?: boolean;
}

export function CharacterExportButton({
  character,
  variant = "ghost",
  size = "sm",
  showText = false,
}: CharacterExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const toastService = useToastService();

  const handleExport = async () => {
    setIsExporting(true);

    try {
      characterImportExportService.exportCharacter(character);

      toastService.addToast({
        title: "Character Exported",
        description: `${character.name} has been exported successfully.`,
        type: "success",
      });
    } catch (error) {
      toastService.addToast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export character.",
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant={variant}
      size={size}
      className={showText ? "gap-2" : ""}
      title={`Export ${character.name}`}
    >
      <Download className="h-4 w-4" />
      {showText && (isExporting ? "Exporting..." : "Export")}
    </Button>
  );
}
