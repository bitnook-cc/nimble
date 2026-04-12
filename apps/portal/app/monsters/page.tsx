"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { getAllMonsters } from "@/lib/monsters/storage";
import { MonsterList } from "@/components/monsters/monster-list";
import type { AnyMonster } from "@/lib/monsters/types";

export default function MonstersPage() {
  const router = useRouter();
  const [monsters, setMonsters] = useState<AnyMonster[]>([]);

  useEffect(() => {
    setMonsters(getAllMonsters());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-foreground">
          Monsters
        </h2>
        <button
          onClick={() => router.push("/monsters/new")}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Create Monster
        </button>
      </div>

      <MonsterList
        monsters={monsters}
        onSelect={(monster) => router.push(`/monsters/${monster.id}`)}
      />
    </div>
  );
}
