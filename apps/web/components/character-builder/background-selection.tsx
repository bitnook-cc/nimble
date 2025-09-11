"use client";

import { BackgroundDefinition } from "@/lib/schemas/background";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
          {availableBackgrounds.map((background: BackgroundDefinition) => (
            <Card
              key={background.id}
              className={`cursor-pointer transition-all ${
                selectedBackgroundId === background.id ? "ring-2 ring-primary" : "hover:shadow-md"
              }`}
              onClick={() => onBackgroundSelect(background.id)}
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
    </div>
  );
}
