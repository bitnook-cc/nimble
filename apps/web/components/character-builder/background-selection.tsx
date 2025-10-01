"use client";

import { ChevronDown, ChevronRight } from "lucide-react";

import { BackgroundDefinition } from "@/lib/schemas/background";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent } from "../ui/collapsible";
import { MarkdownRenderer } from "../ui/markdown-renderer";

interface BackgroundSelectionProps {
  availableBackgrounds: BackgroundDefinition[];
  selectedBackgroundId?: string;
  onBackgroundSelect: (backgroundId: string) => void;
}

export function BackgroundSelection({
  availableBackgrounds,
  selectedBackgroundId,
  onBackgroundSelect,
}: BackgroundSelectionProps) {
  const handleBackgroundSelect = (backgroundId: string) => {
    onBackgroundSelect(backgroundId);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Character Background</h2>
        <p className="text-sm text-muted-foreground">
          Choose your character&apos;s background and cultural origins
        </p>
      </div>

      {/* Background Selection */}
      <div>
        <h3 className="text-base font-semibold mb-2">Background</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {availableBackgrounds.map((background: BackgroundDefinition) => {
            const isSelected = selectedBackgroundId === background.id;

            return (
              <Card
                key={background.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:shadow-md hover:bg-muted/50"
                }`}
                onClick={() => handleBackgroundSelect(background.id)}
              >
                <Collapsible open={isSelected}>
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm mb-1">{background.name}</CardTitle>
                        {!isSelected && (
                          <div className="text-xs text-muted-foreground line-clamp-2 break-words">
                            <MarkdownRenderer content={background.description} />
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
                          <MarkdownRenderer content={background.description} />
                        </div>
                        {background.features && background.features.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Passive Features</h4>
                            <div className="space-y-1">
                              {background.features.map((feature, idx) => (
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
