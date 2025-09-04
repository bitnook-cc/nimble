"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { getEquippedArmor, getEquippedMainArmor, getEquippedSupplementaryArmor } from "@/lib/utils/equipment";
import { Shield, ChevronDown, ChevronRight, Shirt } from "lucide-react";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";

export function ArmorSection() {
  // Get everything we need from service hooks
  const { character, getAttributes, getArmorValue } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();
  
  // Early return if no character (shouldn't happen in normal usage)
  if (!character) return null;
  
  const isOpen = uiState.collapsibleSections.armor;
  const onToggle = (isOpen: boolean) => updateCollapsibleState('armor', isOpen);
  const equippedArmor = getEquippedArmor(character.inventory.items);
  const mainArmor = getEquippedMainArmor(character.inventory.items);
  const supplementaryArmor = getEquippedSupplementaryArmor(character.inventory.items);
  
  // Use computed attributes and armor value from character service
  const attributes = getAttributes();
  const dexterityBonus = attributes.dexterity;
  const totalArmorValue = getArmorValue();
  
  // Calculate armor value for each piece including dex bonus (for display breakdown)
  const armorValues = equippedArmor.map(armor => {
    const baseArmor = armor.armor || 0;
    const maxDexBonus = armor.maxDexBonus ?? Infinity; // Default to no limit if not specified
    const actualDexBonus = Math.min(dexterityBonus, maxDexBonus);
    return {
      armor,
      baseArmor,
      dexBonus: actualDexBonus,
      totalValue: baseArmor + actualDexBonus
    };
  });
  
  const totalBaseArmor = armorValues.reduce((total, armorValue) => total + armorValue.baseArmor, 0);
  const totalDexBonus = armorValues.reduce((total, armorValue) => total + armorValue.dexBonus, 0);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Armor
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{totalArmorValue}</span>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3">
            {equippedArmor.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-muted-foreground mb-3">
                  No armor equipped.
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    Armor Value: <span className="font-bold">{Math.max(0, dexterityBonus)}</span>
                    {dexterityBonus >= 0 ? (
                      <span className="text-green-600 ml-1">(from Dexterity: {dexterityBonus})</span>
                    ) : (
                      <span className="text-muted-foreground ml-1">(minimum: 0, Dex: {dexterityBonus})</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Equip armor in your inventory to improve protection.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Main Armor Section */}
                {mainArmor && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Main Armor</div>
                    {(() => {
                      const armorValue = armorValues.find(av => av.armor.id === mainArmor.id);
                      if (!armorValue) return null;
                      const { armor, baseArmor, dexBonus, totalValue } = armorValue;
                      return (
                        <div className="flex items-center justify-between p-2 bg-primary/5 border border-primary/20 rounded">
                          <div className="flex items-center gap-2">
                            <Shirt className="w-4 h-4 text-primary" />
                            <span className="font-medium">{armor.name}</span>
                            {armor.properties && armor.properties.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({armor.properties.join(', ')})
                              </span>
                            )}
                            {armor.maxDexBonus !== undefined && armor.maxDexBonus < Infinity && (
                              <span className="text-xs text-blue-600">
                                (Max Dex: {armor.maxDexBonus})
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{totalValue}</div>
                            {dexBonus > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {baseArmor} + {dexBonus} dex
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Supplementary Armor Section */}
                {supplementaryArmor.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Supplementary Armor</div>
                    <div className="space-y-2">
                      {supplementaryArmor.map(armor => {
                        const armorValue = armorValues.find(av => av.armor.id === armor.id);
                        if (!armorValue) return null;
                        const { baseArmor, dexBonus, totalValue } = armorValue;
                        return (
                          <div key={armor.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              <span className="font-medium">{armor.name}</span>
                              {armor.properties && armor.properties.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ({armor.properties.join(', ')})
                                </span>
                              )}
                              {armor.maxDexBonus !== undefined && armor.maxDexBonus < Infinity && (
                                <span className="text-xs text-blue-600">
                                  (Max Dex: {armor.maxDexBonus})
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{totalValue}</div>
                              {dexBonus > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {baseArmor} + {dexBonus} dex
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Total Armor Section */}
                {equippedArmor.length > 1 && (
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between font-bold">
                      <span>Total Armor Value:</span>
                      <div className="text-right">
                        <div>{totalArmorValue}</div>
                        {totalDexBonus > 0 && (
                          <div className="text-xs text-muted-foreground font-normal">
                            {totalBaseArmor} base + {totalDexBonus} dex
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}