"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { createDefaultMonster, createDefaultLegendaryMonster } from "@/lib/monsters/defaults";
import { saveMonster } from "@/lib/monsters/storage";
import { anyMonsterSchema } from "@/lib/monsters/schemas";
import { GuidedBuilder } from "@/components/monsters/guided-builder";
import { LegendaryGuidedBuilder } from "@/components/monsters/legendary-guided-builder";
import { MonsterStatBlock } from "@/components/monsters/monster-stat-block";
import type { AnyMonster } from "@/lib/monsters/types";

export default function NewMonsterPage() {
  const router = useRouter();
  const [kind, setKind] = useState<"standard" | "legendary">("standard");
  const [monster, setMonster] = useState<AnyMonster>(createDefaultMonster());
  const [error, setError] = useState<string | null>(null);

  function switchKind(newKind: "standard" | "legendary") {
    if (newKind === kind) return;
    setKind(newKind);
    setMonster(newKind === "legendary" ? createDefaultLegendaryMonster() : createDefaultMonster());
  }

  function handleSave() {
    const result = anyMonsterSchema.safeParse(monster);
    if (!result.success) {
      setError(result.error.issues.map((e) => e.message).join(", "));
      return;
    }
    setError(null);
    saveMonster(monster);
    router.push("/monsters");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/monsters")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Save className="w-4 h-4" />
          Create Monster
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      <div className="relative flex bg-muted rounded-lg p-1 max-w-xs">
        <div
          className="absolute top-1 bottom-1 rounded-md bg-primary shadow-sm transition-all duration-200 ease-in-out"
          style={{
            width: "calc(50% - 2px)",
            left: kind === "standard" ? "calc(0% + 1px)" : "calc(50% + 1px)",
          }}
        />
        <button
          onClick={() => switchKind("standard")}
          className={`relative z-10 flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
            kind === "standard"
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Standard
        </button>
        <button
          onClick={() => switchKind("legendary")}
          className={`relative z-10 flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
            kind === "legendary"
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Legendary
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {kind === "legendary" ? (
          <LegendaryGuidedBuilder monster={monster} onChange={setMonster} />
        ) : (
          <GuidedBuilder monster={monster} onChange={setMonster} />
        )}
        <div className="sticky top-8">
          <MonsterStatBlock monster={monster} />
        </div>
      </div>
    </div>
  );
}
