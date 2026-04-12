# Monster Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a monster builder to the portal app at `/monsters` with localStorage persistence, live stat block preview, and support for standard + legendary monsters.

**Architecture:** Client-side only routes within `apps/portal`. Form-based builder with live preview panel. localStorage CRUD via a storage service. Zod validation on all data. The builder form is a placeholder — guided steps will be added when GM rules are provided.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zod, lucide-react

**Spec:** `docs/superpowers/specs/2026-04-12-monster-builder-design.md`

---

### Task 1: Types and Constants

**Files:**
- Create: `apps/portal/lib/monsters/constants.ts`
- Create: `apps/portal/lib/monsters/types.ts`

- [ ] **Step 1: Create constants file**

```typescript
// apps/portal/lib/monsters/constants.ts

export const MONSTER_SIZES = [
  "Tiny",
  "Small",
  "Medium",
  "Large",
  "Huge",
  "Gargantuan",
] as const;

export const ARMOR_TYPES = ["None", "Medium", "Heavy"] as const;

export const MONSTER_KINDS = ["standard", "legendary"] as const;

export const STORAGE_KEY = "nimble-monsters";
```

- [ ] **Step 2: Create types file**

```typescript
// apps/portal/lib/monsters/types.ts

import type { MONSTER_SIZES, ARMOR_TYPES, MONSTER_KINDS } from "./constants";

export type MonsterSize = (typeof MONSTER_SIZES)[number];
export type ArmorType = (typeof ARMOR_TYPES)[number];
export type MonsterKind = (typeof MONSTER_KINDS)[number];

export interface MonsterPassive {
  name: string;
  description: string;
}

export interface MonsterAction {
  name: string;
  description: string;
  reach?: number;
  diceFormula?: string;
}

export interface MonsterPhase {
  description: string;
  passives?: MonsterPassive[];
  actions?: MonsterAction[];
}

export interface MonsterBase {
  id: string;
  name: string;
  kind: MonsterKind;
  level: number;
  size: MonsterSize;
  type?: string;
  group?: string;
  hitPoints: number;
  armor: ArmorType;
  speed: number;
  saves?: {
    strength?: number;
    dexterity?: number;
    intelligence?: number;
    will?: number;
  };
  passives: MonsterPassive[];
  actions: MonsterAction[];
  notes?: string;
  timestamps: {
    createdAt: string;
    updatedAt: string;
  };
}

export interface Monster extends MonsterBase {
  kind: "standard";
}

export interface LegendaryMonster extends MonsterBase {
  kind: "legendary";
  bloodied?: MonsterPhase;
  lastStand?: MonsterPhase;
}

export type AnyMonster = Monster | LegendaryMonster;
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npx turbo typecheck --filter=@nimble/portal`
Expected: PASS (no errors)

- [ ] **Step 4: Commit**

```bash
git add apps/portal/lib/monsters/
git commit -m "feat(portal): add monster types and constants"
```

---

### Task 2: Zod Schemas

**Files:**
- Create: `apps/portal/lib/monsters/schemas.ts`

**Dependencies:** Needs `zod` added to portal's package.json — it is not currently a dependency.

- [ ] **Step 1: Add zod dependency**

Run: `npm install zod --workspace=@nimble/portal`

- [ ] **Step 2: Create schemas file**

```typescript
// apps/portal/lib/monsters/schemas.ts

import { z } from "zod";
import { MONSTER_SIZES, ARMOR_TYPES } from "./constants";

export const monsterPassiveSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
});

export const monsterActionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  reach: z.number().int().positive().optional(),
  diceFormula: z.string().optional(),
});

export const monsterPhaseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  passives: z.array(monsterPassiveSchema).optional(),
  actions: z.array(monsterActionSchema).optional(),
});

const savesSchema = z
  .object({
    strength: z.number().int().optional(),
    dexterity: z.number().int().optional(),
    intelligence: z.number().int().optional(),
    will: z.number().int().optional(),
  })
  .optional();

const timestampsSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const monsterBaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  level: z.number().min(0),
  size: z.enum(MONSTER_SIZES),
  type: z.string().optional(),
  group: z.string().optional(),
  hitPoints: z.number().int().positive(),
  armor: z.enum(ARMOR_TYPES),
  speed: z.number().int().positive(),
  saves: savesSchema,
  passives: z.array(monsterPassiveSchema),
  actions: z.array(monsterActionSchema),
  notes: z.string().optional(),
  timestamps: timestampsSchema,
});

export const monsterSchema = monsterBaseSchema.extend({
  kind: z.literal("standard"),
});

export const legendaryMonsterSchema = monsterBaseSchema.extend({
  kind: z.literal("legendary"),
  bloodied: monsterPhaseSchema.optional(),
  lastStand: monsterPhaseSchema.optional(),
});

export const anyMonsterSchema = z.discriminatedUnion("kind", [
  monsterSchema,
  legendaryMonsterSchema,
]);

export type MonsterFormData = z.infer<typeof monsterSchema>;
export type LegendaryMonsterFormData = z.infer<typeof legendaryMonsterSchema>;
export type AnyMonsterFormData = z.infer<typeof anyMonsterSchema>;
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npx turbo typecheck --filter=@nimble/portal`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/portal/lib/monsters/schemas.ts apps/portal/package.json package-lock.json
git commit -m "feat(portal): add monster Zod schemas"
```

---

### Task 3: Defaults and Storage Service

**Files:**
- Create: `apps/portal/lib/monsters/defaults.ts`
- Create: `apps/portal/lib/monsters/storage.ts`

- [ ] **Step 1: Create defaults file**

```typescript
// apps/portal/lib/monsters/defaults.ts

import type { Monster, LegendaryMonster, AnyMonster } from "./types";

export function createDefaultMonster(
  overrides?: Partial<Omit<Monster, "kind" | "id" | "timestamps">>
): Monster {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    kind: "standard",
    name: "",
    level: 1,
    size: "Medium",
    hitPoints: 10,
    armor: "None",
    speed: 6,
    passives: [],
    actions: [],
    timestamps: {
      createdAt: now,
      updatedAt: now,
    },
    ...overrides,
  };
}

export function createDefaultLegendaryMonster(
  overrides?: Partial<
    Omit<LegendaryMonster, "kind" | "id" | "timestamps">
  >
): LegendaryMonster {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    kind: "legendary",
    name: "",
    level: 5,
    size: "Large",
    hitPoints: 50,
    armor: "Medium",
    speed: 6,
    passives: [],
    actions: [],
    timestamps: {
      createdAt: now,
      updatedAt: now,
    },
    ...overrides,
  };
}

export function createDefaultByKind(
  kind: "standard" | "legendary"
): AnyMonster {
  return kind === "legendary"
    ? createDefaultLegendaryMonster()
    : createDefaultMonster();
}
```

- [ ] **Step 2: Create storage service**

```typescript
// apps/portal/lib/monsters/storage.ts

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

    // Validate each monster, skip invalid ones
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

  // Validate before saving
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
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npx turbo typecheck --filter=@nimble/portal`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/portal/lib/monsters/
git commit -m "feat(portal): add monster defaults and localStorage storage service"
```

---

### Task 4: Stat Block Preview Component

**Files:**
- Create: `apps/portal/components/monsters/monster-stat-block.tsx`

- [ ] **Step 1: Create stat block preview component**

```tsx
// apps/portal/components/monsters/monster-stat-block.tsx

"use client";

import type { AnyMonster } from "@/lib/monsters/types";

function formatSaves(saves: AnyMonster["saves"]): string | null {
  if (!saves) return null;

  const parts: string[] = [];
  const labels: Record<string, string> = {
    strength: "STR",
    dexterity: "DEX",
    intelligence: "INT",
    will: "WIL",
  };

  for (const [key, label] of Object.entries(labels)) {
    const value = saves[key as keyof typeof saves];
    if (value !== undefined && value !== 0) {
      const sign = value > 0 ? "+" : "";
      const stacks = Math.abs(value);
      const suffix = stacks > 1 ? `(${sign}${value})` : (value > 0 ? "+" : "-");
      parts.push(`${label}${suffix}`);
    }
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

export function MonsterStatBlock({ monster }: { monster: AnyMonster }) {
  const savesStr = formatSaves(monster.saves);
  const isLegendary = monster.kind === "legendary";

  return (
    <div className="bg-card border border-border rounded-lg p-6 font-sans">
      {/* Name */}
      <h2 className="text-2xl font-heading font-bold text-foreground mb-1">
        {monster.name || "Unnamed Monster"}
      </h2>

      {/* Subtitle line */}
      <p className="text-sm text-muted-foreground italic mb-4">
        {isLegendary && "Legendary "}
        Level {monster.level} | {monster.size}
        {monster.type && ` | ${monster.type}`}
        {monster.group && ` | ${monster.group}`}
      </p>

      <hr className="border-border mb-3" />

      {/* Core stats */}
      <div className="text-sm text-foreground space-y-1 mb-3">
        <p>
          <span className="font-semibold">HP</span> {monster.hitPoints}
          {" | "}
          <span className="font-semibold">Armor</span> {monster.armor}
          {" | "}
          <span className="font-semibold">Speed</span> {monster.speed}
        </p>
        {savesStr && (
          <p>
            <span className="font-semibold">Saves</span> {savesStr}
          </p>
        )}
      </div>

      <hr className="border-border mb-3" />

      {/* Passives */}
      {monster.passives.length > 0 && (
        <div className="mb-3 space-y-2">
          {monster.passives.map((passive, i) => (
            <blockquote
              key={i}
              className="border-l-2 border-primary pl-3 text-sm text-foreground"
            >
              <span className="font-semibold">{passive.name}.</span>{" "}
              {passive.description}
            </blockquote>
          ))}
        </div>
      )}

      {/* Actions */}
      {monster.actions.length > 0 && (
        <div className="mb-3">
          <ul className="space-y-1 text-sm text-foreground">
            {monster.actions.map((action, i) => (
              <li key={i} className="flex gap-1">
                <span className="text-muted-foreground">-</span>
                <span>
                  <span className="font-semibold">{action.name}.</span>{" "}
                  {action.description}
                  {action.reach && action.reach !== 1 && (
                    <span className="text-muted-foreground">
                      {" "}
                      (Reach {action.reach})
                    </span>
                  )}
                  {action.diceFormula && (
                    <span className="text-primary font-mono text-xs ml-1">
                      [{action.diceFormula}]
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Legendary phases */}
      {isLegendary && (monster as { bloodied?: { description: string } }).bloodied && (
        <>
          <hr className="border-border mb-3" />
          <div className="mb-3">
            <h3 className="text-sm font-heading font-bold text-destructive uppercase tracking-wide mb-1">
              Bloodied
            </h3>
            <p className="text-sm text-foreground italic">
              {(monster as { bloodied: { description: string } }).bloodied.description}
            </p>
            {(monster as { bloodied: { passives?: { name: string; description: string }[] } }).bloodied.passives?.map((p, i) => (
              <blockquote
                key={i}
                className="border-l-2 border-destructive pl-3 text-sm text-foreground mt-2"
              >
                <span className="font-semibold">{p.name}.</span> {p.description}
              </blockquote>
            ))}
            {(monster as { bloodied: { actions?: { name: string; description: string; diceFormula?: string }[] } }).bloodied.actions?.map((a, i) => (
              <p key={i} className="text-sm text-foreground mt-1">
                <span className="text-muted-foreground">- </span>
                <span className="font-semibold">{a.name}.</span> {a.description}
                {a.diceFormula && (
                  <span className="text-primary font-mono text-xs ml-1">
                    [{a.diceFormula}]
                  </span>
                )}
              </p>
            ))}
          </div>
        </>
      )}

      {isLegendary && (monster as { lastStand?: { description: string } }).lastStand && (
        <>
          <hr className="border-border mb-3" />
          <div className="mb-3">
            <h3 className="text-sm font-heading font-bold text-destructive uppercase tracking-wide mb-1">
              Last Stand
            </h3>
            <p className="text-sm text-foreground italic">
              {(monster as { lastStand: { description: string } }).lastStand.description}
            </p>
            {(monster as { lastStand: { passives?: { name: string; description: string }[] } }).lastStand.passives?.map((p, i) => (
              <blockquote
                key={i}
                className="border-l-2 border-destructive pl-3 text-sm text-foreground mt-2"
              >
                <span className="font-semibold">{p.name}.</span> {p.description}
              </blockquote>
            ))}
            {(monster as { lastStand: { actions?: { name: string; description: string; diceFormula?: string }[] } }).lastStand.actions?.map((a, i) => (
              <p key={i} className="text-sm text-foreground mt-1">
                <span className="text-muted-foreground">- </span>
                <span className="font-semibold">{a.name}.</span> {a.description}
                {a.diceFormula && (
                  <span className="text-primary font-mono text-xs ml-1">
                    [{a.diceFormula}]
                  </span>
                )}
              </p>
            ))}
          </div>
        </>
      )}

      {/* Notes */}
      {monster.notes && (
        <>
          <hr className="border-border mb-3" />
          <p className="text-xs text-muted-foreground italic">{monster.notes}</p>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx turbo typecheck --filter=@nimble/portal`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/portal/components/monsters/
git commit -m "feat(portal): add monster stat block preview component"
```

---

### Task 5: Monster Form Component

**Files:**
- Create: `apps/portal/components/monsters/monster-form.tsx`

This is the placeholder form — basic fields from the data model. Will be replaced by a guided builder when GM rules arrive. Note: legendary-specific fields (bloodied/lastStand editing) are intentionally deferred — the stat block preview renders them, but form inputs for them will come with the guided builder.

- [ ] **Step 1: Create the form component**

```tsx
// apps/portal/components/monsters/monster-form.tsx

"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { MONSTER_SIZES, ARMOR_TYPES } from "@/lib/monsters/constants";
import type { AnyMonster, MonsterPassive, MonsterAction, MonsterKind } from "@/lib/monsters/types";

interface MonsterFormProps {
  monster: AnyMonster;
  onChange: (monster: AnyMonster) => void;
}

export function MonsterForm({ monster, onChange }: MonsterFormProps) {
  function update(fields: Partial<AnyMonster>) {
    onChange({ ...monster, ...fields } as AnyMonster);
  }

  function updateSave(attr: string, value: string) {
    const num = value === "" ? undefined : parseInt(value, 10);
    update({
      saves: {
        ...monster.saves,
        [attr]: isNaN(num as number) ? undefined : num,
      },
    });
  }

  function addPassive() {
    update({ passives: [...monster.passives, { name: "", description: "" }] });
  }

  function updatePassive(index: number, fields: Partial<MonsterPassive>) {
    const passives = [...monster.passives];
    passives[index] = { ...passives[index], ...fields };
    update({ passives });
  }

  function removePassive(index: number) {
    update({ passives: monster.passives.filter((_, i) => i !== index) });
  }

  function addAction() {
    update({ actions: [...monster.actions, { name: "", description: "" }] });
  }

  function updateAction(index: number, fields: Partial<MonsterAction>) {
    const actions = [...monster.actions];
    actions[index] = { ...actions[index], ...fields };
    update({ actions });
  }

  function removeAction(index: number) {
    update({ actions: monster.actions.filter((_, i) => i !== index) });
  }

  function switchKind(newKind: MonsterKind) {
    if (newKind === monster.kind) return;
    if (newKind === "legendary") {
      onChange({ ...monster, kind: "legendary" } as AnyMonster);
    } else {
      // Strip legendary fields
      const { bloodied, lastStand, ...rest } = monster as Record<string, unknown>;
      onChange({ ...rest, kind: "standard" } as AnyMonster);
    }
  }

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "block text-sm font-medium text-foreground mb-1";
  const sectionClass = "space-y-3";

  return (
    <div className="space-y-6">
      {/* Kind toggle */}
      <div>
        <label className={labelClass}>Monster Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => switchKind("standard")}
            className={`px-4 py-2 text-sm rounded-md border transition-colors ${
              monster.kind === "standard"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => switchKind("legendary")}
            className={`px-4 py-2 text-sm rounded-md border transition-colors ${
              monster.kind === "legendary"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            Legendary
          </button>
        </div>
      </div>

      {/* Basic info */}
      <div className={sectionClass}>
        <div>
          <label className={labelClass}>Name</label>
          <input
            className={inputClass}
            value={monster.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Monster name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Level</label>
            <input
              className={inputClass}
              type="number"
              step="0.01"
              min="0"
              value={monster.level}
              onChange={(e) => update({ level: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className={labelClass}>Size</label>
            <select
              className={inputClass}
              value={monster.size}
              onChange={(e) => update({ size: e.target.value as AnyMonster["size"] })}
            >
              {MONSTER_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Type (optional)</label>
            <input
              className={inputClass}
              value={monster.type || ""}
              onChange={(e) => update({ type: e.target.value || undefined })}
              placeholder="e.g., Undead, Beast"
            />
          </div>
          <div>
            <label className={labelClass}>Group (optional)</label>
            <input
              className={inputClass}
              value={monster.group || ""}
              onChange={(e) => update({ group: e.target.value || undefined })}
              placeholder="e.g., Crew of the Ashen Kraken"
            />
          </div>
        </div>
      </div>

      {/* Core stats */}
      <div className={sectionClass}>
        <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide">
          Core Stats
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Hit Points</label>
            <input
              className={inputClass}
              type="number"
              min="1"
              value={monster.hitPoints}
              onChange={(e) =>
                update({ hitPoints: parseInt(e.target.value, 10) || 1 })
              }
            />
          </div>
          <div>
            <label className={labelClass}>Armor</label>
            <select
              className={inputClass}
              value={monster.armor}
              onChange={(e) =>
                update({ armor: e.target.value as AnyMonster["armor"] })
              }
            >
              {ARMOR_TYPES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Speed</label>
            <input
              className={inputClass}
              type="number"
              min="1"
              value={monster.speed}
              onChange={(e) =>
                update({ speed: parseInt(e.target.value, 10) || 1 })
              }
            />
          </div>
        </div>
      </div>

      {/* Saves */}
      <div className={sectionClass}>
        <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide">
          Saves (advantage/disadvantage stacks)
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {(["strength", "dexterity", "intelligence", "will"] as const).map(
            (attr) => (
              <div key={attr}>
                <label className={labelClass}>
                  {attr.charAt(0).toUpperCase() + attr.slice(0, 3).toUpperCase().slice(1)}
                </label>
                <input
                  className={inputClass}
                  type="number"
                  value={monster.saves?.[attr] ?? ""}
                  onChange={(e) => updateSave(attr, e.target.value)}
                  placeholder="0"
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* Passives */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide">
            Passives
          </h3>
          <button
            type="button"
            onClick={addPassive}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {monster.passives.map((passive, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <input
                className={inputClass}
                value={passive.name}
                onChange={(e) => updatePassive(i, { name: e.target.value })}
                placeholder="Passive name"
              />
              <textarea
                className={inputClass + " min-h-[60px]"}
                value={passive.description}
                onChange={(e) =>
                  updatePassive(i, { description: e.target.value })
                }
                placeholder="Description"
                rows={2}
              />
            </div>
            <button
              type="button"
              onClick={() => removePassive(i)}
              className="mt-1 p-1 text-destructive hover:text-destructive/80"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide">
            Actions
          </h3>
          <button
            type="button"
            onClick={addAction}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {monster.actions.map((action, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <input
                className={inputClass}
                value={action.name}
                onChange={(e) => updateAction(i, { name: e.target.value })}
                placeholder="Action name"
              />
              <textarea
                className={inputClass + " min-h-[60px]"}
                value={action.description}
                onChange={(e) =>
                  updateAction(i, { description: e.target.value })
                }
                placeholder="Description"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  value={action.reach ?? ""}
                  onChange={(e) =>
                    updateAction(i, {
                      reach: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    })
                  }
                  placeholder="Reach (default 1)"
                />
                <input
                  className={inputClass}
                  value={action.diceFormula ?? ""}
                  onChange={(e) =>
                    updateAction(i, {
                      diceFormula: e.target.value || undefined,
                    })
                  }
                  placeholder="Dice formula (e.g., 2d6+3)"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeAction(i)}
              className="mt-1 p-1 text-destructive hover:text-destructive/80"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes (optional)</label>
        <textarea
          className={inputClass + " min-h-[80px]"}
          value={monster.notes || ""}
          onChange={(e) => update({ notes: e.target.value || undefined })}
          placeholder="Additional notes about this monster"
          rows={3}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx turbo typecheck --filter=@nimble/portal`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/portal/components/monsters/monster-form.tsx
git commit -m "feat(portal): add monster builder form component"
```

---

### Task 6: Monster Card and List Components

**Files:**
- Create: `apps/portal/components/monsters/monster-card.tsx`
- Create: `apps/portal/components/monsters/monster-list.tsx`

- [ ] **Step 1: Create monster card component**

```tsx
// apps/portal/components/monsters/monster-card.tsx

"use client";

import { Sword, Crown } from "lucide-react";
import type { AnyMonster } from "@/lib/monsters/types";

interface MonsterCardProps {
  monster: AnyMonster;
  onClick: () => void;
}

export function MonsterCard({ monster, onClick }: MonsterCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-lg shadow-sm border border-border p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
            {monster.kind === "legendary" ? (
              <Crown className="w-4 h-4" />
            ) : (
              <Sword className="w-4 h-4" />
            )}
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {monster.name || "Unnamed Monster"}
          </h3>
        </div>
        {monster.kind === "legendary" && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Legendary
          </span>
        )}
      </div>

      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>
          Lvl {monster.level} | {monster.size}
          {monster.type && ` | ${monster.type}`}
        </p>
        <p>
          HP {monster.hitPoints} | {monster.armor} armor | Speed {monster.speed}
        </p>
      </div>

      {monster.group && (
        <p className="text-xs text-muted-foreground mt-1 italic">
          {monster.group}
        </p>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Create monster list component**

```tsx
// apps/portal/components/monsters/monster-list.tsx

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
      <div className="text-center py-16">
        <Sword className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-heading font-bold text-foreground mb-2">
          No Monsters Yet
        </h3>
        <p className="text-muted-foreground text-sm">
          Create your first monster to get started.
        </p>
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
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npx turbo typecheck --filter=@nimble/portal`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/portal/components/monsters/
git commit -m "feat(portal): add monster card and list components"
```

---

### Task 7: Route Pages

**Files:**
- Create: `apps/portal/app/monsters/layout.tsx`
- Create: `apps/portal/app/monsters/page.tsx`
- Create: `apps/portal/app/monsters/new/page.tsx`
- Create: `apps/portal/app/monsters/[id]/page.tsx`

- [ ] **Step 1: Create monsters layout**

```tsx
// apps/portal/app/monsters/layout.tsx

import { Header } from "@/components/header";

export const metadata = {
  title: "Monster Builder | Nimble Portal",
  description: "Create and manage custom monsters for Nimble RPG",
};

export default function MonstersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header user={null} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create monsters list page**

```tsx
// apps/portal/app/monsters/page.tsx

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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setMonsters(getAllMonsters());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Monster Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage custom monsters for your Nimble RPG campaigns.
          </p>
        </div>
        <button
          onClick={() => router.push("/monsters/new")}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
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
```

- [ ] **Step 3: Create new monster page**

```tsx
// apps/portal/app/monsters/new/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { createDefaultMonster } from "@/lib/monsters/defaults";
import { saveMonster } from "@/lib/monsters/storage";
import { anyMonsterSchema } from "@/lib/monsters/schemas";
import { MonsterForm } from "@/components/monsters/monster-form";
import { MonsterStatBlock } from "@/components/monsters/monster-stat-block";
import type { AnyMonster } from "@/lib/monsters/types";

export default function NewMonsterPage() {
  const router = useRouter();
  const [monster, setMonster] = useState<AnyMonster>(createDefaultMonster());
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    const result = anyMonsterSchema.safeParse(monster);
    if (!result.success) {
      setError(result.error.issues.map((i) => i.message).join(", "));
      return;
    }

    try {
      saveMonster(monster);
      router.push("/monsters");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save monster");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/monsters")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Monsters
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Monster
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground mb-4">
            Builder
          </h2>
          <MonsterForm monster={monster} onChange={setMonster} />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground mb-4">
            Preview
          </h2>
          <div className="sticky top-8">
            <MonsterStatBlock monster={monster} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create edit monster page**

```tsx
// apps/portal/app/monsters/[id]/page.tsx

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { getMonsterById, saveMonster, deleteMonster } from "@/lib/monsters/storage";
import { anyMonsterSchema } from "@/lib/monsters/schemas";
import { MonsterForm } from "@/components/monsters/monster-form";
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
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const found = getMonsterById(id);
    if (found) {
      setMonster(found);
    }
    setLoaded(true);
  }, [id]);

  if (!loaded) return null;

  if (!monster) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-heading font-bold text-foreground mb-2">
          Monster Not Found
        </h2>
        <p className="text-muted-foreground mb-4">
          This monster may have been deleted.
        </p>
        <button
          onClick={() => router.push("/monsters")}
          className="text-primary hover:text-primary/80 text-sm"
        >
          Back to Monsters
        </button>
      </div>
    );
  }

  function handleSave() {
    if (!monster) return;
    const result = anyMonsterSchema.safeParse(monster);
    if (!result.success) {
      setError(result.error.issues.map((i) => i.message).join(", "));
      return;
    }

    try {
      saveMonster(monster);
      setError(null);
      router.push("/monsters");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save monster");
    }
  }

  function handleDelete() {
    if (!monster) return;
    if (window.confirm(`Delete "${monster.name || "Unnamed Monster"}"?`)) {
      deleteMonster(monster.id);
      router.push("/monsters");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/monsters")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Monsters
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-md text-sm font-medium hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground mb-4">
            Builder
          </h2>
          <MonsterForm monster={monster} onChange={setMonster} />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground mb-4">
            Preview
          </h2>
          <div className="sticky top-8">
            <MonsterStatBlock monster={monster} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify typecheck passes**

Run: `npx turbo typecheck --filter=@nimble/portal`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/portal/app/monsters/
git commit -m "feat(portal): add monster builder route pages (list, create, edit)"
```

---

### Task 8: Update Portal Placeholder Links

**Files:**
- Modify: `apps/portal/components/portal-home.tsx:55-61`
- Modify: `apps/portal/components/landing-page.tsx:60-66`

- [ ] **Step 1: Update portal-home.tsx monster-builder entry**

In `apps/portal/components/portal-home.tsx`, change the monster-builder tool entry:

```typescript
// Change from:
  {
    id: 'monster-builder',
    title: 'Monster Builder',
    description: 'Design custom monsters and NPCs with stat blocks and special abilities.',
    icon: <Sword className="w-6 h-6" />,
    href: '/monsters',
    status: 'placeholder',
    tags: ['gm-tools', 'content-creation']
  },

// Change to:
  {
    id: 'monster-builder',
    title: 'Monster Builder',
    description: 'Design custom monsters and NPCs with stat blocks and special abilities.',
    icon: <Sword className="w-6 h-6" />,
    href: '/monsters',
    status: 'available',
    tags: ['gm-tools', 'content-creation']
  },
```

- [ ] **Step 2: Update landing-page.tsx monster-builder entry**

In `apps/portal/components/landing-page.tsx`, apply the same change — update `status` from `'placeholder'` to `'available'` for the monster-builder entry.

- [ ] **Step 3: Update handleToolClick in portal-home.tsx**

The `handleToolClick` function currently only handles `rules-vault` for the `'available'` status. It needs no change — the `else` branch already handles `window.location.href = tool.href`, which will navigate to `/monsters`.

- [ ] **Step 4: Update handleToolClick in landing-page.tsx**

Same as above — the `else` branch already handles generic navigation. No code change needed.

- [ ] **Step 5: Verify typecheck passes**

Run: `npx turbo typecheck --filter=@nimble/portal`
Expected: PASS

- [ ] **Step 6: Verify dev server runs and monsters route loads**

Run: `npx turbo dev --filter=@nimble/portal`
Then open `http://localhost:4000/monsters` in a browser.
Expected: Monster Builder list page loads with empty state.

- [ ] **Step 7: Commit**

```bash
git add apps/portal/components/portal-home.tsx apps/portal/components/landing-page.tsx
git commit -m "feat(portal): activate monster builder tool card link"
```

---

### Task 9: Manual Smoke Test

No files to create/modify. This is a verification task.

- [ ] **Step 1: Start portal dev server**

Run: `npx turbo dev --filter=@nimble/portal`

- [ ] **Step 2: Test list page**

Open `http://localhost:4000/monsters`
Expected: Empty state with "No Monsters Yet" message and "Create Monster" button.

- [ ] **Step 3: Test create flow**

Click "Create Monster". Expected: Two-column layout — form on left, live preview on right.
Fill in name "Goblin", Level 0.33, Size Small, HP 5, Speed 6.
Expected: Preview updates live as you type.

- [ ] **Step 4: Test save and list**

Click "Save Monster". Expected: Redirects to `/monsters`, Goblin card appears in grid.

- [ ] **Step 5: Test edit flow**

Click Goblin card. Expected: Edit page with form pre-populated.
Add a passive: name "Pack Tactics", description "Advantage on attacks when ally is adjacent."
Expected: Preview shows the passive.

- [ ] **Step 6: Test legendary monster**

Navigate to `/monsters/new`. Click "Legendary" toggle.
Fill in name "Dragon Lord", Level 10, Size Huge, HP 150, Armor Heavy, Speed 8.
Expected: Preview shows "Legendary Level 10" subtitle.

- [ ] **Step 7: Test delete**

Click "Delete" on a monster. Confirm. Expected: Monster removed from list.

- [ ] **Step 8: Test portal integration**

Navigate to `http://localhost:4000`.
Expected: Monster Builder card shows "Ready" badge and is clickable. Clicking navigates to `/monsters`.

- [ ] **Step 9: Run lint and typecheck**

Run: `npx turbo lint typecheck --filter=@nimble/portal`
Expected: PASS with no errors.
