"use client";

import { ChevronDown, ChevronRight, Lock, Plus, Search, Sparkles, Star, Zap } from "lucide-react";

import { useMemo, useState } from "react";

import { SpellAbilityDefinition } from "@/lib/schemas/abilities";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { getCharacterService } from "@/lib/services/service-factory";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface SpellBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSpellAdd?: (spell: SpellAbilityDefinition) => void;
}

export function SpellBrowser({ isOpen, onClose, onSpellAdd }: SpellBrowserProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<number | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "combat" | "utility">("all");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [addedMessage, setAddedMessage] = useState("");

  const contentRepository = ContentRepositoryService.getInstance();
  const characterService = getCharacterService();
  const character = characterService.getCurrentCharacter();

  // Get all spells available in the repository
  const allSpells = contentRepository.getAllSpells();

  // Get spells the character already knows (from abilities array)
  const knownSpellIds = new Set(
    character?._abilities
      .filter((ability) => ability.type === "spell")
      .map((ability) => ability.id) || [],
  );

  // Get spells the character has access to through class features
  const classGrantedSpellIds = new Set(
    characterService
      .getAbilities()
      .filter((ability) => ability.type === "spell")
      .map((ability) => ability.id),
  );

  // Filter spells based on criteria
  const filteredSpells = useMemo(() => {
    let spells = allSpells;

    // Filter by school
    if (selectedSchool !== "all") {
      spells = spells.filter((spell) => spell.school === selectedSchool);
    }

    // Filter by tier
    if (selectedTier !== "all") {
      spells = spells.filter((spell) => spell.tier === selectedTier);
    }

    // Filter by category
    if (selectedCategory !== "all") {
      spells = spells.filter((spell) => spell.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      spells = spells.filter(
        (spell) =>
          spell.name.toLowerCase().includes(searchLower) ||
          spell.description.toLowerCase().includes(searchLower),
      );
    }

    return spells;
  }, [allSpells, selectedSchool, selectedTier, selectedCategory, searchTerm]);

  // Group spells by school and tier
  const groupedSpells = useMemo(() => {
    const groups: Record<string, SpellAbilityDefinition[]> = {};

    filteredSpells.forEach((spell) => {
      const key = `${spell.school}-tier${spell.tier}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(spell);
    });

    // Sort spells within each group by name
    Object.values(groups).forEach((spells) => {
      spells.sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [filteredSpells]);

  // Get unique schools from all spells
  const availableSchools = Array.from(new Set(allSpells.map((spell) => spell.school))).sort();

  // Get unique tiers from all spells
  const availableTiers = Array.from(new Set(allSpells.map((spell) => spell.tier))).sort(
    (a, b) => a - b,
  );

  const handleAddSpell = (spell: SpellAbilityDefinition) => {
    if (onSpellAdd) {
      onSpellAdd(spell);
    } else if (character) {
      // Default: add to character's abilities
      const updatedAbilities = [...character._abilities, spell];
      characterService.updateAbilities(updatedAbilities);
      setAddedMessage(`Added ${spell.name} to your spellbook`);
      setTimeout(() => setAddedMessage(""), 2000);
    }
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const getTierColor = (tier: number) => {
    if (tier === 0) return "bg-gray-100 text-gray-800 border-gray-200";
    if (tier === 1) return "bg-green-100 text-green-800 border-green-200";
    if (tier <= 3) return "bg-blue-100 text-blue-800 border-blue-200";
    if (tier <= 6) return "bg-purple-100 text-purple-800 border-purple-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getCategoryColor = (category: string) => {
    return category === "utility"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-orange-100 text-orange-800";
  };

  const formatGroupName = (groupKey: string) => {
    const [school, tierPart] = groupKey.split("-tier");
    const tier = parseInt(tierPart);
    const schoolName = school.charAt(0).toUpperCase() + school.slice(1).replace(/-/g, " ");
    const tierName = tier === 0 ? "Cantrips" : `Tier ${tier}`;
    return `${schoolName} - ${tierName}`;
  };

  const isSpellKnown = (spellId: string) => {
    return knownSpellIds.has(spellId) || classGrantedSpellIds.has(spellId);
  };

  const canLearnSpell = (spell: SpellAbilityDefinition) => {
    // Can't learn spells they already know
    if (isSpellKnown(spell.id)) return false;

    // Can learn any spell (no tier restrictions for manually added spells)
    return true;
  };

  if (!character) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Spell Library
          </DialogTitle>
          <DialogDescription>
            Browse and add spells to your character. Grayed out spells are already known.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Status Message */}
          {addedMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              {addedMessage}
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search spells..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">School</Label>
              <Select value={selectedSchool} onValueChange={(value) => setSelectedSchool(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {availableSchools.map((school) => (
                    <SelectItem key={school} value={school}>
                      {school.charAt(0).toUpperCase() + school.slice(1).replace(/-/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Tier</Label>
              <Select
                value={selectedTier.toString()}
                onValueChange={(value) =>
                  setSelectedTier(value === "all" ? "all" : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  {availableTiers.map((tier) => (
                    <SelectItem key={tier} value={tier.toString()}>
                      {tier === 0 ? "Cantrips" : `Tier ${tier}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) =>
                  setSelectedCategory(value as "all" | "combat" | "utility")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="combat">Combat</SelectItem>
                  <SelectItem value="utility">Utility</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Spells List */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {Object.keys(groupedSpells).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No spells found matching your criteria</p>
              </div>
            ) : (
              Object.entries(groupedSpells).map(([groupKey, spells]) => {
                const isExpanded = expandedGroups[groupKey] ?? true;
                const groupName = formatGroupName(groupKey);

                return (
                  <Card key={groupKey}>
                    <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(groupKey)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 pb-3">
                          <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-purple-500" />
                              {groupName}
                              <Badge variant="secondary">{spells.length}</Badge>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </CardTitle>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="grid gap-2">
                            {spells.map((spell) => {
                              const known = isSpellKnown(spell.id);
                              const canLearn = canLearnSpell(spell);

                              return (
                                <div
                                  key={spell.id}
                                  className={`flex items-start justify-between p-3 border rounded ${
                                    known ? "opacity-50 bg-muted/30" : "hover:bg-muted/30"
                                  }`}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span
                                        className={`font-medium ${known ? "line-through" : ""}`}
                                      >
                                        {spell.name}
                                      </span>
                                      <Badge variant="outline" className={getTierColor(spell.tier)}>
                                        {spell.tier === 0 ? "Cantrip" : `Tier ${spell.tier}`}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className={getCategoryColor(spell.category)}
                                      >
                                        {spell.category}
                                      </Badge>
                                      {known && <Badge variant="secondary">Known</Badge>}
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-2">
                                      {spell.description}
                                    </p>

                                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                      {spell.diceFormula && (
                                        <span className="font-mono bg-muted px-2 py-1 rounded">
                                          {spell.diceFormula}
                                        </span>
                                      )}
                                      {spell.resourceCost && (
                                        <span>
                                          Cost:{" "}
                                          {spell.resourceCost.type === "fixed"
                                            ? `${spell.resourceCost.amount} mana`
                                            : `${spell.resourceCost.minAmount}+ mana`}
                                        </span>
                                      )}
                                      {spell.actionCost && spell.actionCost > 0 && (
                                        <span>Actions: {spell.actionCost}</span>
                                      )}
                                      {spell.scalingBonus && (
                                        <span className="text-blue-600">
                                          Scaling: {spell.scalingBonus}
                                        </span>
                                      )}
                                      {spell.upcastBonus && (
                                        <span className="text-purple-600">
                                          Upcast: {spell.upcastBonus}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <Button
                                    size="sm"
                                    variant={known ? "ghost" : "outline"}
                                    onClick={() => handleAddSpell(spell)}
                                    disabled={!canLearn}
                                    className="ml-4"
                                  >
                                    {known ? (
                                      <>
                                        <Lock className="h-4 w-4 mr-1" />
                                        Known
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add
                                      </>
                                    )}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })
            )}
          </div>

          {/* Footer Summary */}
          <div className="border-t pt-4 text-sm text-muted-foreground">
            Showing {filteredSpells.length} spells • Library contains {allSpells.length} total
            spells
            {knownSpellIds.size > 0 && (
              <span className="ml-2 text-primary font-medium">
                • You know {knownSpellIds.size} spell{knownSpellIds.size !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
