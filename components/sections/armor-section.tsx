"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { getEquippedArmor, getEquippedMainArmor, getEquippedSupplementaryArmor } from "@/lib/utils/equipment";
import { Shield, ChevronDown, ChevronRight, Shirt } from "lucide-react";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { getCharacterService } from "@/lib/services/service-factory";
import { StatBonus } from "@/lib/types/stat-bonus";

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
  
  // Use computed attributes and armor value from character service
  const attributes = getAttributes();
  const dexterityBonus = attributes.dexterity;
  const totalArmorValue = getArmorValue();
  
  // Calculate dexterity bonus with cap information
  const mainArmorMaxDex = mainArmor?.maxDexBonus;
  const isDexterityCapped = mainArmorMaxDex !== undefined && dexterityBonus > mainArmorMaxDex;
  const effectiveDexBonus = isDexterityCapped ? mainArmorMaxDex : dexterityBonus;
  
  // Calculate total armor from equipped items
  const totalEquippedArmor = equippedArmor.reduce((total, armor) => total + (armor.armor || 0), 0);
  
  // Calculate feature bonuses (total armor value - dex bonus - equipped armor = feature bonuses)
  const featureBonuses = totalArmorValue - effectiveDexBonus - totalEquippedArmor;

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
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground mb-3">Armor Calculation Breakdown</div>
              
              {/* Calculation Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Source</th>
                      <th className="text-right p-3 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Dexterity Bonus Row */}
                    <tr className="border-b">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span>Dexterity Bonus</span>
                          {isDexterityCapped && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              Capped by {mainArmor?.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        {isDexterityCapped ? (
                          <div>
                            <span className="line-through text-muted-foreground">+{dexterityBonus}</span>
                            <span className="ml-2 font-medium">+{effectiveDexBonus}</span>
                          </div>
                        ) : (
                          <span className="font-medium">+{effectiveDexBonus}</span>
                        )}
                      </td>
                    </tr>

                    {/* Equipped Armor Items */}
                    {equippedArmor.map(armor => (
                      <tr key={armor.id} className="border-b">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {armor.isMainArmor ? (
                              <Shirt className="w-4 h-4 text-primary" />
                            ) : (
                              <Shield className="w-4 h-4" />
                            )}
                            <span>{armor.name}</span>
                            {armor.isMainArmor && (
                              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                                Main
                              </span>
                            )}
                          </div>
                          {armor.properties && armor.properties.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {armor.properties.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right font-medium">
                          +{armor.armor || 0}
                        </td>
                      </tr>
                    ))}

                    {/* Feature-based Armor Bonuses */}
                    {featureBonuses !== 0 && (
                      <tr className="border-b">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span>Feature Bonuses</span>
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Features
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {featureBonuses >= 0 ? '+' : ''}{featureBonuses}
                        </td>
                      </tr>
                    )}

                    {/* No armor equipped message */}
                    {equippedArmor.length === 0 && featureBonuses === 0 && (
                      <tr>
                        <td colSpan={2} className="p-4 text-center text-muted-foreground">
                          No armor equipped or feature bonuses active.
                          <div className="text-xs mt-1">
                            Equip armor in your inventory to improve protection.
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Total Row */}
                    <tr className="bg-muted/30 font-bold">
                      <td className="p-3">Total Armor Value</td>
                      <td className="p-3 text-right text-lg">{totalArmorValue}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Additional Info */}
              {isDexterityCapped && (
                <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  <strong>Dexterity Cap:</strong> Your Dexterity bonus is limited by your main armor's maximum Dex bonus of {mainArmorMaxDex}.
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}