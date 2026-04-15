# Monster Builder

A client-side monster creation tool for Nimble RPG, integrated into the portal app at `/monsters`.

## Routes

| Route | Description |
|-------|-------------|
| `/monsters` | List/gallery of saved monsters |
| `/monsters/new` | Create a new monster with guided builder + live stat block preview |
| `/monsters/[id]` | Edit an existing monster |

## Architecture

**No auth required.** All monster routes are publicly accessible.

**Storage:** localStorage only, key `nimble-monsters`. All data lives in the browser. Monsters are validated with Zod on both read and write.

**Rendering:** All route pages are client components (`"use client"`). The layout is a server component that renders the portal header and a centered content area.

## Guided Builder

Standard monsters use a table-driven guided builder based on the official Nimble monster stat table (23 levels from 1/4 to 20).

**How it works:**
1. **Pick a level** — stats auto-populate from the table (HP, damage/round, save DC)
2. **Pick armor** (None / Medium / Heavy) — HP adjusts to the correct column
3. **Adjust balance** — a linked dial shifts damage vs HP. Raising damage by N rows lowers HP by N rows, keeping the effective level constant. This creates glass cannons, tanks, or balanced monsters.
4. **Pick die size** — default d8, with thematic options (d4: Undead, d6: Goblins, d10: Beasts, d12: Giants, d20: Mightiest)
5. **Select attacks** — elegant formulas are auto-generated with round modifiers (+5, +10, +15 preferred over +9, +11). Click to add to the monster's action list.

Builder state (`builderConfig`) is stored on the monster so dials are restored when re-editing.

Legendary monsters use the freeform form (`MonsterForm`) until a guided legendary builder is implemented.

## Data Model

Two monster kinds, discriminated by the `kind` field:

- **Standard** (`kind: "standard"`) — level, HP, armor, speed, saves, passives, actions
- **Legendary** (`kind: "legendary"`) — extends standard with optional `bloodied` and `lastStand` phases

Levels are numeric (fractions like 1/3 are stored as `0.33`). Saves are integers representing advantage/disadvantage stacks (positive = advantage, negative = disadvantage). Reach is per-action, not per-monster.

See `lib/monsters/types.ts` for the full type definitions.

## File Structure

```
lib/monsters/
  constants.ts          # Size categories, armor types, storage key
  types.ts              # TypeScript interfaces (MonsterBase, Monster, LegendaryMonster, BuilderConfig)
  schemas.ts            # Zod validation schemas with discriminatedUnion on kind
  defaults.ts           # Factory functions — uses monster table for default HP
  storage.ts            # localStorage CRUD (getAllMonsters, getMonsterById, saveMonster, deleteMonster)
  monster-table.ts      # Official 23-row monster stat table + lookup functions
  formula-generator.ts  # Elegant attack formula generation with round-modifier preference

components/monsters/
  guided-builder.tsx     # Table-driven guided builder (level, armor, balance dial, attacks)
  monster-form.tsx       # Freeform builder (used for legendary monsters)
  monster-stat-block.tsx # Live preview renderer (Nimble-native stat block format)
  monster-card.tsx       # Card component for the list view
  monster-list.tsx       # Grid of cards with empty state

app/monsters/
  layout.tsx      # Server component — header + centered layout
  page.tsx        # Monster list page
  new/page.tsx    # Create monster page (guided builder + live preview)
  [id]/page.tsx   # Edit monster page (guided or freeform based on kind)
```

## Planned Work

- **Special abilities** — cost system (each ability costs 1 step of HP or damage)
- **Legendary guided builder** — table-driven builder for legendary monsters with bloodied/lastStand phases
- **Templates/presets** — starting points for common monster archetypes
- **Export/import** — share monsters as JSON files
