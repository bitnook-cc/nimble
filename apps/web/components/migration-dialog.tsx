"use client";

import { AlertCircle, CheckCircle2, Download } from "lucide-react";

import { useEffect, useState } from "react";

import { MigrationProgress, MigrationResult } from "../lib/schemas/migration/types";
import { MigrationService } from "../lib/services/migration-service";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

interface MigrationDialogProps {
  open: boolean;
  charactersToMigrate: any[];
  onMigrationComplete: (result: MigrationResult) => void;
}

export function MigrationDialog({
  open,
  charactersToMigrate,
  onMigrationComplete,
}: MigrationDialogProps) {
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (open && charactersToMigrate.length > 0 && !isRunning && !result) {
      runMigration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, charactersToMigrate.length]); // Only depend on length to avoid re-running on reference changes

  const runMigration = async () => {
    setIsRunning(true);
    const migrationService = MigrationService.getInstance();

    // Set up progress callback
    migrationService.setProgressCallback((progress) => {
      setProgress(progress);
    });

    try {
      const migrationResult = await migrationService.migrateCharacters(charactersToMigrate);
      setResult(migrationResult);
      onMigrationComplete(migrationResult);
    } catch (error) {
      const errorResult: MigrationResult = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        failedCharacters: charactersToMigrate,
      };
      setResult(errorResult);
      onMigrationComplete(errorResult);
    } finally {
      migrationService.clearProgressCallback();
      setIsRunning(false);
    }
  };

  const handleDownloadBackup = () => {
    if (result?.failedCharacters) {
      const migrationService = MigrationService.getInstance();
      migrationService.downloadBackup(
        result.failedCharacters,
        `failed-characters-${new Date().toISOString().split("T")[0]}.json`,
      );
    }
  };

  const getProgressMessage = () => {
    if (!progress) return "Preparing migration...";

    return `Migrating ${progress.currentCharacter} (${progress.currentCharacterIndex + 1}/${progress.totalCharacters})`;
  };

  const getSubMessage = () => {
    if (!progress) return "";

    return progress.currentMigration;
  };

  return (
    <Dialog open={open} modal>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {result
              ? result.success
                ? "Migration Complete"
                : "Migration Failed"
              : "Updating Characters"}
          </DialogTitle>
          <DialogDescription>
            {result
              ? result.success
                ? `Successfully updated ${result.migratedCount} character(s) to the latest version.`
                : "Some characters could not be updated to the latest version."
              : "Your characters need to be updated to work with the latest version of the app."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!result && (
            <>
              <div className="space-y-2">
                <div className="text-sm font-medium">{getProgressMessage()}</div>
                {getSubMessage() && (
                  <div className="text-xs text-muted-foreground">{getSubMessage()}</div>
                )}
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress?.overallProgress || 0}%` }}
                  />
                </div>
              </div>
            </>
          )}

          {result && !result.success && (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {result.error}
                  {result.failedCharacters && result.failedCharacters.length > 0 && (
                    <div className="mt-2">
                      Failed to migrate {result.failedCharacters.length} character(s). Download the
                      backup to preserve your data.
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {result.failedCharacters && result.failedCharacters.length > 0 && (
                <Button onClick={handleDownloadBackup} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Character Backup
                </Button>
              )}
            </>
          )}

          {result && result.success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>All characters have been successfully updated!</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
