# Monster Builder

A client-side monster creation tool for Nimble RPG, integrated into the portal app at `/monsters`.

## Routes

| Route | Description |
|-------|-------------|
| `/monsters` | List/gallery of saved monsters |
| `/monsters/new` | Create a new monster with live stat block preview |
| `/monsters/[id]` | Edit an existing monster |

## Architecture

**No auth required.** All monster routes are publicly accessible.

**Storage:** localStorage only, key `nimble-monsters`. All data lives in the browser. Monsters are validated with Zod on both read and write.

**Rendering:** All route pages are client components (`"use client"`). The layout is a server component that renders the portal header and a centered content area.

## Data Model

Two monster kinds, discriminated by the `kind` field:

- **Standard** (`kind: "standard"`) — level, HP, armor, speed, saves, passives, actions
- **Legendary** (`kind: "legendary"`) — extends standard with optional `bloodied` and `lastStand` phases

Levels are numeric (fractions like 1/3 are stored as `0.33`). Saves are integers representing advantage/disadvantage stacks (positive = advantage, negative = disadvantage). Reach is per-action, not per-monster.

See `lib/monsters/types.ts` for the full type definitions.

## File Structure

```
lib/monsters/
  constants.ts    # Size categories, armor types, storage key
  types.ts        # TypeScript interfaces (MonsterBase, Monster, LegendaryMonster, etc.)
  schemas.ts      # Zod validation schemas with discriminatedUnion on kind
  defaults.ts     # Factory functions for creating blank monsters
  storage.ts      # localStorage CRUD (getAllMonsters, getMonsterById, saveMonster, deleteMonster)

components/monsters/
  monster-form.tsx       # Builder form with dynamic passives/actions lists
  monster-stat-block.tsx # Live preview renderer (Nimble-native stat block format)
  monster-card.tsx       # Card component for the list view
  monster-list.tsx       # Grid of cards with empty state

app/monsters/
  layout.tsx      # Server component — header + centered layout
  page.tsx        # Monster list page
  new/page.tsx    # Create monster page (form + live preview)
  [id]/page.tsx   # Edit monster page (form + live preview + delete)
```

## Planned Work

The current form is a basic placeholder. The following will be added when the GM monster creation rules are provided:

- **Guided builder** — step-by-step wizard following the GM guide's monster creation process
- **Level-based suggestions** — auto-calculated HP, stat recommendations based on monster level
- **Legendary phase editing** — form inputs for bloodied/lastStand (the preview already renders them)
- **Templates/presets** — starting points for common monster archetypes
