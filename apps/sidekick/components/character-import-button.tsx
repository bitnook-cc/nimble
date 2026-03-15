"use client";

import { Upload } from "lucide-react";

import { useRef, useState } from "react";

import { useToastService } from "@/lib/hooks/use-toast-service";
import {
  type ImportResult,
  characterImportExportService,
} from "@/lib/services/character-import-export-service";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface CharacterImportButtonProps {
  onImportSuccess?: () => void;
}

export function CharacterImportButton({ onImportSuccess }: CharacterImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [conflictDialog, setConflictDialog] = useState<{
    open: boolean;
    importResult?: ImportResult;
  }>({ open: false });

  const toastService = useToastService();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const fileContent = await readFileAsText(file);
      const result = await characterImportExportService.importCharacter(fileContent);

      if (result.success) {
        toastService.addToast({
          title: "Character Imported",
          description: `${result.character?.name} has been imported successfully.`,
          type: "success",
        });
        onImportSuccess?.();
      } else if (result.needsConfirmation) {
        // Show conflict dialog
        setConflictDialog({
          open: true,
          importResult: result,
        });
      } else {
        toastService.addToast({
          title: "Import Failed",
          description: result.error || "Unknown error occurred during import.",
          type: "error",
        });
      }
    } catch (error) {
      toastService.addToast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to read file.",
        type: "error",
      });
    } finally {
      setIsImporting(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmOverwrite = async () => {
    if (!conflictDialog.importResult?.character) return;

    setIsImporting(true);

    try {
      const fileContent = JSON.stringify(conflictDialog.importResult.character);
      const result = await characterImportExportService.importCharacter(fileContent, true);

      if (result.success) {
        toastService.addToast({
          title: "Character Imported",
          description: `${result.character?.name} has been imported and overwrote the existing character.`,
          type: "success",
        });
        onImportSuccess?.();
      } else {
        toastService.addToast({
          title: "Import Failed",
          description: result.error || "Unknown error occurred during import.",
          type: "error",
        });
      }
    } catch (error) {
      toastService.addToast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import character.",
        type: "error",
      });
    } finally {
      setIsImporting(false);
      setConflictDialog({ open: false });
    }
  };

  const handleCancelImport = () => {
    setConflictDialog({ open: false });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Button
        onClick={handleButtonClick}
        disabled={isImporting}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        {isImporting ? "Importing..." : "Import Character"}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Import character file"
      />

      {/* Conflict resolution dialog */}
      <Dialog open={conflictDialog.open} onOpenChange={() => setConflictDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Character Already Exists</DialogTitle>
            <DialogDescription>
              A character named "{conflictDialog.importResult?.existingCharacter?.name}" with the
              same ID already exists. Do you want to overwrite the existing character?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Existing:</strong> {conflictDialog.importResult?.existingCharacter?.name}
                (Level {conflictDialog.importResult?.existingCharacter?.level})
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Importing:</strong> {conflictDialog.importResult?.character?.name}
                (Level {conflictDialog.importResult?.character?.level})
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelImport} disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={handleConfirmOverwrite} disabled={isImporting}>
              {isImporting ? "Importing..." : "Overwrite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as text"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
