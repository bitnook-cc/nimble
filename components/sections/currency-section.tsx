"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowRightLeft, Coins } from "lucide-react";
import { useCharacterService } from "../../lib/hooks/use-character-service";

export function CurrencySection() {
  const { character, updateCharacter } = useCharacterService();
  const [goldInput, setGoldInput] = useState("");
  const [silverInput, setSilverInput] = useState("");

  if (!character) {
    return null;
  }

  const currency = character.inventory.currency;
  const gold = currency.gold ?? 0;
  const silver = currency.silver ?? 0;

  const handleGoldChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      updateCharacter({
        ...character,
        inventory: {
          ...character.inventory,
          currency: {
            ...currency,
            gold: numValue,
          },
        },
      });
    }
  };

  const handleSilverChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      updateCharacter({
        ...character,
        inventory: {
          ...character.inventory,
          currency: {
            ...currency,
            silver: numValue,
          },
        },
      });
    }
  };

  const convertGoldToSilver = () => {
    const goldToConvert = parseInt(goldInput) || 0;
    if (goldToConvert > 0 && goldToConvert <= gold) {
      const newGold = gold - goldToConvert;
      const newSilver = silver + (goldToConvert * 10);
      
      updateCharacter({
        ...character,
        inventory: {
          ...character.inventory,
          currency: {
            gold: newGold,
            silver: newSilver,
          },
        },
      });
      
      setGoldInput("");
    }
  };

  const convertSilverToGold = () => {
    const silverToConvert = parseInt(silverInput) || 0;
    if (silverToConvert >= 10 && silverToConvert <= silver && silverToConvert % 10 === 0) {
      const newSilver = silver - silverToConvert;
      const newGold = gold + (silverToConvert / 10);
      
      updateCharacter({
        ...character,
        inventory: {
          ...character.inventory,
          currency: {
            gold: newGold,
            silver: newSilver,
          },
        },
      });
      
      setSilverInput("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Currency
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Currency Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Gold</label>
            <Input
              type="number"
              min="0"
              value={gold}
              onChange={(e) => handleGoldChange(e.target.value)}
              className="text-center"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Silver</label>
            <Input
              type="number"
              min="0"
              value={silver}
              onChange={(e) => handleSilverChange(e.target.value)}
              className="text-center"
            />
          </div>
        </div>

        {/* Currency Conversion */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Convert Currency
          </h4>
          
          {/* Gold to Silver */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max={gold}
              placeholder="Gold"
              value={goldInput}
              onChange={(e) => setGoldInput(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={convertGoldToSilver}
              disabled={!goldInput || parseInt(goldInput) <= 0 || parseInt(goldInput) > gold}
            >
              → {goldInput ? (parseInt(goldInput) * 10) : 0} Silver
            </Button>
          </div>

          {/* Silver to Gold */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="10"
              step="10"
              max={silver}
              placeholder="Silver (multiples of 10)"
              value={silverInput}
              onChange={(e) => setSilverInput(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={convertSilverToGold}
              disabled={!silverInput || parseInt(silverInput) < 10 || parseInt(silverInput) > silver || parseInt(silverInput) % 10 !== 0}
            >
              → {silverInput ? Math.floor(parseInt(silverInput) / 10) : 0} Gold
            </Button>
          </div>
        </div>

        {/* Exchange Rate Info */}
        <div className="text-xs text-muted-foreground text-center border-t pt-2">
          Exchange Rate: 1 Gold = 10 Silver
        </div>
      </CardContent>
    </Card>
  );
}