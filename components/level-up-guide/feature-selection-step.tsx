'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Shield, Zap, Book, Heart, Swords, Info } from 'lucide-react';
import { Character, AttributeName } from '@/lib/types/character';
import { ClassFeature, StatBoostFeature, SpellSchoolChoiceFeature, UtilitySpellsFeature, PickFeatureFromPoolFeature } from '@/lib/types/class';
import { getContentRepository, getClassService } from '@/lib/services/service-factory';
import { SpellAbility } from '@/lib/types/abilities';

// Type for feature selections during level up
type FeatureSelectionType = 
  | { type: 'stat_boost'; attribute: AttributeName }
  | { type: 'spell_school_choice'; schoolId: string }
  | { type: 'utility_spells'; spellIds: string[] }
  | { type: 'feature_pool'; selectedFeatureId: string };

interface FeatureSelectionStepProps {
  character: Character;
  levelsToGain: number;
  featureSelections: Record<string, FeatureSelectionType>;
  onFeatureSelectionsChange: (selections: Record<string, FeatureSelectionType>) => void;
}

interface GroupedFeatures {
  level: number;
  features: ClassFeature[];
}

// Helper to get icon for feature type
function getFeatureIcon(type: string) {
  switch (type) {
    case 'ability': return <Zap className="h-4 w-4" />;
    case 'passive_feature': return <Shield className="h-4 w-4" />;
    case 'stat_boost': return <Heart className="h-4 w-4" />;
    case 'spell_school': 
    case 'spell_school_choice': return <Sparkles className="h-4 w-4" />;
    case 'utility_spells': return <Book className="h-4 w-4" />;
    case 'resource': return <Zap className="h-4 w-4" />;
    case 'pick_feature_from_pool': return <Swords className="h-4 w-4" />;
    default: return <Info className="h-4 w-4" />;
  }
}

// Helper to get feature type label
function getFeatureTypeLabel(type: string) {
  switch (type) {
    case 'ability': return 'Ability';
    case 'passive_feature': return 'Passive';
    case 'stat_boost': return 'Stat Boost';
    case 'spell_school': return 'Spell School';
    case 'spell_school_choice': return 'Spell School Choice';
    case 'utility_spells': return 'Utility Spells';
    case 'resource': return 'Resource';
    case 'pick_feature_from_pool': return 'Feature Selection';
    default: return type;
  }
}

export function FeatureSelectionStep({
  character,
  levelsToGain,
  featureSelections,
  onFeatureSelectionsChange
}: FeatureSelectionStepProps) {
  const [groupedFeatures, setGroupedFeatures] = useState<GroupedFeatures[]>([]);
  const contentRepo = getContentRepository();
  const classService = getClassService();

  useEffect(() => {
    // Get all features for the levels being gained
    const featuresPerLevel: GroupedFeatures[] = [];
    
    for (let i = 0; i < levelsToGain; i++) {
      const targetLevel = character.level + i + 1;
      
      // Get features for this specific level by comparing with previous level
      const tempCharacter = { ...character, level: targetLevel };
      const allFeaturesAtLevel = classService.getExpectedFeaturesForCharacter(tempCharacter);
      const tempCharacterPrev = { ...character, level: targetLevel - 1 };
      const allFeaturesAtPrevLevel = classService.getExpectedFeaturesForCharacter(tempCharacterPrev);
      
      // Features for this level are the difference
      const levelFeatures = allFeaturesAtLevel.filter(feature => 
        !allFeaturesAtPrevLevel.some(prevFeature => 
          prevFeature.name === feature.name && prevFeature.level === feature.level
        )
      );
      
      if (levelFeatures.length > 0) {
        featuresPerLevel.push({
          level: targetLevel,
          features: levelFeatures
        });
      }
    }
    
    setGroupedFeatures(featuresPerLevel);
  }, [character, levelsToGain, classService, contentRepo]);

  const handleStatBoostSelection = (featureId: string, attribute: AttributeName) => {
    onFeatureSelectionsChange({
      ...featureSelections,
      [featureId]: { type: 'stat_boost', attribute }
    });
  };

  const handleSpellSchoolSelection = (featureId: string, schoolId: string) => {
    onFeatureSelectionsChange({
      ...featureSelections,
      [featureId]: { type: 'spell_school_choice', schoolId }
    });
  };

  const handleUtilitySpellSelection = (featureId: string, spellId: string, checked: boolean) => {
    const current = featureSelections[featureId];
    const currentSpellIds = current?.type === 'utility_spells' ? current.spellIds : [];
    
    const spellIds = checked 
      ? [...currentSpellIds, spellId]
      : currentSpellIds.filter((id: string) => id !== spellId);
    
    onFeatureSelectionsChange({
      ...featureSelections,
      [featureId]: { type: 'utility_spells', spellIds }
    });
  };

  const handleFeaturePoolSelection = (featureId: string, selectedFeatureId: string) => {
    onFeatureSelectionsChange({
      ...featureSelections,
      [featureId]: { type: 'feature_pool', selectedFeatureId }
    });
  };

  const renderFeature = (feature: ClassFeature, level: number) => {
    const featureId = classService.generateFeatureId(character.classId, level, feature.name);
    
    // Render based on feature type
    switch (feature.type) {
      case 'stat_boost': {
        const statBoostFeature = feature as StatBoostFeature;
        const selection = featureSelections[featureId];
        const selectedAttribute = selection?.type === 'stat_boost' ? selection.attribute : undefined;
        
        return (
          <Card key={featureId} className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {getFeatureIcon(feature.type)}
                <CardTitle className="text-base">{feature.name}</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {getFeatureTypeLabel(feature.type)}
                </Badge>
              </div>
              <CardDescription className="text-sm">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label className="text-sm mb-2 block">Choose an attribute to boost:</Label>
              <RadioGroup 
                value={selectedAttribute || ''} 
                onValueChange={(value) => handleStatBoostSelection(featureId, value as AttributeName)}
              >
                {(() => {
                  // Get available attributes from the stat boost feature
                  const availableAttributes = statBoostFeature.statBoosts.length > 0 
                    ? statBoostFeature.statBoosts.map(boost => boost.attribute)
                    : ['strength', 'dexterity', 'intelligence', 'will'] as AttributeName[];
                  
                  return availableAttributes.map(attr => {
                    const boost = statBoostFeature.statBoosts.find(b => b.attribute === attr);
                    const amount = boost?.amount || 1;
                    
                    return (
                      <div key={attr} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={attr} id={`${featureId}-${attr}`} />
                        <Label htmlFor={`${featureId}-${attr}`} className="capitalize cursor-pointer">
                          {attr} (+{amount})
                        </Label>
                      </div>
                    );
                  });
                })()}
              </RadioGroup>
            </CardContent>
          </Card>
        );
      }

      case 'spell_school_choice': {
        const spellSchoolFeature = feature as SpellSchoolChoiceFeature;
        const selection = featureSelections[featureId];
        const selectedSchool = selection?.type === 'spell_school_choice' ? selection.schoolId : undefined;
        
        // Get available schools
        const availableSchools = spellSchoolFeature.availableSchools 
          ? contentRepo.getAllSpellSchools().filter(s => spellSchoolFeature.availableSchools!.includes(s.id))
          : contentRepo.getAllSpellSchools();
        
        return (
          <Card key={featureId} className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {getFeatureIcon(feature.type)}
                <CardTitle className="text-base">{feature.name}</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {getFeatureTypeLabel(feature.type)}
                </Badge>
              </div>
              <CardDescription className="text-sm">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label className="text-sm mb-2 block">Choose a spell school:</Label>
              <Select value={selectedSchool || ''} onValueChange={(value) => handleSpellSchoolSelection(featureId, value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a spell school" />
                </SelectTrigger>
                <SelectContent>
                  {availableSchools.map(school => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        );
      }

      case 'utility_spells': {
        const utilityFeature = feature as UtilitySpellsFeature;
        const selection = featureSelections[featureId];
        const selectedSpells = selection?.type === 'utility_spells' ? selection.spellIds : [];
        
        // Get utility spells from the specified schools
        const utilitySpells: SpellAbility[] = [];
        utilityFeature.schools.forEach(schoolId => {
          const spells = contentRepo.getSpellsBySchool(schoolId)
            .filter(spell => spell.tier === 0); // Utility spells are tier 0
          utilitySpells.push(...spells);
        });
        
        if (utilitySpells.length === 0) {
          return null; // No utility spells available
        }
        
        return (
          <Card key={featureId} className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {getFeatureIcon(feature.type)}
                <CardTitle className="text-base">{feature.name}</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {getFeatureTypeLabel(feature.type)}
                </Badge>
              </div>
              <CardDescription className="text-sm">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label className="text-sm mb-2 block">Select utility spells:</Label>
              <ScrollArea className="h-48 border rounded-md p-3">
                {utilitySpells.map(spell => (
                  <div key={spell.id} className="flex items-start space-x-2 mb-3">
                    <Checkbox 
                      id={`${featureId}-${spell.id}`}
                      checked={selectedSpells.includes(spell.id)}
                      onCheckedChange={(checked) => handleUtilitySpellSelection(featureId, spell.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`${featureId}-${spell.id}`} className="cursor-pointer">
                        <div className="font-medium text-sm">{spell.name}</div>
                        <div className="text-xs text-muted-foreground">{spell.description}</div>
                      </Label>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        );
      }

      case 'pick_feature_from_pool': {
        const poolFeature = feature as PickFeatureFromPoolFeature;
        const selection = featureSelections[featureId];
        const selectedFeature = selection?.type === 'feature_pool' ? selection.selectedFeatureId : undefined;
        
        // Get the feature pool
        const pool = classService.getFeaturePool(character.classId, poolFeature.poolId);
        if (!pool) {
          return null; // Pool not found
        }
        
        return (
          <Card key={featureId} className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {getFeatureIcon(feature.type)}
                <CardTitle className="text-base">{feature.name}</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {getFeatureTypeLabel(feature.type)}
                </Badge>
              </div>
              <CardDescription className="text-sm">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label className="text-sm mb-2 block">Choose from {pool.name}:</Label>
              <RadioGroup 
                value={selectedFeature || ''} 
                onValueChange={(value) => handleFeaturePoolSelection(featureId, value)}
              >
                <ScrollArea className="h-48 border rounded-md p-3">
                  {pool.features.map(poolFeature => (
                    <div key={poolFeature.id} className="flex items-start space-x-2 mb-3">
                      <RadioGroupItem value={poolFeature.id} id={`${featureId}-${poolFeature.id}`} />
                      <Label htmlFor={`${featureId}-${poolFeature.id}`} className="cursor-pointer">
                        <div className="font-medium text-sm">{poolFeature.name}</div>
                        <div className="text-xs text-muted-foreground">{poolFeature.description}</div>
                      </Label>
                    </div>
                  ))}
                </ScrollArea>
              </RadioGroup>
            </CardContent>
          </Card>
        );
      }

      // Non-interactive features - just display them
      default:
        return (
          <Card key={featureId} className="mb-4 bg-muted/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {getFeatureIcon(feature.type)}
                <CardTitle className="text-base">{feature.name}</CardTitle>
                <Badge variant="outline" className="ml-auto">
                  {getFeatureTypeLabel(feature.type)}
                </Badge>
              </div>
              <CardDescription className="text-sm">{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">Select Your Features</h3>
        <p className="text-sm text-muted-foreground">
          Review the features you&apos;ll gain and make selections where required
        </p>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        {groupedFeatures.map(({ level, features }) => (
          <div key={level} className="mb-6">
            <h4 className="text-md font-semibold mb-3 sticky top-0 bg-background py-2">
              Level {level} Features
            </h4>
            {features.map(feature => renderFeature(feature, level))}
          </div>
        ))}
      </ScrollArea>

      {groupedFeatures.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No new features available for the selected levels
        </div>
      )}
    </div>
  );
}