"use client";

import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Heart, Minus, Plus, Zap, Swords, Dice6, Square, ChevronDown, ChevronUp, Bandage, Skull, Circle, RotateCcw, Settings, HelpCircle, Sparkles } from "lucide-react";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useDiceActions } from "@/lib/hooks/use-dice-actions";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { getResourceColor } from "@/lib/utils/resource-config";
import { getValue as getFlexibleValue } from "@/lib/types/flexible-value";

// Health Bar Subcomponent
function HealthBar() {
  const { character } = useCharacterService();
  
  // All hooks called first, then safety check
  if (!character) return null;
  
  const { current, max, temporary } = character.hitPoints;
  const healthPercentage = (current / max) * 100;
  
  const getHealthBarColor = () => {
    if (healthPercentage <= 25) return "bg-red-500";
    if (healthPercentage <= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const totalEffectiveHP = max + temporary;
  const currentHpPercentage = totalEffectiveHP > 0 ? (current / totalEffectiveHP) * 100 : 0;
  const tempHpPercentage = totalEffectiveHP > 0 ? (temporary / totalEffectiveHP) * 100 : 0;

  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {current}/{max} HP
          {temporary > 0 && <span className="text-blue-600 ml-1">(+{temporary})</span>}
        </span>
        <span className="text-xs text-gray-500">{Math.round(healthPercentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
        {/* Current HP bar */}
        <div 
          className={`h-3 transition-all duration-300 ${getHealthBarColor()} absolute left-0 top-0 ${
            temporary > 0 ? 'rounded-l-full' : 'rounded-full'
          }`}
          style={{ width: `${currentHpPercentage}%` }}
        />
        {/* Temporary HP bar */}
        {temporary > 0 && (
          <div 
            className="h-3 bg-blue-500 transition-all duration-300 absolute top-0 rounded-r-full"
            style={{ 
              left: `${currentHpPercentage}%`,
              width: `${tempHpPercentage}%` 
            }}
          />
        )}
      </div>
    </div>
  );
}

// Wounds Display Subcomponent
function WoundsDisplay() {
  const { character } = useCharacterService();
  
  // All hooks called first, then safety check
  if (!character) return null;
  
  const { wounds } = character;
  const shouldUseIcons = wounds.max <= 8;
  
  if (!shouldUseIcons) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Wounds:</span>
        <span className="text-sm font-medium text-gray-600">
          {wounds.current}/{wounds.max}
        </span>
      </div>
    );
  }

  const woundIcons = [];
  for (let i = 0; i < wounds.max; i++) {
    const isLastWound = i === wounds.max - 1;
    const isWounded = i < wounds.current;
    const IconComponent = isLastWound ? Skull : Bandage;
    
    woundIcons.push(
      <IconComponent
        key={i} 
        className={`w-3 h-3 ${isWounded ? 'text-red-500' : 'text-gray-300'}`} 
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-600">Wounds:</span>
      <div className="flex items-center gap-0.5">
        {woundIcons}
      </div>
    </div>
  );
}

// Quick Actions Bar Subcomponent
function QuickActionsBar() {
  const { character, applyDamage, applyHealing, applyTemporaryHP } = useCharacterService();
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const [customAmount, setCustomAmount] = useState("1");
  
  // All hooks called first, then safety check
  if (!character) return null;
  
  const { current: currentHp, max: maxHp } = character.hitPoints;
  
  const handleQuickDamage = (amount: number) => {
    applyDamage(amount);
  };

  const handleQuickHeal = (amount: number) => {
    applyHealing(amount);
  };

  const handleCustomDamage = () => {
    const damage = parseInt(customAmount) || 0;
    applyDamage(damage);
    setShowCustomPanel(false);
  };

  const handleCustomHeal = () => {
    const heal = parseInt(customAmount) || 0;
    applyHealing(heal);
    setShowCustomPanel(false);
  };

  const handleCustomTempHp = () => {
    const tempAmount = parseInt(customAmount) || 0;
    applyTemporaryHP(tempAmount);
    setShowCustomPanel(false);
  };
  return (
    <div className="space-y-3 mb-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Damage Buttons */}
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => handleQuickDamage(1)}
          disabled={currentHp <= 0}
          className="text-xs h-7"
        >
          -1
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => handleQuickDamage(5)}
          disabled={currentHp <= 0}
          className="text-xs h-7"
        >
          -5
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => handleQuickDamage(10)}
          disabled={currentHp <= 0}
          className="text-xs h-7"
        >
          -10
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Heal Buttons */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleQuickHeal(1)}
          disabled={currentHp >= maxHp}
          className="text-green-600 border-green-600 hover:bg-green-50 text-xs h-7"
        >
          +1
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleQuickHeal(5)}
          disabled={currentHp >= maxHp}
          className="text-green-600 border-green-600 hover:bg-green-50 text-xs h-7"
        >
          +5
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleQuickHeal(10)}
          disabled={currentHp >= maxHp}
          className="text-green-600 border-green-600 hover:bg-green-50 text-xs h-7"
        >
          +10
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Custom Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowCustomPanel(!showCustomPanel)}
          className="text-xs h-7"
        >
          <Settings className="w-3 h-3 mr-1" />
          Custom
        </Button>
      </div>
      
      {/* Custom Panel */}
      {showCustomPanel && (
        <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Custom Amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                placeholder="Amount"
              />
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleCustomDamage}
                disabled={currentHp <= 0}
                title="Apply Damage"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCustomHeal}
                disabled={currentHp >= maxHp}
                className="text-green-600 border-green-600 hover:bg-green-50"
                title="Apply Healing"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCustomTempHp}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                title="Add Temporary HP"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Action Tracker Subcomponent
function ActionTracker() {
  const { character, updateActionTracker, endTurn: serviceEndTurn } = useCharacterService();
  
  // All hooks called first, then safety check
  if (!character || !character.inEncounter) return null;
  
  const { actionTracker } = character;
  
  const useAction = () => {
    if (actionTracker.current > 0) {
      updateActionTracker({
        ...actionTracker,
        current: actionTracker.current - 1,
      });
    }
  };

  const addBonusAction = () => {
    updateActionTracker({
      ...actionTracker,
      bonus: actionTracker.bonus + 1,
      current: actionTracker.current + 1,
    });
  };

  const endTurn = () => {
    serviceEndTurn();
  };
  const getActionDots = () => {
    const dots = [];
    const totalActions = actionTracker.base + actionTracker.bonus;
    
    for (let i = 0; i < totalActions; i++) {
      const isBonus = i >= actionTracker.base;
      const isAvailable = i < actionTracker.current;
      
      dots.push(
        <Button
          key={i}
          variant="ghost"
          size="sm"
          className={`w-8 h-8 p-0 rounded-full ${
            isAvailable 
              ? isBonus 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
              : isBonus
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-500' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-500'
          }`}
          onClick={isAvailable ? useAction : undefined}
          disabled={!isAvailable}
          title={`${isBonus ? 'Bonus' : 'Base'} Action ${isAvailable ? '(Click to use)' : '(Used)'}`}
        >
          <Circle className="w-4 h-4" fill="currentColor" />
        </Button>
      );
    }
    return dots;
  };

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          {/* Action Dots */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 mr-2">Actions:</span>
            <div className="flex items-center gap-1">
              {getActionDots()}
            </div>
          </div>
          
          {/* Action Controls */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={addBonusAction}
              variant="outline"
              size="sm"
              className="text-xs h-7"
              title="Grant additional action"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button 
              onClick={endTurn}
              variant="default"
              size="sm"
              className="text-xs h-7"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              End Turn
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p><strong>Initiative Rules:</strong></p>
                  <p>&lt;10: 1 action • 10-20: 2 actions • &gt;20: 3 actions</p>
                  <p><span className="text-green-600">Green</span> = base actions, <span className="text-blue-600">Blue</span> = bonus actions</p>
                  <p>Click actions to use them</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Resource Tracker Subcomponent
function ResourceTracker() {
  const { character } = useCharacterService();
  
  // All hooks called first, then safety check
  if (!character || character.resources.length === 0) return null;

  const createPieChart = (current: number, max: number, color: string) => {
    const percentage = max > 0 ? (current / max) : 0;
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - percentage);

    return (
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
          {/* Background circle */}
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="#e5e7eb"
            strokeWidth="3"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke={color}
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700">
            {current}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Resources</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {character.resources.map((resource) => {
            const maxValue = getFlexibleValue(resource.definition.maxValue, character);
            const percentage = maxValue > 0 ? (resource.current / maxValue) * 100 : 0;
            const color = getResourceColor(resource.definition.colorScheme, percentage);
            return (
              <div key={resource.definition.id} className="flex flex-col items-center">
                {createPieChart(resource.current, maxValue, color)}
                <div className="mt-1 text-center">
                  <div className="text-xs font-medium text-gray-700 leading-tight">
                    {resource.definition.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {resource.current}/{maxValue}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Combat Status Bar Subcomponent
function CombatStatusBar() {
  const { character, endEncounter, startEncounter } = useCharacterService();
  const { rollInitiative } = useDiceActions();
  const { uiState } = useUIStateService();
  
  // All hooks called first, then safety check
  if (!character) return null;
  
  const { inEncounter, initiative, attributes } = character;
  const totalModifier = attributes.dexterity + initiative.modifier;
  
  const handleInitiativeRoll = async () => {
    const result = await rollInitiative(totalModifier, uiState.advantageLevel);
    await startEncounter(result.rollTotal);
  };
  const getCombatStatus = () => {
    if (!inEncounter) return { text: "Ready", color: "text-green-600" };
    return { text: "In Combat", color: "text-red-600" };
  };

  const status = getCombatStatus();

  return (
    <Card className="border-2 border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium">Combat Summary</span>
          </div>
          <span className={`text-sm font-medium ${status.color}`}>
            {status.text}
          </span>
        </div>

        <HealthBar />

        {/* Integrated Quick Actions */}
        <QuickActionsBar />

        {/* Wounds and Combat Status */}
        <div className="flex items-center justify-between">
          <WoundsDisplay />
          
          {/* Combat Status and Initiative */}
          <div className="flex items-center gap-3">
            {!inEncounter ? (
              <>
                <span className="text-sm text-gray-600">Initiative: {totalModifier > 0 ? '+' : ''}{totalModifier}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleInitiativeRoll}
                      className="h-8 w-8 p-0"
                    >
                      <Dice6 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Roll Initiative: d20{totalModifier > 0 ? '+' + totalModifier : totalModifier}</p>
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={endEncounter}
                className="text-xs"
              >
                <Square className="w-3 h-3 mr-1" />
                End Combat
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CombatSummary() {
  const { character } = useCharacterService();
  
  if (!character) return null;

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <CombatStatusBar />

        <ResourceTracker />

        <ActionTracker />
      </div>
    </TooltipProvider>
  );
}