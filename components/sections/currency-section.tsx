"use client";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Coins, ChevronRight, ChevronLeft, ArrowRight, ArrowLeft } from "lucide-react";
import { useCharacterService } from "../../lib/hooks/use-character-service";

// Coin icons using Lucide
const GoldCoin = ({ className }: { className?: string }) => (
  <Coins className={`w-6 h-6 text-yellow-500 ${className}`} />
);

const SilverCoin = ({ className }: { className?: string }) => (
  <Coins className={`w-6 h-6 text-gray-500 ${className}`} />
);

export function CurrencySection() {
  const { character, updateCharacter } = useCharacterService();

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

  const convertOneGoldToSilver = () => {
    if (gold >= 1) {
      updateCharacter({
        ...character,
        inventory: {
          ...character.inventory,
          currency: {
            gold: gold - 1,
            silver: silver + 10,
          },
        },
      });
    }
  };

  const convertTenSilverToGold = () => {
    if (silver >= 10) {
      updateCharacter({
        ...character,
        inventory: {
          ...character.inventory,
          currency: {
            gold: gold + 1,
            silver: silver - 10,
          },
        },
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Coins className="h-4 w-4" />
          Currency
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Compact Currency Layout */}
        <div className="flex items-center justify-center gap-2">
          {/* Gold Section */}
          <GoldCoin />
          <Input
            type="number"
            min="0"
            value={gold}
            onChange={(e) => handleGoldChange(e.target.value)}
            className="w-20 text-center h-8"
          />
          
          {/* Gold to Silver Conversion */}
          <Button
            variant="outline"
            size="sm"
            onClick={convertOneGoldToSilver}
            disabled={gold < 1}
            className="h-8 w-16 p-0"
            title="Convert 1 Gold to 10 Silver"
          >
            <GoldCoin className="h-4 w-4" />
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          {/* Silver to Gold Conversion */}
          <Button
            variant="outline"
            size="sm"
            onClick={convertTenSilverToGold}
            disabled={silver < 10}
            className="h-8 w-16 p-0"
            title="Convert 10 Silver to 1 Gold"
          >
            <ArrowLeft className="h-4 w-4" />
            <SilverCoin className="h-4 w-4" />
          </Button>
          
          {/* Silver Section */}
          <Input
            type="number"
            min="0"
            value={silver}
            onChange={(e) => handleSilverChange(e.target.value)}
            className="w-20 text-center h-8"
          />
          <SilverCoin />
        </div>

        {/* Exchange Rate Info */}
        <div className="text-xs text-muted-foreground text-center">
          1 Gold = 10 Silver
        </div>
      </CardContent>
    </Card>
  );
}