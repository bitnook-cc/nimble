"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import {
  getMonsterById,
  saveMonster,
  deleteMonster,
} from "@/lib/monsters/storage";
import { anyMonsterSchema } from "@/lib/monsters/schemas";
import { GuidedBuilder } from "@/components/monsters/guided-builder";
import { LegendaryGuidedBuilder } from "@/components/monsters/legendary-guided-builder";
import { MonsterStatBlock } from "@/components/monsters/monster-stat-block";
import type { AnyMonster } from "@/lib/monsters/types";

export default function EditMonsterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [monster, setMonster] = useState<AnyMonster | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const found = getMonsterById(id);
    if (found) {
      setMonster(found);
    } else {
      setNotFound(true);
    }
  }, [id]);

  function handleSave() {
    if (!monster) return;
    const result = anyMonsterSchema.safeParse(monster);
    if (!result.success) {
      setError(result.error.issues.map((e) => e.message).join(", "));
      return;
    }
    setError(null);
    saveMonster(monster);
    router.push("/monsters");
  }

  function handleDelete() {
    if (!monster) return;
    deleteMonster(monster.id);
    router.push("/monsters");
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-heading font-bold">Monster Not Found</p>
        <button
          onClick={() => router.push("/monsters")}
          className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Monsters
        </button>
      </div>
    );
  }

  if (!monster) return null;

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
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-md text-sm font-medium hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {monster.kind === "standard" ? (
          <GuidedBuilder monster={monster} onChange={setMonster} />
        ) : (
          <LegendaryGuidedBuilder monster={monster} onChange={setMonster} />
        )}
        <div className="sticky top-8">
          <MonsterStatBlock monster={monster} />
        </div>
      </div>
    </div>
  );
}
