"use client";

import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";

import { genericNames } from "@/lib/config/name-config";
import { AncestryDefinition } from "@/lib/schemas/ancestry";
import { NameGenerator } from "@/lib/utils/name-generator";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent } from "../ui/collapsible";
import { Input } from "../ui/input";
import { MarkdownRenderer } from "../ui/markdown-renderer";

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
  const handleAncestrySelect = (ancestryId: string) => {
    onAncestrySelect(ancestryId);
  };

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
          {availableAncestries.map((ancestry: AncestryDefinition) => {
            const isSelected = selectedAncestryId === ancestry.id;

            return (
              <Card
                key={ancestry.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:shadow-md hover:bg-muted/50"
                }`}
                onClick={() => handleAncestrySelect(ancestry.id)}
              >
                <Collapsible open={isSelected}>
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <CardTitle className="text-sm">{ancestry.name}</CardTitle>
                          <Badge variant="outline" className="text-xs capitalize px-1 py-0">
                            {ancestry.size}
                          </Badge>
                        </div>
                        {!isSelected && (
                          <div className="text-xs text-muted-foreground line-clamp-2 break-words">
                            <MarkdownRenderer content={ancestry.description} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="w-8 h-8 flex items-center justify-center">
                          {isSelected ? (
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="border-t pt-2 space-y-2">
                        <div className="text-sm text-muted-foreground break-words">
                          <MarkdownRenderer content={ancestry.description} />
                        </div>
                        {ancestry.features && ancestry.features.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Starting Features</h4>
                            <div className="space-y-1">
                              {ancestry.features.map((feature, idx) => (
                                <div key={idx} className="text-xs">
                                  <span className="font-medium">{feature.name}</span>
                                  {feature.description && (
                                    <div className="text-muted-foreground prose prose-sm max-w-none">
                                      <MarkdownRenderer content={feature.description} />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
