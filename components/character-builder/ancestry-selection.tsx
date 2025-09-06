"use client";

import { Sparkles } from "lucide-react";

import { genericNames } from "@/lib/config/name-config";
import { AncestryDefinition } from "@/lib/types/ancestry";
import { NameGenerator } from "@/lib/utils/name-generator";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

interface AncestrySelectionProps {
  availableAncestries: AncestryDefinition[];
  selectedAncestryId?: string;
  characterName: string;
  onAncestrySelect: (ancestryId: string) => void;
  onNameChange: (name: string) => void;
}

export function AncestrySelection({
  availableAncestries,
  selectedAncestryId,
  characterName,
  onAncestrySelect,
  onNameChange,
}: AncestrySelectionProps) {
  const handleSuggestName = () => {
    if (selectedAncestryId) {
      const ancestry = availableAncestries.find((a) => a.id === selectedAncestryId);
      const config = ancestry?.nameConfig || genericNames;

      try {
        const randomGender = Math.random() > 0.5 ? "male" : "female";
        const randomName = NameGenerator.generateFullName(config, randomGender);
        onNameChange(randomName);
      } catch (error) {
        console.error("Failed to generate name:", error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Character Ancestry</h2>
        <p className="text-sm text-muted-foreground">
          Choose your character&apos;s ancestry and name
        </p>
      </div>

      {/* Character Name - Sticky */}
      <div className="sticky top-0 bg-background z-10 pb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Character Name</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={characterName}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Enter character name"
                  className="text-sm"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleSuggestName}
                disabled={!selectedAncestryId}
                size="sm"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Suggest
              </Button>
            </div>
            {selectedAncestryId && (
              <p className="text-xs text-muted-foreground mt-2">
                Click &quot;Suggest&quot; for{" "}
                {availableAncestries.find((a) => a.id === selectedAncestryId)?.name} names
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ancestry Selection */}
      <div>
        <h3 className="text-base font-semibold mb-2">Ancestry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {availableAncestries.map((ancestry: AncestryDefinition) => (
            <Card
              key={ancestry.id}
              className={`cursor-pointer transition-all ${
                selectedAncestryId === ancestry.id ? "ring-2 ring-primary" : "hover:shadow-md"
              }`}
              onClick={() => onAncestrySelect(ancestry.id)}
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
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2 break-words">
                  {ancestry.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs capitalize px-1 py-0">
                    {ancestry.size}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
