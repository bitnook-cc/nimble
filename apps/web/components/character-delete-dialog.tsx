"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Cloud, Trash2 } from "lucide-react";
import { Character } from "@/lib/schemas/character";
import { syncService } from "@/lib/services/sync/sync-service";
import { authService } from "@/lib/services/auth-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Alert, AlertDescription } from "./ui/alert";

interface CharacterDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  isLastCharacter: boolean;
  isActiveCharacter: boolean;
  onDelete: (characterId: string, deleteFromServer: boolean) => Promise<void>;
}

export function CharacterDeleteDialog({
  isOpen,
  onClose,
  character,
  isLastCharacter,
  isActiveCharacter,
  onDelete,
}: CharacterDeleteDialogProps) {
  const [deleteFromServer, setDeleteFromServer] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsAuthenticated(authService.isAuthenticated());
    }
  }, [isOpen]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(character.id, deleteFromServer);
      onClose();
    } catch (error) {
      console.error("Failed to delete character:", error);
      alert("Failed to delete character. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Character
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{character.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLastCharacter && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This is your last character. You'll need to create a new one after deletion.
              </AlertDescription>
            </Alert>
          )}

          {isActiveCharacter && !isLastCharacter && (
            <Alert>
              <AlertDescription>
                This is your currently active character. Another character will be selected automatically.
              </AlertDescription>
            </Alert>
          )}

          {isAuthenticated && (
            <div className="flex items-start space-x-3 p-4 rounded-lg border">
              <Checkbox
                id="delete-from-server"
                checked={deleteFromServer}
                onCheckedChange={(checked) => setDeleteFromServer(checked as boolean)}
                disabled={isDeleting}
              />
              <div className="space-y-1">
                <label
                  htmlFor="delete-from-server"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Also delete from server backup
                  </span>
                </label>
                <p className="text-sm text-muted-foreground">
                  Remove this character's backup from the cloud. The character will only exist locally until you sync again.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              "Deleting..."
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Character
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}