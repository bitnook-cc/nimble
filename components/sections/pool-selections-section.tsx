"use client";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { getClassService } from "@/lib/services/service-factory";
import { PickFeatureFromPoolFeatureEffect } from "@/lib/schemas/features";

import { FeaturePoolSelectionDialog } from "../feature-pool-selection-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function PoolSelectionsSection() {
  // Get everything we need from service hooks
  const { character } = useCharacterService();
  const [selectedPickFeature, setSelectedPickFeature] =
    useState<PickFeatureFromPoolFeatureEffect | null>(null);

  if (!character) return null;

  const classService = getClassService();
  const availableSelections = classService.getAvailablePoolSelections(character);

  if (availableSelections.length === 0) {
    return null;
  }

  const handleOpenSelection = (pickEffect: PickFeatureFromPoolFeatureEffect) => {
    setSelectedPickFeature(pickEffect);
  };

  const handleCloseSelection = () => {
    setSelectedPickFeature(null);
  };

  return (
    <>
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-orange-600">⚡</span>
            Feature Selections Available
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {availableSelections.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableSelections.map(
            (pickEffect: PickFeatureFromPoolFeatureEffect, index: number) => {
              const pool = classService.getFeaturePool(character.classId, pickEffect.poolId);
              const remaining = classService.getRemainingPoolSelections(character, pickEffect);

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="font-medium">Feature Pool Selection</div>
                    <div className="text-sm text-muted-foreground">
                      Choose from {pickEffect.poolId}
                    </div>
                    {pool && (
                      <div className="text-xs text-muted-foreground mt-1">
                        From: {pool.name} • {remaining} selection{remaining !== 1 ? "s" : ""}{" "}
                        remaining
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleOpenSelection(pickEffect)}
                    disabled={remaining <= 0}
                  >
                    Select Feature
                  </Button>
                </div>
              );
            },
          )}
        </CardContent>
      </Card>

      {selectedPickFeature && (
        <FeaturePoolSelectionDialog
          pickFeature={selectedPickFeature}
          onClose={handleCloseSelection}
        />
      )}
    </>
  );
}
