# Monster Builder — Design Spec

## Overview

A monster creation tool added as routes within the existing portal app (`apps/portal`). Lets GMs create and save Nimble-format monsters locally in the browser with a live stat block preview.

## Decisions

- **Location**: Routes within `apps/portal/app/monsters/`, not a separate app
- **Auth**: None required — all monster routes are unauthenticated
- **Storage**: localStorage only, key `nimble-monsters`
- **Theme**: Shares portal's existing Nimble HSL theme
- **Port**: Shares portal's dev server (4000)
- **Builder logic**: Placeholder form for now — guided builder steps will be added when GM monster creation rules are provided

## Data Model

### MonsterPassive

```typescript
interface MonsterPassive {
  name: string;
  description: string;
}
```

### MonsterAction

```typescript
interface MonsterAction {
  name: string;
  description: string;
  reach?: number;         // Default 1, per-action
  diceFormula?: string;   // e.g., "2d6+3"
}
```

### MonsterPhase

```typescript
interface MonsterPhase {
  description: string;
  passives?: MonsterPassive[];
  actions?: MonsterAction[];
}
```

### MonsterBase (shared fields)

```typescript
interface MonsterBase {
  id: string;                    // crypto.randomUUID()
  name: string;
  kind: "standard" | "legendary";
  level: number;                 // Fractions rounded: 1/3 → 0.33
  size: "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";
  type?: string;                 // "Undead", "Beast", "Elemental", etc.
  group?: string;                // Monster group name

  hitPoints: number;
  armor: "None" | "Medium" | "Heavy";
  speed: number;

  saves?: {
    strength?: number;           // Positive = advantage stacks, negative = disadvantage
    dexterity?: number;
    intelligence?: number;
    will?: number;
  };

  passives: MonsterPassive[];
  actions: MonsterAction[];

  notes?: string;
  timestamps: {
    createdAt: string;           // ISO 8601
    updatedAt: string;           // ISO 8601
  };
}
```

### Monster (standard)

```typescript
interface Monster extends MonsterBase {
  kind: "standard";
}
```

### LegendaryMonster

```typescript
interface LegendaryMonster extends MonsterBase {
  kind: "legendary";
  bloodied?: MonsterPhase;       // Triggered at half HP
  lastStand?: MonsterPhase;      // Final phase
}
```

### Discriminated Union

```typescript
type AnyMonster = Monster | LegendaryMonster;
```

Zod uses `discriminatedUnion` on `kind`. `"standard"` produces a `Monster`, `"legendary"` produces a `LegendaryMonster` with optional `bloodied`/`lastStand`.

## File Structure

```
apps/portal/app/monsters/
├── page.tsx              # Monster list/gallery
├── layout.tsx            # Monsters layout wrapper
├── new/
│   └── page.tsx          # Create new monster
└── [id]/
    └── page.tsx          # Edit existing monster

apps/portal/lib/monsters/
├── types.ts              # Monster TypeScript interfaces
├── schemas.ts            # Zod validation schemas
├── storage.ts            # localStorage CRUD service
├── defaults.ts           # Default values and templates
└── constants.ts          # Size categories, armor types, etc.

apps/portal/components/monsters/
├── monster-form.tsx          # Builder form (placeholder for GM rules)
├── monster-stat-block.tsx    # Live stat block preview renderer
├── monster-card.tsx          # Card for list/gallery view
└── monster-list.tsx          # Gallery/list of saved monsters
```

## Storage Layer

- **Key**: `nimble-monsters`
- **Format**: JSON array of `AnyMonster[]`
- **Operations**: `getAll()`, `getById(id)`, `save(monster)`, `delete(id)`
- **Validation**: Zod parse on load, graceful handling of corrupt data
- **IDs**: `crypto.randomUUID()`
- **Timestamps**: `createdAt` set on first save, `updatedAt` on every save

## UI Layout

### `/monsters` — List Page

- Grid of monster cards showing name, level, size, HP, armor
- "Create Monster" button (prominent)
- Empty state with prompt to create first monster

### `/monsters/new` — Create Page

- Two-column desktop: builder form (left), live stat block preview (right)
- Mobile: stacked vertically (form top, preview below or toggled)
- Form contains basic data model fields as placeholder
- Guided builder steps added later when GM rules arrive

### `/monsters/[id]` — Edit Page

- Same two-column layout as create page
- Pre-populated with saved monster data
- Save and delete actions

### Stat Block Preview

Renders the monster in Nimble-native stat block format, matching the vault's existing format:

```
Monster Name
Level: X | Size: Medium | Type: Undead
HP: X | Armor: Medium | Speed: X
Saves: STR+ DEX-

> Passive Name. Description text.

- Action Name. Description text. (dice formula)

BLOODIED (legendary only)
Description text.

LAST STAND (legendary only)
Description text.
```

## Portal Integration

- The existing placeholder link in `portal-home.tsx` and `landing-page.tsx` (`href: '/monsters'`, `status: 'placeholder'`) will be updated to `status: 'active'` or equivalent so it navigates to the working route
- No auth check needed — monster routes are accessible to all visitors

## Scope

### In scope (this scaffold)

- Routes under `apps/portal/app/monsters/`
- TypeScript interfaces and Zod schemas for monsters
- localStorage CRUD service
- List/create/edit pages with two-column layout
- Live stat block preview component
- Basic form with data model fields (placeholder for GM-guided builder)
- Update portal placeholder link status

### Out of scope

- GM-rules-guided builder logic (waiting for rules to be provided)
- Authentication / server sync
- Export / import
- Encounter builder integration
- Monster sharing

### Deferred until GM rules arrive

- Specific form steps / wizard flow
- Validation rules based on monster creation guidelines
- Level-based HP/stat calculations or suggestions
- Guided templates or presets
