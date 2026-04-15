"use client";

import { Crown, Sword } from "lucide-react";
import type { AnyMonster } from "@/lib/monsters/types";

interface MonsterCardProps {
  monster: AnyMonster;
  onClick: () => void;
}

export function MonsterCard({ monster, onClick }: MonsterCardProps) {
  const isLegendary = monster.kind === "legendary";

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-lg border border-border p-4 transition-all hover:shadow-md hover:border-primary/40 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {isLegendary ? (
            <Crown className="w-5 h-5 text-amber-500" />
          ) : (
            <Sword className="w-5 h-5 text-muted-foreground" />
          )}
          <h3 className="font-heading font-bold text-foreground truncate">
            {monster.name || "Unnamed Monster"}
          </h3>
        </div>
        {isLegendary && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Legendary
          </span>
        )}
      </div>

      {/* Details */}
      <p className="text-sm text-muted-foreground mb-2">
        Level {monster.level} · {monster.size}
        {monster.type ? ` · ${monster.type}` : ""}
      </p>

      {/* Stats */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>HP {monster.hitPoints}</span>
        <span>Armor {monster.armor}</span>
        <span>Speed {monster.speed}</span>
      </div>
    </button>
  );
}
