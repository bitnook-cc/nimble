import { anyMonsterSchema } from "./schemas";
import { STORAGE_KEY } from "./constants";
import type { AnyMonster } from "./types";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getAllMonsters(): AnyMonster[] {
  if (!isClient()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item: unknown) => {
      const result = anyMonsterSchema.safeParse(item);
      return result.success;
    }) as AnyMonster[];
  } catch {
    return [];
  }
}

export function getMonsterById(id: string): AnyMonster | undefined {
  return getAllMonsters().find((m) => m.id === id);
}

export function saveMonster(monster: AnyMonster): AnyMonster {
  const now = new Date().toISOString();
  const updated = {
    ...monster,
    timestamps: {
      ...monster.timestamps,
      updatedAt: now,
    },
  };

  const result = anyMonsterSchema.safeParse(updated);
  if (!result.success) {
    throw new Error(`Invalid monster data: ${result.error.message}`);
  }

  const all = getAllMonsters();
  const index = all.findIndex((m) => m.id === updated.id);

  if (index >= 0) {
    all[index] = updated;
  } else {
    all.push(updated);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return updated;
}

export function deleteMonster(id: string): void {
  const all = getAllMonsters().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
