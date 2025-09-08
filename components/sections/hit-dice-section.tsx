"use client";

import { ChevronDown, ChevronRight, Dices, Heart, Shield } from "lucide-react";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { getCharacterService } from "@/lib/services/service-factory";
import { Character, HitDice, HitDieSize } from "@/lib/schemas/character";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function HitDiceSection() {
  // Get everything we need from service hooks
  const { character, performSafeRest, performCatchBreath, performMakeCamp, updateCharacter } =
    useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    level: character?.level || 1,
    hitDieSize: character?._hitDice.size || 6,
    currentHitDice: character?._hitDice.current || 1,
  });

  // Early return if no character (shouldn't happen in normal usage)
  if (!character) return null;

  const isOpen = uiState.collapsibleSections.hitDice;
  const onToggle = (isOpen: boolean) => updateCollapsibleState("hitDice", isOpen);

  const handleSave = () => {
    const updatedCharacter = {
      ...character,
      level: editValues.level,
      hitDice: {
        size: editValues.hitDieSize,
        current: editValues.currentHitDice,
        max: editValues.level, // Max hit dice always equals level
      },
    };
    updateCharacter(updatedCharacter);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues({
      level: character.level,
      hitDieSize: character._hitDice.size,
      currentHitDice: character._hitDice.current,
    });
    setIsEditing(false);
  };

  const handleLevelChange = (newLevel: number) => {
    setEditValues((prev) => ({
      ...prev,
      level: newLevel,
      currentHitDice: Math.min(prev.currentHitDice, newLevel), // Don't exceed new max
    }));
  };

  const canRollHitDie = character._hitDice.current > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Hit Dice & Level
              </div>
              <div className="flex items-center gap-4">
                <div className="text-lg font-bold flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Level</span>
                  <span>{character.level}</span>
                </div>
                <div className="text-lg font-bold flex items-center gap-2">
                  <Dices className="w-4 h-4" />
                  <span>
                    {character._hitDice.current}/{character._hitDice.max}
                  </span>
                  <span className="text-sm text-muted-foreground">d{character._hitDice.size}</span>
                </div>
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
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Character Level</Label>
                    <Input
                      id="level"
                      type="number"
                      min="1"
                      max="20"
                      value={editValues.level}
                      onChange={(e) => handleLevelChange(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hit-die-size">Hit Die Size</Label>
                    <Select
                      value={editValues.hitDieSize.toString()}
                      onValueChange={(value) =>
                        setEditValues((prev) => ({
                          ...prev,
                          hitDieSize: parseInt(value) as HitDieSize,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">d4</SelectItem>
                        <SelectItem value="6">d6</SelectItem>
                        <SelectItem value="8">d8</SelectItem>
                        <SelectItem value="10">d10</SelectItem>
                        <SelectItem value="12">d12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current-hit-dice">Current Hit Dice</Label>
                    <Input
                      id="current-hit-dice"
                      type="number"
                      min="0"
                      max={editValues.level}
                      value={editValues.currentHitDice}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          currentHitDice: Math.max(
                            0,
                            Math.min(parseInt(e.target.value) || 0, editValues.level),
                          ),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{character.level}</div>
                    <div className="text-sm text-muted-foreground">Level</div>
                  </div>

                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">d{character._hitDice.size}</div>
                    <div className="text-sm text-muted-foreground">Hit Die</div>
                  </div>

                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{character._hitDice.current}</div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </div>

                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{character._hitDice.max}</div>
                    <div className="text-sm text-muted-foreground">Maximum</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-center text-sm font-medium text-muted-foreground">
                    Field Rest Options (d{character._hitDice.size} + STR{" "}
                    {character._attributes.strength >= 0 ? "+" : ""}
                    {character._attributes.strength})
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Button
                      variant="default"
                      onClick={performCatchBreath}
                      disabled={!canRollHitDie}
                      className="flex-1"
                    >
                      <Dices className="w-4 h-4 mr-2" />
                      Catch Breath
                      <div className="text-xs ml-2">(Roll + STR)</div>
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={performMakeCamp}
                      disabled={!canRollHitDie}
                      className="flex-1"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Make Camp
                      <div className="text-xs ml-2">({character._hitDice.size} + STR)</div>
                    </Button>
                  </div>

                  {!canRollHitDie && (
                    <div className="text-center text-sm text-muted-foreground">
                      No hit dice available for field rest
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="text-center text-sm font-medium text-muted-foreground mb-2">
                      Safe Rest
                    </div>
                    <Button
                      variant="default"
                      onClick={performSafeRest}
                      disabled={false}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Safe Rest
                      <div className="text-xs ml-2">(Full Recovery)</div>
                    </Button>
                  </div>

                  <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full">
                    Edit Level & Hit Dice
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
