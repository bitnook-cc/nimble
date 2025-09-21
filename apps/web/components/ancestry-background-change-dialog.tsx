"use client";

import { useState } from "react";

import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { getCharacterService } from "@/lib/services/service-factory";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface AncestryBackgroundChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAncestryId: string;
  currentBackgroundId: string;
}

export function AncestryBackgroundChangeDialog({
  open,
  onOpenChange,
  currentAncestryId,
  currentBackgroundId,
}: AncestryBackgroundChangeDialogProps) {
  const [selectedAncestryId, setSelectedAncestryId] = useState(currentAncestryId);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(currentBackgroundId);
  const [activeSection, setActiveSection] = useState<"ancestry" | "background">("ancestry");

  const contentRepository = ContentRepositoryService.getInstance();
  const availableAncestries = contentRepository.getAllAncestries();
  const availableBackgrounds = contentRepository.getAllBackgrounds();

  const hasChanges = 
    selectedAncestryId !== currentAncestryId || 
    selectedBackgroundId !== currentBackgroundId;

  const handleSave = async () => {
    if (!hasChanges) {
      onOpenChange(false);
      return;
    }

    const characterService = getCharacterService();
    
    // Update ancestry and/or background if changed
    const updates: { ancestryId?: string; backgroundId?: string } = {};
    
    if (selectedAncestryId !== currentAncestryId) {
      updates.ancestryId = selectedAncestryId;
    }
    
    if (selectedBackgroundId !== currentBackgroundId) {
      updates.backgroundId = selectedBackgroundId;
    }

    await characterService.updateCharacterFields(updates);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset selections to current values
    setSelectedAncestryId(currentAncestryId);
    setSelectedBackgroundId(currentBackgroundId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Change Ancestry & Background</DialogTitle>
          <DialogDescription>
            Update your character's ancestry and background. This will preserve your current progress.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1">
          {/* Toggle Buttons */}
          <div className="grid w-full grid-cols-2 mb-4">
            <Button
              variant={activeSection === "ancestry" ? "default" : "outline"}
              onClick={() => setActiveSection("ancestry")}
              className="rounded-r-none"
            >
              Ancestry
            </Button>
            <Button
              variant={activeSection === "background" ? "default" : "outline"}
              onClick={() => setActiveSection("background")}
              className="rounded-l-none"
            >
              Background
            </Button>
          </div>

          {/* Ancestry Section */}
          {activeSection === "ancestry" && (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-1">Select Ancestry</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose your character's ancestry
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableAncestries.map((ancestry) => (
                    <Card
                      key={ancestry.id}
                      className={`cursor-pointer transition-all ${
                        selectedAncestryId === ancestry.id 
                          ? "ring-2 ring-primary" 
                          : "hover:shadow-md"
                      }`}
                      onClick={() => setSelectedAncestryId(ancestry.id)}
                    >
                      <CardHeader className="pb-1 pt-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{ancestry.name}</CardTitle>
                          {selectedAncestryId === ancestry.id && (
                            <Badge className="ml-1 text-xs px-1">Selected</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-3 break-words">
                          {ancestry.description}
                        </p>
                        {ancestry.size && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              Size: {ancestry.size}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Background Section */}
          {activeSection === "background" && (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-1">Select Background</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose your character's background and cultural origins
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableBackgrounds.map((background) => (
                    <Card
                      key={background.id}
                      className={`cursor-pointer transition-all ${
                        selectedBackgroundId === background.id 
                          ? "ring-2 ring-primary" 
                          : "hover:shadow-md"
                      }`}
                      onClick={() => setSelectedBackgroundId(background.id)}
                    >
                      <CardHeader className="pb-1 pt-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{background.name}</CardTitle>
                          {selectedBackgroundId === background.id && (
                            <Badge className="ml-1 text-xs px-1">Selected</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-3 break-words">
                          {background.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            {hasChanges ? "Save Changes" : "No Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}