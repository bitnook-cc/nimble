"use client";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { getClassService } from "@/lib/services/service-factory";
import { SubclassChoiceFeatureEffect } from "@/lib/schemas/features";

import { SubclassSelectionDialog } from "../dialogs/subclass-selection-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function SubclassSelectionsSection() {
  // Get everything we need from service hooks
  const { character } = useCharacterService();
  const [selectedSubclassChoice, setSelectedSubclassChoice] =
    useState<SubclassChoiceFeatureEffect | null>(null);

  if (!character) return null;

  const classService = getClassService();
  const availableSubclassChoices = classService.getAvailableSubclassChoices(character);

  if (availableSubclassChoices.length === 0) {
    return null;
  }

  const handleOpenSelection = (subclassChoice: SubclassChoiceFeatureEffect) => {
    setSelectedSubclassChoice(subclassChoice);
  };

  const handleCloseSelection = () => {
    setSelectedSubclassChoice(null);
  };

  return (
    <>
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-purple-600">🎭</span>
            Subclass Selection Available
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {availableSubclassChoices.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableSubclassChoices.map(
            (subclassChoice: SubclassChoiceFeatureEffect, index: number) => {
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="font-medium">Subclass Choice</div>
                    <div className="text-sm text-muted-foreground">
                      Choose your class specialization
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Choose your specialization
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleOpenSelection(subclassChoice)}>
                    Choose Subclass
                  </Button>
                </div>
              );
            },
          )}
        </CardContent>
      </Card>

      {selectedSubclassChoice && (
        <SubclassSelectionDialog
          subclassChoice={selectedSubclassChoice}
          onClose={handleCloseSelection}
        />
      )}
    </>
  );
}
