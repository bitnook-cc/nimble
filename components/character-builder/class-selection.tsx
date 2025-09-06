"use client";

import { ChevronDown, ChevronRight } from "lucide-react";

import { useState } from "react";

import { ClassDefinition } from "@/lib/types/class";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

interface ClassSelectionProps {
  availableClasses: ClassDefinition[];
  selectedClassId?: string;
  onClassSelect: (classId: string) => void;
}

export function ClassSelection({
  availableClasses,
  selectedClassId,
  onClassSelect,
}: ClassSelectionProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCardExpansion = (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card selection when expanding
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const handleCardClick = (classId: string) => {
    onClassSelect(classId);
  };

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Choose Your Class</h2>
        <p className="text-sm text-muted-foreground">
          Select the class that defines your character&apos;s role and abilities
        </p>
      </div>

      <div className="space-y-2">
        {availableClasses.map((cls: ClassDefinition) => (
          <Card
            key={cls.id}
            className={`cursor-pointer transition-all ${
              selectedClassId === cls.id
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:shadow-md hover:bg-muted/50"
            }`}
            onClick={() => handleCardClick(cls.id)}
          >
            <Collapsible
              open={expandedCards.has(cls.id)}
              onOpenChange={(open) => toggleCardExpansion(cls.id, {} as React.MouseEvent)}
            >
              <CardHeader className="pb-2 pt-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <CardTitle className="text-base">{cls.name}</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                      {cls.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={(e) => toggleCardExpansion(cls.id, e)}
                      >
                        {expandedCards.has(cls.id) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="border-t pt-2">
                    <h4 className="text-sm font-medium mb-1">Key Attributes</h4>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {cls.keyAttributes.map((attr) => (
                        <Badge
                          key={attr}
                          variant="secondary"
                          className="capitalize text-xs px-1 py-0"
                        >
                          {attr}
                        </Badge>
                      ))}
                    </div>
                    <h4 className="text-sm font-medium mb-1">Starting Proficiencies</h4>
                    <p className="text-xs text-muted-foreground break-words">
                      Armor:{" "}
                      {cls.armorProficiencies
                        ?.map((p) => (p.type === "freeform" ? p.name : p.type))
                        .join(", ") || "None"}{" "}
                      • Weapons:{" "}
                      {cls.weaponProficiencies
                        ?.map((p) => (p.type === "freeform" ? p.name : p.type.replace("_", " ")))
                        .join(", ") || "None"}
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
}
