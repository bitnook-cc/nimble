"use client";

import { Book, Mountain, Swords } from "lucide-react";
import React, { useEffect, useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FeatureList } from "@/components/feature-list";

import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { EffectSelection } from "@/lib/schemas/character";
import { CharacterFeature, ClassFeature } from "@/lib/schemas/features";

interface FeaturesOverviewProps {
  classId: string;
  ancestryId: string;
  backgroundId: string;
  effectSelections: EffectSelection[];
  onEffectSelectionsChange: (selections: EffectSelection[]) => void;
}

interface CategorizedFeatures {
  class: ClassFeature[];
  ancestry: CharacterFeature[];
  background: CharacterFeature[];
}

export function FeaturesOverview({
  classId,
  ancestryId,
  backgroundId,
  effectSelections,
  onEffectSelectionsChange,
}: FeaturesOverviewProps) {
  const [categorizedFeatures, setCategorizedFeatures] = useState<CategorizedFeatures>({
    class: [],
    ancestry: [],
    background: [],
  });

  const contentRepo = ContentRepositoryService.getInstance();

  useEffect(() => {
    // Get all level 1 features from class, ancestry, and background
    const classDefinition = contentRepo.getClassDefinition(classId);
    const ancestryDefinition = contentRepo.getAncestryDefinition(ancestryId);
    const backgroundDefinition = contentRepo.getBackgroundDefinition(backgroundId);

    const features: CategorizedFeatures = {
      class: classDefinition?.features.filter((f) => f.level === 1) || [],
      ancestry: ancestryDefinition?.features || [],
      background: backgroundDefinition?.features || [],
    };

    setCategorizedFeatures(features);
  }, [classId, ancestryId, backgroundId, contentRepo]);

  const hasFeatures =
    categorizedFeatures.class.length > 0 ||
    categorizedFeatures.ancestry.length > 0 ||
    categorizedFeatures.background.length > 0;

  // Get names for display
  const classDefinition = contentRepo.getClassDefinition(classId);
  const ancestryDefinition = contentRepo.getAncestryDefinition(ancestryId);
  const backgroundDefinition = contentRepo.getBackgroundDefinition(backgroundId);
  
  // Empty existing features since we're building from scratch
  const existingFeatures = {
    spellSchools: [],
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">Your Starting Features</h3>
        <p className="text-sm text-muted-foreground">
          Review the features you&apos;ll start with and make selections where required
        </p>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        {/* Class Features */}
        {categorizedFeatures.class.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
              <Swords className="h-4 w-4" />
              Class Features
            </h4>
            <FeatureList
              features={categorizedFeatures.class}
              source="class"
              sourceLabel={classDefinition?.name || "Class"}
              existingSelections={effectSelections}
              onSelectionsChange={onEffectSelectionsChange}
              existingFeatures={existingFeatures}
            />
          </div>
        )}

        {/* Ancestry Features */}
        {categorizedFeatures.ancestry.length > 0 && (
          <>
            {categorizedFeatures.class.length > 0 && <Separator className="my-4" />}
            <div className="mb-6">
              <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                <Mountain className="h-4 w-4" />
                Ancestry Features
              </h4>
              <FeatureList
                features={categorizedFeatures.ancestry}
                source="ancestry"
                sourceLabel={ancestryDefinition?.name || "Ancestry"}
                existingSelections={effectSelections}
                onSelectionsChange={onEffectSelectionsChange}
                existingFeatures={existingFeatures}
              />
            </div>
          </>
        )}

        {/* Background Features */}
        {categorizedFeatures.background.length > 0 && (
          <>
            {(categorizedFeatures.class.length > 0 || categorizedFeatures.ancestry.length > 0) && (
              <Separator className="my-4" />
            )}
            <div className="mb-6">
              <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                <Book className="h-4 w-4" />
                Background Features
              </h4>
              <FeatureList
                features={categorizedFeatures.background}
                source="background"
                sourceLabel={backgroundDefinition?.name || "Background"}
                existingSelections={effectSelections}
                onSelectionsChange={onEffectSelectionsChange}
                existingFeatures={existingFeatures}
              />
            </div>
          </>
        )}

        {!hasFeatures && (
          <div className="text-center py-8 text-muted-foreground">
            No features available for the selected combination
          </div>
        )}
      </ScrollArea>
    </div>
  );
}