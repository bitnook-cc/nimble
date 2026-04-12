# Guided Monster Builder — Design Spec

## Overview

Replace the freeform monster form with a table-driven guided builder. The GM picks a monster level, and all stats populate from the official monster table. "Dials" let the GM shift damage vs HP to create glass cannons, tanks, or balanced monsters while keeping the effective level constant.

## Core Mechanic

**State is three values plus armor:**
- `baseLevel` — the level picked by the GM (0.25, 0.33, 0.5, 1–20)
- `hpLevelOffset` — how many table rows to shift HP (positive = tankier)
- `damageLevelOffset` — how many table rows to shift damage (positive = glass cannon)
- `armor` — None / Medium / Heavy (determines which HP column to read)

**Constraint:** `hpLevelOffset + damageLevelOffset = 0`. Raising damage by N rows forces HP down by N rows. The UI enforces this with linked controls.

**Effective level** = the `baseLevel`. The offsets shift stats within the table but don't change the monster's nominal level.

**Save DC** comes from the base level row and is displayed as read-only reference.

## Monster Table Data

23 rows, levels: 0.25, 0.33, 0.5, 1–20.

Each row contains:
- `level: number`
- `hp: { none: number; medium: number; heavy: number }`
- `damagePerRound: number`
- `attackSample: { single: string; dual: string | null }` (from the official table, as reference)
- `saveDC: number`
- `crEquiv: number`

Stored as a typed constant array in `lib/monsters/monster-table.ts`.

A lookup function `getRowByLevel(level)` returns the row. A function `getRowByIndex(index)` supports offset lookups (for shifted HP/damage). Offsets clamp to table bounds (can't go below row 0 or above row 22).

## Formula Generation

For a given damage-per-round target and die size, generate elegant attack formulas.

**Preferred modifiers** (in order): multiples of 5 (0, 5, 10, 15, 20, 25, 30), then small clean numbers (1, 2, 3).

**Algorithm:**
1. For the chosen die size (d4–d20), iterate reasonable dice counts (1–6).
2. For each count N, compute raw modifier: `target - (N * averageDieValue)`.
3. Round modifier to nearest 5. If the raw modifier is already small and clean (1–3), keep it.
4. Score by: closeness to target + modifier cleanliness.
5. Return top formulas for both single-attack and dual-attack (target / 2).
6. Allow actual average to deviate 1–2 from the table's exact damage if it produces a cleaner formula.

**Die size selection:** Default d8. User picks from dropdown with thematic hints:
- d4: Undead (slow, big bonus damage)
- d6: Goblins (chaotic, miss-or-crit)
- d8: Humans (balanced)
- d10: Beasts (strong)
- d12: Giants (superhuman)
- d20: Mightiest creatures

**Output:** Multiple unnamed formula options like `2d8+10`, `(2x) 1d8+5`. User picks which to use as their monster's actions.

## UI Flow

The builder replaces the current `MonsterForm` with a guided wizard-style layout. The stat block preview stays on the right (live updating).

### Section 1: Level & Armor
- **Level picker:** dropdown with all 23 levels (0.25 through 20)
- **Armor selector:** three buttons (None / Medium / Heavy)
- Stats populate immediately: HP, damage per round, save DC

### Section 2: Balance Dial
- Linked +/- controls or a slider
- Label: "Damage ← → Survivability"
- Left side shows: damage level row, actual damage per round
- Right side shows: HP level row, actual HP
- Moving one direction auto-moves the other
- Clamped to table bounds

### Section 3: Die Size & Attacks
- Die size dropdown (d4–d20 with thematic labels)
- Auto-generated attack formulas displayed as selectable options
- Both single-attack and dual-attack variants shown
- User clicks to add an attack formula to the monster's actions list

### Section 4: Everything Else
- Name, size, type, group, speed inputs (same as current form)
- Passives list (add/remove)
- Actions list (pre-populated from selected attack formulas, user can add more manually)
- Notes textarea

### Reference Bar
- Save DC (read-only, from base level)
- Effective stats summary: "Level 5 | HP 46 (Medium) | Dmg 21/round"

## Data Model Changes

The existing `Monster`/`LegendaryMonster` types and storage are unchanged. The builder state (baseLevel, offsets, armor, die size) is ephemeral UI state — only the final monster data gets saved to localStorage.

One addition to consider: store the builder config on the monster so re-editing uses the same dials:

```typescript
// Optional field on MonsterBase
builderConfig?: {
  baseLevel: number;
  hpLevelOffset: number;
  damageLevelOffset: number;
  dieSize: number;
}
```

This is optional metadata — if present, the edit page restores the dials. If absent (e.g., manually created monster), the edit page shows the raw form.

Add `builderConfig` as an optional field to `MonsterBase` in `types.ts`, to the Zod `monsterBaseSchema` in `schemas.ts` (as `.optional()`), and update `defaults.ts` to include it on new monsters.

## File Changes

**New files:**
- `lib/monsters/monster-table.ts` — table data + lookup functions
- `lib/monsters/formula-generator.ts` — elegant attack formula generation
- `components/monsters/guided-builder.tsx` — the new guided builder UI (replaces monster-form usage in new/edit pages)
- `components/monsters/balance-dial.tsx` — the linked HP/damage offset control
- `components/monsters/attack-picker.tsx` — generated formula display + selection

**Modified files:**
- `app/monsters/new/page.tsx` — use GuidedBuilder instead of MonsterForm
- `app/monsters/[id]/page.tsx` — use GuidedBuilder instead of MonsterForm

**Unchanged files:**
- `monster-form.tsx` — kept as-is for potential manual/advanced editing later
- All type, schema, storage, stat block, card, list files — unchanged

## Scope

**In scope:**
- Monster table data file with all 23 rows
- Lookup functions for level + offset resolution
- Formula generation algorithm with round-modifier preference
- Guided builder UI with level, armor, balance dial, die size, attack picker
- Integration into new/edit pages
- Save DC as read-only reference
- Optional builderConfig storage on monster for re-editing

**Out of scope:**
- Special abilities (user said "we'll add later")
- Legendary monster guided builder (keep manual for now)
- CR equivalent display
- Encounter balancing
