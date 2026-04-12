# Guided Monster Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the freeform monster form with a table-driven guided builder where the GM picks a level, adjusts damage vs HP balance, and gets auto-generated attack formulas.

**Architecture:** Monster table data as a typed constant array. Formula generator produces elegant dice expressions with round modifiers. GuidedBuilder component replaces MonsterForm in new/edit pages, managing builder state (level, offsets, armor, die size) and syncing to the AnyMonster model. Stat block preview stays unchanged.

**Tech Stack:** TypeScript, React 19, Next.js 16, Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-04-12-guided-monster-builder-design.md`

---

### Task 1: Add builderConfig to Types and Schemas

**Files:**
- Modify: `apps/portal/lib/monsters/types.ts`
- Modify: `apps/portal/lib/monsters/schemas.ts`

- [ ] **Step 1: Add BuilderConfig interface and field to types.ts**

Add before `MonsterBase`:

```typescript
export interface BuilderConfig {
  baseLevel: number;
  hpLevelOffset: number;
  damageLevelOffset: number;
  dieSize: number;
}
```

Add to `MonsterBase` interface, after `notes?: string;`:

```typescript
  builderConfig?: BuilderConfig;
```

- [ ] **Step 2: Add builderConfig to Zod schema in schemas.ts**

Add after the `timestampsSchema` definition:

```typescript
const builderConfigSchema = z
  .object({
    baseLevel: z.number(),
    hpLevelOffset: z.number().int(),
    damageLevelOffset: z.number().int(),
    dieSize: z.number().int().positive(),
  })
  .optional();
```

Add `builderConfig: builderConfigSchema,` to `monsterBaseSchema` after the `timestamps` field.

- [ ] **Step 3: Verify typecheck passes**

Run: `npx turbo typecheck --filter=@nimble/portal`

- [ ] **Step 4: Commit**

```bash
git add apps/portal/lib/monsters/types.ts apps/portal/lib/monsters/schemas.ts
git commit -m "feat(portal): add builderConfig to monster types and schemas"
```

---

### Task 2: Monster Table Data

**Files:**
- Create: `apps/portal/lib/monsters/monster-table.ts`

- [ ] **Step 1: Create monster-table.ts with full table data and lookup functions**

```typescript
// apps/portal/lib/monsters/monster-table.ts

export interface MonsterTableRow {
  level: number;
  hp: { none: number; medium: number; heavy: number };
  damagePerRound: number;
  attackSample: { single: string; dual: string | null };
  saveDC: number;
  crEquiv: number;
}

export const MONSTER_TABLE: MonsterTableRow[] = [
  { level: 0.25, hp: { none: 12, medium: 9, heavy: 7 }, damagePerRound: 3, attackSample: { single: "1d4+1", dual: null }, saveDC: 9, crEquiv: 0.125 },
  { level: 0.33, hp: { none: 15, medium: 11, heavy: 8 }, damagePerRound: 5, attackSample: { single: "1d6+2", dual: null }, saveDC: 9, crEquiv: 0.25 },
  { level: 0.5, hp: { none: 18, medium: 15, heavy: 11 }, damagePerRound: 7, attackSample: { single: "1d6+3", dual: null }, saveDC: 10, crEquiv: 0.25 },
  { level: 1, hp: { none: 26, medium: 20, heavy: 16 }, damagePerRound: 11, attackSample: { single: "2d8+2", dual: "1d8+1" }, saveDC: 10, crEquiv: 0.5 },
  { level: 2, hp: { none: 34, medium: 27, heavy: 20 }, damagePerRound: 13, attackSample: { single: "2d8+4", dual: "1d8+3" }, saveDC: 11, crEquiv: 1 },
  { level: 3, hp: { none: 41, medium: 33, heavy: 25 }, damagePerRound: 15, attackSample: { single: "2d8+6", dual: "1d8+4" }, saveDC: 11, crEquiv: 1 },
  { level: 4, hp: { none: 49, medium: 39, heavy: 29 }, damagePerRound: 18, attackSample: { single: "2d8+9", dual: "1d8+5" }, saveDC: 12, crEquiv: 2 },
  { level: 5, hp: { none: 58, medium: 46, heavy: 35 }, damagePerRound: 19, attackSample: { single: "2d8+10", dual: "1d8+6" }, saveDC: 12, crEquiv: 2 },
  { level: 6, hp: { none: 68, medium: 54, heavy: 41 }, damagePerRound: 21, attackSample: { single: "2d8+12", dual: "1d8+7" }, saveDC: 13, crEquiv: 3 },
  { level: 7, hp: { none: 79, medium: 63, heavy: 47 }, damagePerRound: 24, attackSample: { single: "3d8+10", dual: "2d8+4" }, saveDC: 13, crEquiv: 3 },
  { level: 8, hp: { none: 91, medium: 73, heavy: 55 }, damagePerRound: 26, attackSample: { single: "3d8+12", dual: "2d8+5" }, saveDC: 14, crEquiv: 4 },
  { level: 9, hp: { none: 104, medium: 83, heavy: 62 }, damagePerRound: 28, attackSample: { single: "4d8+10", dual: "2d8+6" }, saveDC: 14, crEquiv: 4 },
  { level: 10, hp: { none: 118, medium: 94, heavy: 71 }, damagePerRound: 30, attackSample: { single: "4d8+12", dual: "2d8+7" }, saveDC: 15, crEquiv: 5 },
  { level: 11, hp: { none: 133, medium: 106, heavy: 80 }, damagePerRound: 33, attackSample: { single: "5d8+11", dual: "3d8+3" }, saveDC: 15, crEquiv: 6 },
  { level: 12, hp: { none: 149, medium: 119, heavy: 89 }, damagePerRound: 35, attackSample: { single: "5d8+13", dual: "3d8+4" }, saveDC: 16, crEquiv: 7 },
  { level: 13, hp: { none: 166, medium: 132, heavy: 100 }, damagePerRound: 38, attackSample: { single: "6d8+11", dual: "3d8+6" }, saveDC: 16, crEquiv: 8 },
  { level: 14, hp: { none: 184, medium: 147, heavy: 110 }, damagePerRound: 40, attackSample: { single: "6d8+13", dual: "3d8+7" }, saveDC: 17, crEquiv: 9 },
  { level: 15, hp: { none: 203, medium: 162, heavy: 122 }, damagePerRound: 43, attackSample: { single: "7d8+11", dual: "3d8+8" }, saveDC: 17, crEquiv: 9 },
  { level: 16, hp: { none: 223, medium: 178, heavy: 134 }, damagePerRound: 45, attackSample: { single: "7d8+13", dual: "4d8+5" }, saveDC: 18, crEquiv: 10 },
  { level: 17, hp: { none: 244, medium: 195, heavy: 146 }, damagePerRound: 48, attackSample: { single: "8d8+12", dual: "4d8+6" }, saveDC: 18, crEquiv: 11 },
  { level: 18, hp: { none: 266, medium: 213, heavy: 160 }, damagePerRound: 50, attackSample: { single: "8d8+14", dual: "4d8+7" }, saveDC: 19, crEquiv: 12 },
  { level: 19, hp: { none: 289, medium: 231, heavy: 173 }, damagePerRound: 52, attackSample: { single: "9d8+12", dual: "4d8+8" }, saveDC: 19, crEquiv: 13 },
  { level: 20, hp: { none: 313, medium: 250, heavy: 189 }, damagePerRound: 54, attackSample: { single: "9d8+13", dual: "4d8+9" }, saveDC: 20, crEquiv: 14 },
];

export function getRowByLevel(level: number): MonsterTableRow | undefined {
  return MONSTER_TABLE.find((row) => row.level === level);
}

export function getRowByIndex(index: number): MonsterTableRow {
  const clamped = Math.max(0, Math.min(index, MONSTER_TABLE.length - 1));
  return MONSTER_TABLE[clamped];
}

export function getLevelIndex(level: number): number {
  const idx = MONSTER_TABLE.findIndex((row) => row.level === level);
  return idx >= 0 ? idx : 0;
}

export function getHpForArmor(
  row: MonsterTableRow,
  armor: "None" | "Medium" | "Heavy"
): number {
  const key = armor.toLowerCase() as "none" | "medium" | "heavy";
  return row.hp[key];
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx turbo typecheck --filter=@nimble/portal`

- [ ] **Step 3: Commit**

```bash
git add apps/portal/lib/monsters/monster-table.ts
git commit -m "feat(portal): add monster stat table data with lookup functions"
```

---

### Task 3: Formula Generator

**Files:**
- Create: `apps/portal/lib/monsters/formula-generator.ts`

- [ ] **Step 1: Create formula-generator.ts**

```typescript
// apps/portal/lib/monsters/formula-generator.ts

export interface AttackFormula {
  formula: string;      // e.g., "2d8+10"
  averageDamage: number; // actual average of the formula
  attacks: number;       // 1 for single, 2 for dual
}

const DIE_AVERAGES: Record<number, number> = {
  4: 2.5,
  6: 3.5,
  8: 4.5,
  10: 5.5,
  12: 6.5,
  20: 10.5,
};

export const DIE_THEMES: { size: number; label: string }[] = [
  { size: 4, label: "d4 — Undead" },
  { size: 6, label: "d6 — Goblins" },
  { size: 8, label: "d8 — Humans (default)" },
  { size: 10, label: "d10 — Beasts" },
  { size: 12, label: "d12 — Giants" },
  { size: 20, label: "d20 — Mightiest" },
];

/**
 * Round a modifier to the nearest "clean" value.
 * Prefers multiples of 5, but keeps small values (1-3) as-is.
 */
function roundModifier(raw: number): number {
  if (raw <= 0) return 0;
  if (raw <= 3) return raw;
  return Math.round(raw / 5) * 5;
}

/**
 * Score a formula: lower is better.
 * Penalizes deviation from target and non-round modifiers.
 */
function scoreFormula(
  avg: number,
  target: number,
  modifier: number
): number {
  const deviation = Math.abs(avg - target);
  const modClean = modifier % 5 === 0 || modifier <= 3 ? 0 : 1;
  return deviation + modClean * 2;
}

function formatFormula(count: number, dieSize: number, modifier: number): string {
  if (modifier === 0) return `${count}d${dieSize}`;
  return `${count}d${dieSize}+${modifier}`;
}

/**
 * Generate elegant attack formulas for a damage-per-round target.
 */
export function generateFormulas(
  damageTarget: number,
  dieSize: number
): AttackFormula[] {
  const avg = DIE_AVERAGES[dieSize];
  if (!avg) return [];

  const results: AttackFormula[] = [];

  // Generate single-attack options
  for (let count = 1; count <= 6; count++) {
    const diceAvg = count * avg;
    const rawMod = damageTarget - diceAvg;
    if (rawMod < 0) continue;

    const mod = roundModifier(rawMod);
    const actualAvg = diceAvg + mod;

    // Only accept if within 2 of target
    if (Math.abs(actualAvg - damageTarget) <= 2) {
      results.push({
        formula: formatFormula(count, dieSize, mod),
        averageDamage: actualAvg,
        attacks: 1,
      });
    }
  }

  // Generate dual-attack options (2x, each doing half)
  const halfTarget = damageTarget / 2;
  for (let count = 1; count <= 4; count++) {
    const diceAvg = count * avg;
    const rawMod = halfTarget - diceAvg;
    if (rawMod < 0) continue;

    const mod = roundModifier(rawMod);
    const perHitAvg = diceAvg + mod;
    const totalAvg = perHitAvg * 2;

    if (Math.abs(totalAvg - damageTarget) <= 3) {
      results.push({
        formula: `(2×) ${formatFormula(count, dieSize, mod)}`,
        averageDamage: totalAvg,
        attacks: 2,
      });
    }
  }

  // Sort by score (best first), then deduplicate
  results.sort((a, b) => {
    const aMod = parseModifier(a.formula);
    const bMod = parseModifier(b.formula);
    const aScore = scoreFormula(a.averageDamage, damageTarget, aMod);
    const bScore = scoreFormula(b.averageDamage, damageTarget, bMod);
    return aScore - bScore;
  });

  // Keep top 2 single + top 2 dual
  const singles = results.filter((r) => r.attacks === 1).slice(0, 2);
  const duals = results.filter((r) => r.attacks === 2).slice(0, 2);
  return [...singles, ...duals];
}

function parseModifier(formula: string): number {
  const clean = formula.replace(/^\(2×\)\s*/, "");
  const match = clean.match(/\+(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx turbo typecheck --filter=@nimble/portal`

- [ ] **Step 3: Commit**

```bash
git add apps/portal/lib/monsters/formula-generator.ts
git commit -m "feat(portal): add elegant attack formula generator"
```

---

### Task 4: Guided Builder Component

**Files:**
- Create: `apps/portal/components/monsters/guided-builder.tsx`

This is the main component replacing MonsterForm. It manages builder state (level, offsets, armor, die size) and syncs to the AnyMonster model.

- [ ] **Step 1: Create guided-builder.tsx**

```tsx
// apps/portal/components/monsters/guided-builder.tsx

"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Minus } from "lucide-react";
import {
  MONSTER_TABLE,
  getLevelIndex,
  getRowByIndex,
  getHpForArmor,
} from "@/lib/monsters/monster-table";
import {
  generateFormulas,
  DIE_THEMES,
  type AttackFormula,
} from "@/lib/monsters/formula-generator";
import { MONSTER_SIZES, ARMOR_TYPES } from "@/lib/monsters/constants";
import type {
  AnyMonster,
  MonsterPassive,
  MonsterAction,
  BuilderConfig,
  ArmorType,
} from "@/lib/monsters/types";

interface GuidedBuilderProps {
  monster: AnyMonster;
  onChange: (monster: AnyMonster) => void;
}

function getInitialConfig(monster: AnyMonster): BuilderConfig {
  if (monster.builderConfig) return monster.builderConfig;
  return {
    baseLevel: monster.level || 1,
    hpLevelOffset: 0,
    damageLevelOffset: 0,
    dieSize: 8,
  };
}

export function GuidedBuilder({ monster, onChange }: GuidedBuilderProps) {
  const [config, setConfig] = useState<BuilderConfig>(() =>
    getInitialConfig(monster)
  );

  const baseIndex = getLevelIndex(config.baseLevel);
  const hpRow = getRowByIndex(baseIndex + config.hpLevelOffset);
  const damageRow = getRowByIndex(baseIndex + config.damageLevelOffset);
  const baseRow = getRowByIndex(baseIndex);

  const hp = getHpForArmor(hpRow, monster.armor);
  const formulas = generateFormulas(damageRow.damagePerRound, config.dieSize);

  // Sync config changes to monster
  function updateConfig(patch: Partial<BuilderConfig>) {
    const next = { ...config, ...patch };
    setConfig(next);

    const newBaseIndex = getLevelIndex(next.baseLevel);
    const newHpRow = getRowByIndex(newBaseIndex + next.hpLevelOffset);
    const newDamageRow = getRowByIndex(newBaseIndex + next.damageLevelOffset);
    const newHp = getHpForArmor(newHpRow, monster.armor);

    onChange({
      ...monster,
      level: next.baseLevel,
      hitPoints: newHp,
      builderConfig: next,
    } as AnyMonster);
  }

  function updateMonster(patch: Partial<AnyMonster>) {
    const updated = { ...monster, ...patch, builderConfig: config } as AnyMonster;

    // If armor changed, recalculate HP
    if (patch.armor && patch.armor !== monster.armor) {
      const newHp = getHpForArmor(hpRow, patch.armor as ArmorType);
      updated.hitPoints = newHp;
    }

    onChange(updated);
  }

  function shiftBalance(direction: number) {
    // direction: +1 = more damage, -1 = more tanky
    const newDmgOffset = config.damageLevelOffset + direction;
    const newHpOffset = config.hpLevelOffset - direction;

    // Clamp to table bounds
    const dmgIndex = baseIndex + newDmgOffset;
    const hpIndex = baseIndex + newHpOffset;
    if (dmgIndex < 0 || dmgIndex >= MONSTER_TABLE.length) return;
    if (hpIndex < 0 || hpIndex >= MONSTER_TABLE.length) return;

    updateConfig({
      damageLevelOffset: newDmgOffset,
      hpLevelOffset: newHpOffset,
    });
  }

  function addAttackFormula(formula: AttackFormula) {
    const action: MonsterAction = {
      name: "",
      description: "",
      diceFormula: formula.formula.replace("(2×) ", ""),
      reach: 1,
    };

    if (formula.attacks === 2) {
      action.description = "2 attacks";
    }

    updateMonster({
      actions: [...monster.actions, action],
    });
  }

  // Passive helpers
  function addPassive() {
    updateMonster({
      passives: [...monster.passives, { name: "", description: "" }],
    });
  }
  function removePassive(index: number) {
    updateMonster({
      passives: monster.passives.filter((_, i) => i !== index),
    });
  }
  function updatePassive(index: number, patch: Partial<MonsterPassive>) {
    updateMonster({
      passives: monster.passives.map((p, i) =>
        i === index ? { ...p, ...patch } : p
      ),
    });
  }

  // Action helpers
  function removeAction(index: number) {
    updateMonster({
      actions: monster.actions.filter((_, i) => i !== index),
    });
  }
  function updateAction(index: number, patch: Partial<MonsterAction>) {
    updateMonster({
      actions: monster.actions.map((a, i) =>
        i === index ? { ...a, ...patch } : a
      ),
    });
  }

  const labelClass = "block text-sm font-medium text-foreground mb-1";
  const inputClass =
    "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="space-y-6">
      {/* Reference Bar */}
      <div className="bg-muted rounded-md px-4 py-3 text-sm text-foreground flex flex-wrap gap-4">
        <span>
          <span className="font-semibold">Level</span> {config.baseLevel}
        </span>
        <span>
          <span className="font-semibold">HP</span> {hp} ({monster.armor})
        </span>
        <span>
          <span className="font-semibold">Dmg/round</span>{" "}
          {damageRow.damagePerRound}
        </span>
        <span>
          <span className="font-semibold">Save DC</span> {baseRow.saveDC}
        </span>
      </div>

      {/* Section 1: Level & Armor */}
      <div className="space-y-3">
        <h4 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide">
          Level & Armor
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Level</label>
            <select
              className={inputClass}
              value={config.baseLevel}
              onChange={(e) =>
                updateConfig({
                  baseLevel: parseFloat(e.target.value),
                  hpLevelOffset: 0,
                  damageLevelOffset: 0,
                })
              }
            >
              {MONSTER_TABLE.map((row) => (
                <option key={row.level} value={row.level}>
                  {row.level < 1
                    ? `1/${Math.round(1 / row.level)}`
                    : row.level}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Armor</label>
            <div className="flex gap-1">
              {ARMOR_TYPES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => updateMonster({ armor: a })}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    monster.armor === a
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Balance Dial */}
      <div className="space-y-3">
        <h4 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide">
          Balance
        </h4>
        <div className="bg-card border border-border rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              More Damage
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              More Survivability
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => shiftBalance(1)}
              className="p-2 rounded-md bg-muted hover:bg-muted/80 text-foreground"
              title="Increase damage, decrease HP"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center">
              <div className="flex justify-between text-sm">
                <span>
                  Dmg {damageRow.damagePerRound}/round
                  {config.damageLevelOffset !== 0 && (
                    <span className="text-muted-foreground ml-1">
                      ({config.damageLevelOffset > 0 ? "+" : ""}
                      {config.damageLevelOffset})
                    </span>
                  )}
                </span>
                <span>
                  HP {hp}
                  {config.hpLevelOffset !== 0 && (
                    <span className="text-muted-foreground ml-1">
                      ({config.hpLevelOffset > 0 ? "+" : ""}
                      {config.hpLevelOffset})
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${50 + config.damageLevelOffset * 5}%`,
                    marginLeft: `${Math.max(0, -config.damageLevelOffset * 5)}%`,
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => shiftBalance(-1)}
              className="p-2 rounded-md bg-muted hover:bg-muted/80 text-foreground"
              title="Increase HP, decrease damage"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Die Size & Attacks */}
      <div className="space-y-3">
        <h4 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide">
          Attacks
        </h4>
        <div>
          <label className={labelClass}>Die Size</label>
          <select
            className={inputClass}
            value={config.dieSize}
            onChange={(e) =>
              updateConfig({ dieSize: parseInt(e.target.value, 10) })
            }
          >
            {DIE_THEMES.map((d) => (
              <option key={d.size} value={d.size}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>
            Suggested Attacks (click to add)
          </label>
          <div className="flex flex-wrap gap-2">
            {formulas.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addAttackFormula(f)}
                className="px-3 py-1.5 text-sm font-mono bg-card border border-border rounded-md hover:border-primary hover:text-primary transition-colors"
                title={`avg ${f.averageDamage} dmg`}
              >
                {f.formula}
              </button>
            ))}
            {formulas.length === 0 && (
              <span className="text-sm text-muted-foreground">
                No formulas for this combination
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Identity */}
      <div className="space-y-3">
        <h4 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide">
          Identity
        </h4>
        <div>
          <label className={labelClass}>Name</label>
          <input
            type="text"
            value={monster.name}
            onChange={(e) => updateMonster({ name: e.target.value })}
            placeholder="Monster name"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Size</label>
            <select
              className={inputClass}
              value={monster.size}
              onChange={(e) =>
                updateMonster({
                  size: e.target.value as AnyMonster["size"],
                })
              }
            >
              {MONSTER_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <input
              type="text"
              value={monster.type ?? ""}
              onChange={(e) =>
                updateMonster({ type: e.target.value || undefined })
              }
              placeholder="e.g. Undead"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Speed</label>
            <input
              type="number"
              value={monster.speed}
              onChange={(e) =>
                updateMonster({ speed: parseInt(e.target.value, 10) || 6 })
              }
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Group</label>
          <input
            type="text"
            value={monster.group ?? ""}
            onChange={(e) =>
              updateMonster({ group: e.target.value || undefined })
            }
            placeholder="e.g. Goblinoid"
            className={inputClass}
          />
        </div>
      </div>

      {/* Passives */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide">
            Passives
          </h4>
          <button
            type="button"
            onClick={addPassive}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {monster.passives.map((p, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={p.name}
                onChange={(e) => updatePassive(i, { name: e.target.value })}
                placeholder="Passive name"
                className={inputClass}
              />
              <textarea
                value={p.description}
                onChange={(e) =>
                  updatePassive(i, { description: e.target.value })
                }
                placeholder="Description"
                rows={2}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={() => removePassive(i)}
              className="self-start p-2 text-destructive hover:text-destructive/80"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide">
            Actions
          </h4>
          <button
            type="button"
            onClick={() =>
              updateMonster({
                actions: [
                  ...monster.actions,
                  { name: "", description: "", reach: 1 },
                ],
              })
            }
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {monster.actions.map((a, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={a.name}
                onChange={(e) => updateAction(i, { name: e.target.value })}
                placeholder="Action name"
                className={inputClass}
              />
              <textarea
                value={a.description}
                onChange={(e) =>
                  updateAction(i, { description: e.target.value })
                }
                placeholder="Description"
                rows={2}
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={a.reach ?? 1}
                  onChange={(e) =>
                    updateAction(i, {
                      reach: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  placeholder="Reach"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={a.diceFormula ?? ""}
                  onChange={(e) =>
                    updateAction(i, {
                      diceFormula: e.target.value || undefined,
                    })
                  }
                  placeholder="Dice formula"
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeAction(i)}
              className="self-start p-2 text-destructive hover:text-destructive/80"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          value={monster.notes ?? ""}
          onChange={(e) =>
            updateMonster({ notes: e.target.value || undefined })
          }
          placeholder="Additional notes..."
          rows={3}
          className={inputClass}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx turbo typecheck --filter=@nimble/portal`

- [ ] **Step 3: Commit**

```bash
git add apps/portal/components/monsters/guided-builder.tsx
git commit -m "feat(portal): add guided monster builder component"
```

---

### Task 5: Integrate Guided Builder into Pages and Update Defaults

**Files:**
- Modify: `apps/portal/app/monsters/new/page.tsx`
- Modify: `apps/portal/app/monsters/[id]/page.tsx`
- Modify: `apps/portal/lib/monsters/defaults.ts`

- [ ] **Step 1: Update defaults.ts to include builderConfig and table-driven HP**

Replace the entire `createDefaultMonster` function body so it uses the monster table for HP:

```typescript
import { getRowByLevel, getHpForArmor } from "./monster-table";
```

Add this import at the top. Then update the default monster to have `builderConfig` and table-driven HP:

```typescript
export function createDefaultMonster(
  overrides?: Partial<Omit<Monster, "kind" | "id" | "timestamps">>
): Monster {
  const now = new Date().toISOString();
  const level = overrides?.level ?? 1;
  const armor = overrides?.armor ?? "None";
  const row = getRowByLevel(level);
  const hp = row ? getHpForArmor(row, armor) : 10;

  return {
    id: crypto.randomUUID(),
    kind: "standard",
    name: "",
    level,
    size: "Medium",
    hitPoints: hp,
    armor,
    speed: 6,
    passives: [],
    actions: [],
    builderConfig: {
      baseLevel: level,
      hpLevelOffset: 0,
      damageLevelOffset: 0,
      dieSize: 8,
    },
    timestamps: {
      createdAt: now,
      updatedAt: now,
    },
    ...overrides,
  };
}
```

- [ ] **Step 2: Update new/page.tsx to use GuidedBuilder**

Replace the `MonsterForm` import with `GuidedBuilder`:

Change:
```tsx
import { MonsterForm } from "@/components/monsters/monster-form";
```
To:
```tsx
import { GuidedBuilder } from "@/components/monsters/guided-builder";
```

In the JSX, replace:
```tsx
<MonsterForm monster={monster} onChange={setMonster} />
```
With:
```tsx
<GuidedBuilder monster={monster} onChange={setMonster} />
```

- [ ] **Step 3: Update [id]/page.tsx to use GuidedBuilder for standard monsters**

Replace the `MonsterForm` import with both:

```tsx
import { GuidedBuilder } from "@/components/monsters/guided-builder";
import { MonsterForm } from "@/components/monsters/monster-form";
```

In the JSX, replace:
```tsx
<MonsterForm monster={monster} onChange={setMonster} />
```
With:
```tsx
{monster.kind === "standard" ? (
  <GuidedBuilder monster={monster} onChange={setMonster} />
) : (
  <MonsterForm monster={monster} onChange={setMonster} />
)}
```

This keeps the freeform form for legendary monsters until the guided legendary builder is built.

- [ ] **Step 4: Verify typecheck passes**

Run: `npx turbo typecheck --filter=@nimble/portal`

- [ ] **Step 5: Verify lint passes**

Run: `npx turbo lint --filter=@nimble/portal`

- [ ] **Step 6: Commit**

```bash
git add apps/portal/lib/monsters/defaults.ts apps/portal/app/monsters/new/page.tsx apps/portal/app/monsters/\\[id\\]/page.tsx
git commit -m "feat(portal): integrate guided builder into monster pages"
```

---

### Task 6: Verification

No files to create/modify.

- [ ] **Step 1: Run full lint and typecheck**

Run: `npx turbo lint typecheck --filter=@nimble/portal`
Expected: PASS (0 errors, only the pre-existing font warning)

- [ ] **Step 2: Verify dev server starts**

Run: `npx turbo dev --filter=@nimble/portal`
Verify http://localhost:4000/monsters loads without errors.
