"use client";

import { useState } from "react";
import { Character } from "@/lib/types/character";
import { ClassFeature } from "@/lib/types/class";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Badge } from "../ui/badge";
import { Sparkles, ChevronDown, ChevronRight, Star, Zap, TrendingUp, Lock, Unlock } from "lucide-react";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { getFormula } from "@/lib/types/flexible-value";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { getClassService } from "@/lib/services/service-factory";
import { SelectedPoolFeature } from "@/lib/types/character";
import { AncestryFeature } from "@/lib/types/ancestry";
import { BackgroundFeature } from "@/lib/types/background";

type ClassFeatureWithSource = [
  source: 'class' | 'subclass',
  feature: ClassFeature
];

export function ClassFeaturesSection() {
  // Get everything we need from service hooks
  const { character } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();
  const [expandedSpellSchools, setExpandedSpellSchools] = useState<Record<string, boolean>>({});
  
  const contentRepository = ContentRepositoryService.getInstance();
  const classService = getClassService();
  
  // Early return if no character (shouldn't happen in normal usage)
  if (!character) return null;
  
  const isOpen = uiState.collapsibleSections.classFeatures;
  const onToggle = (isOpen: boolean) => updateCollapsibleState('classFeatures', isOpen);
  const classDefinition = contentRepository.getClassDefinition(character.classId);
  const subclassDefinition = character.subclassId ? contentRepository.getSubclassDefinition(character.subclassId) : null;
  
  if (!classDefinition) {
    return null;
  }

  // Get all class and subclass features with source information
  const classFeatures = contentRepository.getAllClassFeaturesUpToLevel(character.classId, character.level);
  const subclassFeatures = character.subclassId 
    ? contentRepository.getAllSubclassFeaturesUpToLevel(character.subclassId, character.level)
    : [];
  
  // Get pool feature selections (these come from class features)
  const poolSelections = character.selectedFeatures.filter((sf): sf is SelectedPoolFeature => 
    sf.type === 'pool_feature'
  );

  // Create array of class/subclass features with source information
  const classSubclassFeatures: ClassFeatureWithSource[] = [
    ...classFeatures.map((feature): ClassFeatureWithSource => 
      ['class', feature]
    ),
    ...subclassFeatures.map((feature): ClassFeatureWithSource => 
      ['subclass', feature]
    ),
    ...poolSelections.map((selection): ClassFeatureWithSource => 
      ['class', selection.feature] // Pool selections come from class
    )
  ];

  // Sort by level for display
  classSubclassFeatures.sort((a, b) => a[1].level - b[1].level);

  // Get ancestry and background features separately
  const ancestryDefinition = contentRepository.getAncestryDefinition(character.ancestry.ancestryId);
  const backgroundDefinition = contentRepository.getBackgroundDefinition(character.background.backgroundId);
  
  const ancestryFeatures = ancestryDefinition?.features || [];
  const backgroundFeatures = backgroundDefinition?.features || [];
  
  // Separate class/subclass features by type for better organization
  const abilities = classSubclassFeatures.filter(([, f]) => f.type === 'ability');
  const passiveFeatures = classSubclassFeatures.filter(([, f]) => f.type === 'passive_feature');
  const statBoosts = classSubclassFeatures.filter(([, f]) => f.type === 'stat_boost');
  const proficiencies = classSubclassFeatures.filter(([, f]) => f.type === 'proficiency');
  const spellSchools = classSubclassFeatures.filter(([, f]) => f.type === 'spell_school');
  const spellTierAccess = classSubclassFeatures.filter(([, f]) => f.type === 'spell_tier_access');
  const resources = classSubclassFeatures.filter(([, f]) => f.type === 'resource');

  const getFeatureIcon = (type: ClassFeature['type']) => {
    switch (type) {
      case 'ability':
        return <Zap className="w-4 h-4" />;
      case 'passive_feature':
        return <Star className="w-4 h-4" />;
      case 'stat_boost':
        return <TrendingUp className="w-4 h-4" />;
      case 'proficiency':
        return <Star className="w-4 h-4" />;
      case 'spell_school':
        return <Sparkles className="w-4 h-4" />;
      case 'spell_tier_access':
        return <Star className="w-4 h-4" />;
      case 'resource':
        return <Zap className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTierColor = (tier: number) => {
    if (tier === 1) return 'bg-green-100 text-green-800 border-green-200';
    if (tier <= 3) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (tier <= 6) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const isSpellUnlocked = (tier: number): boolean => {
    return tier <= character.spellTierAccess;
  };

  const getFeatureTypeColor = (type: ClassFeature['type']) => {
    switch (type) {
      case 'ability':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'passive_feature':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'stat_boost':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'proficiency':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'spell_school':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'spell_tier_access':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'resource':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSourceDisplayName = (source: 'class' | 'subclass' | 'ancestry' | 'background'): string => {
    switch (source) {
      case 'class':
        return classDefinition.name;
      case 'subclass':
        return subclassDefinition?.name || 'Subclass';
      case 'ancestry':
        return ancestryDefinition?.name || 'Ancestry';
      case 'background':
        return backgroundDefinition?.name || 'Background';
      default:
        return 'Unknown';
    }
  };

  const getSourceBadgeColor = (source: 'class' | 'subclass' | 'ancestry' | 'background') => {
    switch (source) {
      case 'class':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'subclass':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'ancestry':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'background':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFeatureType = (type: ClassFeature['type']) => {
    switch (type) {
      case 'ability':
        return 'Active Ability';
      case 'passive_feature':
        return 'Passive Feature';
      case 'stat_boost':
        return 'Stat Boost';
      case 'proficiency':
        return 'Proficiency';
      case 'spell_school':
        return 'Spell School';
      case 'spell_tier_access':
        return 'Spell Tier Access';
      case 'resource':
        return 'Resource';
      default:
        return 'Feature';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 h-auto">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Class Features
          </h2>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="w-full">
          <CardContent className="space-y-4 pt-6">
            {(classSubclassFeatures.length === 0 && ancestryFeatures.length === 0 && backgroundFeatures.length === 0) ? (
              <div className="text-center text-muted-foreground py-8">
                No class features unlocked yet. Level up to gain new abilities!
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Abilities */}
                {abilities.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Active Abilities ({abilities.length})
                    </h3>
                    <div className="space-y-3">
                      {abilities.map(([source, feature], index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">{feature.name}</h4>
                                <Badge variant="outline" className={getFeatureTypeColor(feature.type)}>
                                  Level {feature.level}
                                </Badge>
                                <Badge variant="outline" className={getSourceBadgeColor(source)}>
                                  {getSourceDisplayName(source)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {feature.description}
                              </p>
                            </div>
                            {getFeatureIcon(feature.type)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Passive Features */}
                {passiveFeatures.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Passive Features ({passiveFeatures.length})
                    </h3>
                    <div className="space-y-3">
                      {passiveFeatures.map(([source, feature], index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">{feature.name}</h4>
                                <Badge variant="outline" className={getFeatureTypeColor(feature.type)}>
                                  Level {feature.level}
                                </Badge>
                                <Badge variant="outline" className={getSourceBadgeColor(source)}>
                                  {getSourceDisplayName(source)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {feature.description}
                              </p>
                            </div>
                            {getFeatureIcon(feature.type)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stat Boosts */}
                {statBoosts.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-purple-600 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Stat Improvements ({statBoosts.length})
                    </h3>
                    <div className="space-y-3">
                      {statBoosts.map(([source, feature], index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">{feature.name}</h4>
                                <Badge variant="outline" className={getFeatureTypeColor(feature.type)}>
                                  Level {feature.level}
                                </Badge>
                                <Badge variant="outline" className={getSourceBadgeColor(source)}>
                                  {getSourceDisplayName(source)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {feature.description}
                              </p>
                              {feature.type === 'stat_boost' && feature.statBoosts && (
                                <div className="flex gap-2 mt-2">
                                  {feature.statBoosts.map((boost, boostIndex) => (
                                    <Badge key={boostIndex} variant="secondary" className="text-xs">
                                      +{boost.amount} {boost.attribute}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            {getFeatureIcon(feature.type)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proficiencies */}
                {proficiencies.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Proficiencies ({proficiencies.length})
                    </h3>
                    <div className="space-y-3">
                      {proficiencies.map(([source, feature], index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">{feature.name}</h4>
                                <Badge variant="outline" className={getFeatureTypeColor(feature.type)}>
                                  Level {feature.level}
                                </Badge>
                                <Badge variant="outline" className={getSourceBadgeColor(source)}>
                                  {getSourceDisplayName(source)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {feature.description}
                              </p>
                              {feature.type === 'proficiency' && feature.proficiencies && (
                                <div className="flex gap-2 mt-2">
                                  {feature.proficiencies.map((prof, profIndex) => (
                                    <Badge key={profIndex} variant="secondary" className="text-xs">
                                      {prof.name} ({prof.type})
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            {getFeatureIcon(feature.type)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spell Schools */}
                {spellSchools.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-indigo-600 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Spell Schools ({spellSchools.length})
                    </h3>
                    <div className="space-y-3">
                      {spellSchools.map(([source, feature], index) => {
                        if (feature.type !== 'spell_school' || !feature.spellSchool) return null;
                        
                        const schoolId = feature.spellSchool.schoolId;
                        const isExpanded = expandedSpellSchools[schoolId] ?? false;
                        const spells = contentRepository.getSpellsBySchool(schoolId);
                        
                        return (
                          <Collapsible 
                            key={index} 
                            open={isExpanded} 
                            onOpenChange={(open) => setExpandedSpellSchools(prev => ({ ...prev, [schoolId]: open }))}
                          >
                            <div className="border rounded-lg">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                                  <div className="flex items-start justify-between w-full">
                                    <div className="space-y-1 text-left">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-semibold">{feature.name}</h4>
                                        <Badge variant="outline" className={getFeatureTypeColor(feature.type)}>
                                          Level {feature.level}
                                        </Badge>
                                        <Badge variant="outline" className={getSourceBadgeColor(source)}>
                                          {getSourceDisplayName(source)}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {feature.description}
                                      </p>
                                      <div className="flex gap-2 mt-2">
                                        <Badge variant="secondary" className="text-xs">
                                          {feature.spellSchool.name}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                          {spells.length} spells
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                      {getFeatureIcon(feature.type)}
                                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </div>
                                  </div>
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="px-4 pb-4 space-y-2">
                                  <h5 className="font-medium text-sm text-muted-foreground mb-3">Available Spells:</h5>
                                  {spells.length === 0 ? (
                                    <div className="text-sm text-muted-foreground italic">
                                      No spells available in this school yet.
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {spells.map((spell) => {
                                        const unlocked = isSpellUnlocked(spell.tier);
                                        return (
                                          <div 
                                            key={spell.id} 
                                            className={`border rounded p-3 ${unlocked ? 'bg-background' : 'bg-muted/50'}`}
                                          >
                                            <div className="flex items-start justify-between">
                                              <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className={`font-medium ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {spell.name}
                                                  </span>
                                                  <Badge variant="outline" className={getTierColor(spell.tier)}>
                                                    Tier {spell.tier}
                                                  </Badge>
                                                  {spell.actionCost !== undefined && (
                                                    <Badge variant="secondary" className="text-xs">
                                                      {spell.actionCost === 0 ? 'Bonus Action' : 
                                                       spell.actionCost === 1 ? 'Action' : 
                                                       `${spell.actionCost} Actions`}
                                                    </Badge>
                                                  )}
                                                  {spell.resourceCost && (
                                                    <Badge variant="secondary" className="text-xs">
                                                      {spell.resourceCost.type === 'fixed' 
                                                        ? `${spell.resourceCost.amount} ${spell.resourceCost.resourceId}`
                                                        : `${spell.resourceCost.minAmount}-${spell.resourceCost.maxAmount} ${spell.resourceCost.resourceId}`
                                                      }
                                                    </Badge>
                                                  )}
                                                </div>
                                                <p className={`text-sm ${unlocked ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                                                  {spell.description}
                                                </p>
                                                {spell.roll && (
                                                  <div className={`text-xs ${unlocked ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                                                    Roll: {spell.roll.dice.count}d{spell.roll.dice.sides}
                                                    {spell.roll.modifier && ` + ${spell.roll.modifier}`}
                                                    {spell.roll.attribute && ` + ${spell.roll.attribute}`}
                                                  </div>
                                                )}
                                              </div>
                                              <div className="ml-2">
                                                {unlocked ? (
                                                  <Unlock className="w-4 h-4 text-green-600" />
                                                ) : (
                                                  <Lock className="w-4 h-4 text-muted-foreground" />
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Spell Tier Access */}
                {spellTierAccess.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-cyan-600 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Spell Tier Access ({spellTierAccess.length})
                    </h3>
                    <div className="space-y-3">
                      {spellTierAccess.map(([source, feature], index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">{feature.name}</h4>
                                <Badge variant="outline" className={getFeatureTypeColor(feature.type)}>
                                  Level {feature.level}
                                </Badge>
                                <Badge variant="outline" className={getSourceBadgeColor(source)}>
                                  {getSourceDisplayName(source)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {feature.description}
                              </p>
                              {feature.type === 'spell_tier_access' && feature.maxTier && (
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Max Tier: {feature.maxTier}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            {getFeatureIcon(feature.type)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resources */}
                {resources.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-yellow-600 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Resources ({resources.length})
                    </h3>
                    <div className="space-y-3">
                      {resources.map(([source, feature], index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">{feature.name}</h4>
                                <Badge variant="outline" className={getFeatureTypeColor(feature.type)}>
                                  Level {feature.level}
                                </Badge>
                                <Badge variant="outline" className={getSourceBadgeColor(source)}>
                                  {getSourceDisplayName(source)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {feature.description}
                              </p>
                              {feature.type === 'resource' && feature.resourceDefinition && (
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {feature.resourceDefinition.name}: {getFormula(feature.resourceDefinition.maxValue)}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {feature.resourceDefinition.resetCondition.replace('_', ' ')}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {feature.resourceDefinition.colorScheme}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            {getFeatureIcon(feature.type)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ancestry Features */}
                {ancestryFeatures.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-emerald-600 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Ancestry Features ({ancestryFeatures.length})
                    </h3>
                    <div className="space-y-3">
                      {ancestryFeatures.map((feature, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">{feature.name}</h4>
                                <Badge variant="outline" className={getSourceBadgeColor('ancestry')}>
                                  {getSourceDisplayName('ancestry')}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Background Features */}
                {backgroundFeatures.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-cyan-600 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Background Features ({backgroundFeatures.length})
                    </h3>
                    <div className="space-y-3">
                      {backgroundFeatures.map((feature, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">{feature.name}</h4>
                                <Badge variant="outline" className={getSourceBadgeColor('background')}>
                                  {getSourceDisplayName('background')}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}