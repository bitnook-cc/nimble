"use client";

import { Sword } from "lucide-react";
import type { AnyMonster } from "@/lib/monsters/types";
import { MonsterCard } from "./monster-card";

interface MonsterListProps {
  monsters: AnyMonster[];
  onSelect: (monster: AnyMonster) => void;
}

export function MonsterList({ monsters, onSelect }: MonsterListProps) {
  if (monsters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Sword className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-lg font-heading font-bold">No Monsters Yet</p>
        <p className="text-sm mt-1">Create your first monster to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {monsters.map((monster) => (
        <MonsterCard
          key={monster.id}
          monster={monster}
          onClick={() => onSelect(monster)}
        />
      ))}
    </div>
  );
}
