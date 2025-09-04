"use client";

import { useState } from "react";
import { Character } from "@/lib/types/character";
import { SpellAbility } from "@/lib/types/abilities";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Badge } from "../ui/badge";
import { Sparkles, ChevronDown, ChevronRight, Zap, Lock } from "lucide-react";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { getValue as getFlexibleValue } from "@/lib/types/flexible-value";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { 
  hasEnoughResourcesForSpell, 
  getInsufficientResourceMessage,
  formatResourceCost,
  formatActionCost
} from "@/lib/utils/spell-utils";

export function SpellsSection() {
  const { character, performUseAbility } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();
  const [openSchools, setOpenSchools] = useState<Record<string, boolean>>({});
  const [openLockedSchools, setOpenLockedSchools] = useState<Record<string, boolean>>({});
  
  const contentRepository = ContentRepositoryService.getInstance();
  const [isLockedSectionOpen, setIsLockedSectionOpen] = useState<boolean>(false);
  
  if (!character) return null;
  
  // Get all spell abilities from character
  const spellAbilities = character.abilities.filter(ability => ability.type === 'spell') as SpellAbility[];
  
  // Find mana resource (if any)
  const manaResource = character.resources.find(resource => 
    resource.definition.id.toLowerCase() === 'mana' || 
    resource.definition.name.toLowerCase().includes('mana')
  );
  
  // Get all spell schools the character has access to
  const availableFeatures = contentRepository.getAllClassFeaturesUpToLevel(character.classId, character.level);
  const spellSchoolFeatures = availableFeatures.filter(f => f.type === 'spell_school');
  
  // Get all locked spells by school
  const getLockedSpellsBySchool = () => {
    const lockedSpellsBySchool: Record<string, SpellAbility[]> = {};
    
    spellSchoolFeatures.forEach(feature => {
      if (feature.type === 'spell_school' && feature.spellSchool) {
        const schoolId = feature.spellSchool.schoolId;
        const allSpells = contentRepository.getSpellsBySchool(schoolId);
        // Include tier 0 spells when checking what's available vs locked
        const lockedSpells = allSpells.filter(spell => spell.tier > character.spellTierAccess);
        
        if (lockedSpells.length > 0) {
          lockedSpellsBySchool[schoolId] = lockedSpells;
        }
      }
    });
    
    return lockedSpellsBySchool;
  };
  
  const lockedSpellsBySchool = getLockedSpellsBySchool();
  
  if (spellAbilities.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Spells
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No spells available. Gain spell school access to learn spells!
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Group spells by school
  const spellsBySchool = spellAbilities.reduce((acc, spell) => {
    if (!acc[spell.school]) {
      acc[spell.school] = [];
    }
    acc[spell.school].push(spell);
    return acc;
  }, {} as Record<string, SpellAbility[]>);
  
  // Sort spells within each school by tier, then by name
  Object.values(spellsBySchool).forEach(spells => {
    spells.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.name.localeCompare(b.name);
    });
  });
  
  const getSchoolColor = (school: string) => {
    switch (school.toLowerCase()) {
      case 'fire':
        return 'text-red-600';
      case 'radiant':
        return 'text-yellow-600';
      case 'frost':
        return 'text-blue-600';
      case 'nature':
        return 'text-green-600';
      case 'shadow':
        return 'text-purple-600';
      case 'arcane':
        return 'text-indigo-600';
      default:
        return 'text-gray-600';
    }
  };
  
  const getTierColor = (tier: number) => {
    if (tier === 1) return 'bg-green-100 text-green-800 border-green-200';
    if (tier <= 3) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (tier <= 6) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };
  
  const formatSchoolName = (school: string) => {
    return school.charAt(0).toUpperCase() + school.slice(1) + ' Magic';
  };
  
  const handleSpellCast = async (spell: SpellAbility) => {
    await performUseAbility(spell.id);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Spells
          <Badge variant="secondary" className="ml-2">
            Tier {character.spellTierAccess} Access
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mana Tracker */}
        {manaResource && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{manaResource.definition.name}</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {manaResource.current}
                </div>
                <div className="text-xs text-muted-foreground">
                  / {getFlexibleValue(manaResource.definition.maxValue, character)}
                </div>
              </div>
            </div>
            {/* Mana bar */}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                style={{
                  width: `${Math.max(0, Math.min(100, (manaResource.current / getFlexibleValue(manaResource.definition.maxValue, character)) * 100))}%`
                }}
              />
            </div>
          </div>
        )}
        
        {Object.entries(spellsBySchool).map(([school, spells]) => {
          const isOpen = openSchools[school] ?? true;
          const onToggle = (open: boolean) => {
            setOpenSchools(prev => ({ ...prev, [school]: open }));
          };
          
          return (
            <Collapsible key={school} open={isOpen} onOpenChange={onToggle}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <h3 className={`text-lg font-semibold flex items-center gap-2 ${getSchoolColor(school)}`}>
                    <Sparkles className="w-5 h-5" />
                    {formatSchoolName(school)} ({spells.length})
                  </h3>
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3 pt-2">
                  {spells.map((spell) => {
                    const canCast = hasEnoughResourcesForSpell(character, spell);
                    const insufficientMessage = getInsufficientResourceMessage(character, spell);
                    
                    return (
                      <div key={spell.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{spell.name}</h4>
                              <Badge variant="outline" className={getTierColor(spell.tier)}>
                                Tier {spell.tier}
                              </Badge>
                            </div>
                            
                            {/* Action and Resource costs in a row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {spell.actionCost !== undefined && (
                                <Badge variant="secondary" className="text-xs">
                                  {formatActionCost(spell.actionCost)}
                                </Badge>
                              )}
                              {spell.resourceCost && (
                                <Badge 
                                  variant={canCast ? "secondary" : "destructive"} 
                                  className="text-xs"
                                >
                                  {formatResourceCost(spell.resourceCost)}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              {spell.description}
                            </p>
                            {spell.roll && (
                              <div className="text-xs text-muted-foreground">
                                Roll: {spell.roll.dice.count}d{spell.roll.dice.sides}
                                {spell.roll.modifier && ` + ${spell.roll.modifier}`}
                                {spell.roll.attribute && ` + ${spell.roll.attribute}`}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant={canCast ? "outline" : "ghost"}
                            onClick={() => handleSpellCast(spell)}
                            className="ml-4"
                            disabled={!canCast}
                            title={insufficientMessage || 'Cast spell'}
                          >
                            <Zap className="w-4 h-4" />
                          </Button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
        
        {/* Locked Spells Section */}
        {Object.keys(lockedSpellsBySchool).length > 0 && (
          <div className="pt-6 border-t">
            <Collapsible open={isLockedSectionOpen} onOpenChange={setIsLockedSectionOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <h3 className={`text-lg font-semibold flex items-center gap-2 text-muted-foreground`}>
                    <Lock className="w-5 h-5" />
                    Locked Spells
                  </h3>
                  {isLockedSectionOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4 pt-2">
                  {Object.entries(lockedSpellsBySchool).map(([schoolId, spells]) => {
                    const schoolFeature = spellSchoolFeatures.find(f => 
                      f.type === 'spell_school' && f.spellSchool?.schoolId === schoolId
                    );
                    const schoolName = schoolFeature?.spellSchool?.name || schoolId;
                    const isOpen = openLockedSchools[schoolId] ?? false;
                    
                    return (
                      <Collapsible key={schoolId} open={isOpen} onOpenChange={(open) => {
                        setOpenLockedSchools(prev => ({ ...prev, [schoolId]: open }));
                      }}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                            <h4 className={`font-semibold flex items-center gap-2 ${getSchoolColor(schoolId)}`}>
                              <Sparkles className="w-4 h-4" />
                              {formatSchoolName(schoolId)} ({spells.length} locked)
                            </h4>
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="space-y-3 pt-2 pl-4">
                            {spells.map((spell) => (
                              <div key={spell.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h5 className="font-semibold text-muted-foreground">{spell.name}</h5>
                                      <Badge variant="outline" className={getTierColor(spell.tier)}>
                                        Tier {spell.tier}
                                      </Badge>
                                      <Badge variant="outline" className="text-red-600 border-red-600">
                                        Requires Tier {spell.tier} Access
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
                                    <p className="text-sm text-muted-foreground/70">
                                      {spell.description}
                                    </p>
                                    {spell.roll && (
                                      <div className="text-xs text-muted-foreground/70">
                                        Roll: {spell.roll.dice.count}d{spell.roll.dice.sides}
                                        {spell.roll.modifier && ` + ${spell.roll.modifier}`}
                                        {spell.roll.attribute && ` + ${spell.roll.attribute}`}
                                      </div>
                                    )}
                                  </div>
                                  <Lock className="w-4 h-4 text-muted-foreground ml-4" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  );
}