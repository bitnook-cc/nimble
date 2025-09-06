"use client";

import { RotateCcw } from "lucide-react";

import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Character } from "@/lib/types/character";

interface LevelUpData {
  levelsToGain: number;
  hpRolls: Array<{
    level: number;
    roll1: number;
    roll2: number;
    result: number;
  }>;
  totalHpGain: number;
  newMaxHp: number;
  newHitDice: { current: number; max: number };
}

interface HitPointsStepProps {
  character: Character;
  levelUpData: LevelUpData;
  hitDieSize: string;
  onHpChange: (hp: number) => void;
  onReroll: () => void;
}

export function HitPointsStep({
  character,
  levelUpData,
  hitDieSize,
  onHpChange,
  onReroll,
}: HitPointsStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Roll for Hit Points</h3>
        <p className="text-sm text-muted-foreground">
          Rolling {hitDieSize} with advantage for each level
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Current HP</Label>
              <div className="text-2xl font-bold">{character.hitPoints.max}</div>
            </div>
            <div>
              <Label htmlFor="new-hp">New HP</Label>
              <Input
                id="new-hp"
                type="number"
                value={levelUpData.newMaxHp}
                onChange={(e) => onHpChange(parseInt(e.target.value) || 0)}
                className="text-2xl font-bold h-auto py-1"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Hit Die Rolls (with advantage):</p>
              <Button onClick={onReroll} variant="outline" size="sm" className="h-7 px-2 text-xs">
                <RotateCcw className="w-3 h-3 mr-1" />
                Reroll
              </Button>
            </div>
            <div className="space-y-2">
              {levelUpData.hpRolls.map((roll, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded"
                >
                  <span className="text-sm font-medium">Level {roll.level}:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Rolled: {roll.roll1} & {roll.roll2}
                    </span>
                    <Badge variant="default">Result: {roll.result}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <span className="font-medium">Total HP Gain:</span>
              <Badge className="text-lg px-3 py-1">+{levelUpData.totalHpGain}</Badge>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium">Hit Dice:</span>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>
                  {character._hitDice.current}/{character._hitDice.max}
                </span>
                <span>→</span>
                <span className="text-foreground font-medium">
                  {levelUpData.newHitDice.current}/{levelUpData.newHitDice.max}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
