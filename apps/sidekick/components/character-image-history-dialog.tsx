"use client";

import { format } from "date-fns";
import { CheckCircle, Clock, Loader2 } from "lucide-react";

import { useEffect, useState } from "react";

import {
  CharacterImageMetadata,
  characterImageService,
} from "../lib/services/character-image-service";
import { getCharacterService } from "../lib/services/service-factory";
import { CharacterAvatar } from "./character-avatar";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

interface CharacterImageHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  characterName: string;
  currentImageId?: string;
}

export function CharacterImageHistoryDialog({
  open,
  onOpenChange,
  characterId,
  characterName,
  currentImageId,
}: CharacterImageHistoryDialogProps) {
  const [imageHistory, setImageHistory] = useState<CharacterImageMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const loadImageHistory = async () => {
      setIsLoading(true);
      try {
        const history = await characterImageService.getImageHistory(characterId);
        setImageHistory(history);
      } catch (error) {
        console.error("Failed to load image history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      loadImageHistory();
    }
  }, [open, characterId]);

  const handleSelectImage = async (imageId: string) => {
    if (imageId === currentImageId) return;

    setIsSwitching(true);
    setSelectedId(imageId);

    try {
      const characterService = getCharacterService();
      await characterService.updateCharacterFields({
        imageId: imageId,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to switch image:", error);
    } finally {
      setIsSwitching(false);
      setSelectedId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Image History</DialogTitle>
          <DialogDescription>
            View and switch between previous character images for {characterName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : imageHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No images uploaded yet</div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {imageHistory.map((image, index) => {
                const isCurrent = image.id === currentImageId;
                const isSelected = image.id === selectedId;

                return (
                  <div
                    key={image.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border",
                      isCurrent && "border-primary bg-primary/5",
                      !isCurrent && "border-border hover:bg-muted/50",
                    )}
                  >
                    <CharacterAvatar
                      characterId={characterId}
                      characterName={characterName}
                      imageId={image.id}
                      size="thumbnail"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Image {index + 1}</span>
                        {isCurrent && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {format(new Date(image.createdAt), "MMM d, yyyy h:mm a")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Profile: {formatFileSize(image.profileSize)} • Thumbnail:{" "}
                        {formatFileSize(image.thumbnailSize)}
                      </div>
                    </div>

                    <Button
                      variant={isCurrent ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleSelectImage(image.id)}
                      disabled={isCurrent || isSwitching}
                    >
                      {isSelected && isSwitching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isCurrent ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Current
                        </>
                      ) : (
                        "Use This"
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
