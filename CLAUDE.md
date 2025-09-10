# Nimble Navigator - Application Design

## Recent Major Refactor: Multiple Effects Per Feature (December 2024)

### Overview

Completed a major refactor changing from single "effect" per feature to multiple "effects" per feature. This enables features to grant multiple different benefits (e.g., a feature can grant both an ability AND a resource, or multiple attribute boosts).

### Key Changes

- **Features now have `effects: FeatureEffect[]`** instead of `effect: FeatureEffect`
- **Effect-level tracking**: Each effect gets a unique ID (`${parentFeatureId}-${effectIndex}`)
- **FeatureEffectGrant**: Tracks individual effect grants with source information
- **grantedEffects on Character**: Replaces grantedFeatures for granular tracking
- **New FeatureEffectService**: Centralized service for applying effects from features
- **Updated UI components**: New FeatureEffectsDisplay component for rendering multiple effects

## Overview

Nimble Navigator: A comprehensive digital character sheet application for the Nimble RPG system, built as a web application with offline-first architecture and local storage persistence. The app provides a clean, mobile-responsive interface for managing characters, rolling dice, tracking equipment, and managing combat encounters with full support for temporary HP, saving throws, and equipment management.

## Technology Stack

### Frontend

- **Next.js 14** with App Router (client-side only)
- **TypeScript** for type safety
- **Tailwind CSS** for responsive styling
- **shadcn/ui** component library (built on Radix UI)
- **Zod** for runtime data validation
- **pdf-lib** for PDF generation and manipulation

### Storage

- **Local Storage** with abstraction layer for future server sync
- **No server-side state** currently (designed for easy migration)

### Mobile

- **Capacitor** wrapper for native iOS and Android apps
- **Static export** deployment from Next.js build
- **Native platform integration** with device capabilities

## Architecture

### Data Layer

#### Character Model

```typescript
interface Character {
  id: string;
  name: string;
  level: number;
  classId: string;
  subclassId?: string;
  ancestry: AncestryTrait; // Ancestry with features and size category
  background: BackgroundTrait; // Background with passive features
  attributes: { strength; dexterity; intelligence; will };
  hitPoints: { current; max; temporary };
  hitDice: { size; current; max };
  wounds: { current; max };
  resources: ResourceInstance[]; // Generic resource system (mana, fury, focus, etc.)
  config: CharacterConfiguration;
  initiative: Skill;
  actionTracker: { current; base; bonus };
  inEncounter: boolean;
  skills: { [skillName]: Skill };
  inventory: Inventory;
  abilities: Abilities;
  grantedFeatures: string[];
  timestamps: { createdAt; updatedAt };
}

// Resource System - Separates pure definitions from runtime state
interface ResourceDefinition {
  id: string;
  name: string;
  description?: string;
  colorScheme: string; // Predefined color scheme (blue-magic, red-fury, etc.)
  icon?: string; // Icon identifier (sparkles, fire, etc.)
  resetCondition: "safe_rest" | "encounter_end" | "turn_end" | "never" | "manual";
  resetType: "to_max" | "to_zero" | "to_default";
  resetValue?: number;
  minValue: number;
  maxValue: number;
}

interface ResourceInstance {
  definition: ResourceDefinition;
  current: number;
  sortOrder: number;
}
```

#### Service Architecture

- **CharacterCreationService** handles character creation with proper initialization and class/ancestry/background features
- **CharacterService** handles character CRUD operations with validation and business logic
- **ClassService** handles class definitions, subclass management, feature progression, and spell tier system
- **AncestryService** manages ancestry definitions, features (stat boosts, proficiencies, resistances)
- **BackgroundService** manages background definitions with passive features
- **ContentRepositoryService** unified storage for all custom content (classes, ancestries, backgrounds, abilities, spells)
- **ResourceService** manages generic resource system (mana, fury, focus, etc.) with configurable reset conditions
- **DiceService** manages all dice rolling mechanics with advantage/disadvantage and critical hits
- **ActivityLogService** tracks character actions, dice rolls, and resource usage
- **AbilityService** handles ability usage, cooldowns, and roll calculations
- **SettingsService** manages app settings and character selection
- **Singleton pattern** for direct service access without React Context overhead

#### Storage & State

- **Local Storage** with JSON serialization for persistence
- **Character activity logging** with type-safe log entries
- **App settings** with mode switching (basic/full) and character selection
- **Type-safe** operations with Zod validation

### Component Architecture

#### Main Structure

```
app/page.tsx (main orchestrator)
├── AppMenu (settings, character selector)
├── CharacterSheet (main form component, mode-aware)
│   ├── CharacterNameSection (editable character name)
│   ├── AdvantageToggle (global advantage/disadvantage)
│   ├── BasicMode (simplified interface)
│   │   ├── HitPointsSection (HP, temporary HP, wounds)
│   │   ├── ActionTrackerSection (encounter actions)
│   │   ├── AttributesSection (key attribute highlighting + tooltips)
│   │   └── SkillsSection (skill checks)
│   └── FullMode (complete interface)
│       ├── All BasicMode sections
│       ├── ResourceSection (generic resource management)
│       ├── InitiativeSection (initiative rolls)
│       ├── ArmorSection (main vs supplementary armor)
│       ├── ActionsSection (equipped weapons and abilities)
│       ├── AbilitySection (ability management with usage tracking)
│       └── InventorySection (equipment management)
├── CharacterConfigDialog (comprehensive configuration)
│   ├── Basic settings (wounds, HP, inventory size)
│   └── Advanced resource management (CRUD with color schemes & icons)
└── ActivityLog (character activity, dice results, resource usage)
```

#### Modular Design

- **Direct service access** eliminating React Context overhead
- **Component composition** over inheritance
- **Single responsibility** principle per component
- **Reusable UI components** from shadcn/ui
- **Type-safe hooks** for service integration

### Features

#### Core Functionality

1. **Character Management**
   - Editable name and attributes (-2 to 10 range)
   - Class and subclass system with automatic feature progression
   - Ancestry system with size categories, stat boosts, proficiencies and resistances
   - Background system with passive features and cultural descriptions
   - Level-based character advancement with hit dice tracking
   - Custom content upload for classes, ancestries, backgrounds, abilities, and spells
   - Auto-saving to local storage with Zod validation
   - Hit points with current/max/temporary tracking and dying status

2. **Combat & Health System**
   - Hit points with temporary HP (D&D 5e rules)
   - Temporary HP absorbs damage first, doesn't stack
   - Wounds system for tracking serious injuries
   - Quick damage/heal buttons (1, 5, 10) and custom amounts
   - Health bar with color-coded status
   - Dying indicator when at 0 HP

3. **Initiative System**
   - Dexterity-based with skill modifier
   - d20 + dexterity + modifier rolling
   - Collapsible section with persistent state

4. **Attribute & Saving Throws**
   - Four core attributes (Strength, Dexterity, Intelligence, Will)
   - **Key Attribute Highlighting**: Class key attributes shown with bold, underlined text and ring borders
   - **Compact Design**: Icon-only roll/save buttons with hover tooltips
   - Separate roll buttons for attribute checks and saving throws
   - Different roll mechanics: checks/saves vs attacks
   - Visual distinction with different icons (dice for rolls, shield for saves)
   - **Smart Layout**: Responsive grid with tighter spacing for mobile-friendly design

5. **Skills System**
   - 10 predefined skills with attribute associations
   - Base attribute + skill modifier calculation
   - Editable skill-specific bonuses (0-20 range)
   - Individual skill rolling with breakdown

6. **Action Tracker & Encounter System**
   - Combat action tracking with current/base/bonus actions
   - Initiative rolls that set action count for encounters
   - End turn/encounter functionality with ability resets
   - Encounter state management affecting UI and abilities

7. **Equipment System**
   - Equipment flags for weapons and armor
   - Size-based weapon limits (configurable, default: 2)
   - Equip/unequip toggles with validation
   - Equipped items don't count toward inventory size
   - Only equipped weapons appear in actions

8. **Armor System**
   - Main armor vs supplementary armor distinction
   - Only one main armor can be equipped at a time
   - Automatic replacement when equipping new main armor
   - Dexterity bonus calculations with armor limits
   - Visual indicators for armor types and effective bonuses

9. **Generic Resource System**
   - Configurable resources (mana, fury, focus, ki, divine power, etc.)
   - 8 predefined color schemes with dynamic percentage-based gradients
   - 25+ categorized icons (magic, energy, physical, special)
   - Flexible reset conditions (safe rest, encounter end, turn end, never, manual)
   - Multiple reset types (to max, to zero, to custom default value)
   - Visual resource bars with real-time color changes
   - Activity logging for all resource usage
   - Full CRUD operations in character configuration dialog
   - **Class Integration**: ResourceFeature automatically grants resources when leveling up
   - **Pure Definitions**: ResourceDefinition interface separates immutable resource templates from runtime state
   - **Instance Pattern**: ResourceInstance combines definition with current value and sort order
   - **Type Safety**: Complete type separation between definition (template) and instance (runtime state)
   - **Examples**: Wizard "Spell Slots", Fighter "Battlefield Fury", Rogue "Focus", Cleric "Divine Blessing"

10. **Ability System**
    - Freeform abilities (text-only descriptions)
    - Action abilities with frequency-based usage (per-turn, per-encounter, at-will)
    - Integrated roll mechanics with dice, modifiers, and attribute bonuses
    - Automatic ability resets on turn/encounter end
    - Visual usage tracking and roll descriptions

11. **Spell System**
    - **Tier-Based Access (1-9)**: Progressive spell unlocking as characters level up
    - **School-Based Organization**: Spells grouped by magical schools (fire, radiant, frost, nature, shadow, arcane)
    - **Class Integration**: Automatic spell school access through class features (Wizard gets Fire Magic, Cleric gets Radiant Magic)
    - **Resource Integration**: Spells consume mana or other class-specific resources
    - **Dedicated Spell Tab**: Separate interface for spell management with mana tracker
    - **Smart Visibility**: Spells tab automatically hidden for non-spellcasting characters
    - **Expandable School Cards**: Class features section shows unlocked/locked spells per school
    - **Locked Spells Preview**: Spells tab shows future spells available when tier access increases
    - **Spell Cast Logging**: Dedicated activity log entries with school, tier, and resource cost details
    - **Dynamic Tab Positioning**: Spells tab positioned prominently (2nd position) for spellcasters
    - **Visual Spell Status**: Clear indicators for unlocked vs locked spells with tier requirements

12. **Dice Rolling & Combat**
    - **Attack Rolls**: Exploding crits, miss on natural 1
    - **Checks/Saves**: Standard d20 + modifier (no crits/misses)
    - **Ability Rolls**: Custom dice with modifiers and attribute bonuses
    - Advantage/disadvantage system with global toggle
    - Multi-die expressions (2d6, 3d4, etc.)
    - Activity log with comprehensive action tracking

13. **Inventory Management**
    - Five item types: weapons, armor, freeform, consumables, ammunition
    - Size-based capacity system with visual indicators (10 + Strength attribute)
    - Automatic inventory size adjustment when Strength changes
    - Type-specific properties (damage, armor value, description, count for consumables/ammunition)
    - Equipment state tracking and validation

14. **App Modes & Character Management**
    - Basic mode: simplified interface (HP, actions, saves, attributes, skills)
    - Full mode: complete character sheet with inventory and abilities
    - Multiple character support with switching and creation
    - Global settings panel with mode selection
    - Character selector with creation and deletion

15. **Class and Subclass System**
    - Four core classes: Fighter, Wizard, Cleric, Rogue
    - Subclass selection at appropriate levels with automatic feature grants
    - Level-based feature progression with validation
    - Automatic feature synchronization when gaining levels or choosing subclasses
    - Feature tracking with unique identifiers and grant history

16. **Custom Content Management**
    - Unified content management panel for all custom content types
    - JSON file upload with schema validation and error reporting
    - Support for classes, subclasses, ancestries, backgrounds, abilities, and spells
    - Auto-generated JSON examples and schema documentation
    - Visual content browser with collapsible sections and item counts
    - Custom vs built-in content filtering and organization

17. **Advanced UI Features**
    - Collapsible sections with persistent preferences
    - Mobile-responsive design with adaptive grids
    - Consistent visual feedback and state indicators
    - Mode-aware component rendering

18. **Dice Formula System**
    - **Dice Notation**: Standard dice notation (e.g., `1d20`, `3d6`, `2d8+5`)
    - **Mathematical Operations**: Supports `+`, `-`, `*`, `/`, parentheses
    - **Variable Substitution**:
      - Attributes: `STR`, `DEX`, `INT`, `WIL` (or full names: `STRENGTH`, `DEXTERITY`, `INTELLIGENCE`, `WILL`)
      - Character level: `LEVEL` or `LVL`
      - Examples: `1d20+STR`, `2d6+LEVEL*2`, `STRd6+2`
    - **Special Dice**: 
      - Standard: d4, d6, d8, d10, d12, d20, d100
      - Double-digit: d44, d66, d88 (roll two dice for tens and ones)
    - **Dice Options**:
      - Advantage/Disadvantage: Roll extra dice and keep highest/lowest
      - Critical hits: Exploding dice on max rolls (d20 only)
      - Fumbles: Natural 1 on d20 results in automatic failure
      - Vicious: Extra non-exploding die on critical hits
    - **Formula Examples**:
      - `1d20+5` - Roll d20 and add 5
      - `2d6+STR` - Roll 2d6 and add Strength attribute
      - `STRd6` - Roll number of d6 equal to Strength
      - `1d8+LEVEL+2` - Roll d8, add level and 2
      - `(2d4+1)*2` - Roll 2d4, add 1, then multiply by 2

## Key Design Principles

- **Type Safety**: TypeScript throughout with Zod runtime validation
- **Offline-First**: Local storage with repository abstraction for future server sync
- **Mobile-First**: Responsive design with collapsible sections and touch-friendly interface
- **Extensible**: Modular systems allow easy addition of new content and features
- **DRY Principle**: Centralized type definitions and reusable components

## Data Flow

1. **Initialization**: Load character and UI state from localStorage via service factory
2. **User Interaction**: Direct service calls update state and trigger persistence
3. **Validation**: Zod schemas validate all data before storage
4. **Storage**: Service layer abstracts localStorage operations
5. **UI Updates**: Service hooks trigger automatic re-renders without Context overhead

## File Structure

```
lib/
├── config/          # Game configuration and constants
│   └── game-config.ts # Core game rules and limits
├── data/            # Static game data definitions
│   ├── classes/     # Class progression and feature definitions
│   │   ├── berserker.ts, cheat.ts, commander.ts, hunter.ts
│   │   ├── mage.ts, oathsworn.ts, shadowmancer.ts
│   │   └── shepherd.ts, songweaver.ts, stormshifter.ts, zephyr.ts
│   ├── ancestries/  # Built-in ancestry definitions (24 files)
│   │   ├── birdfolk.ts, bunbun.ts, celestial.ts, changeling.ts
│   │   ├── crystalborn.ts, dragonborn.ts, dryad.ts, dwarf.ts
│   │   └── [... and 16 more ancestry files]
│   ├── backgrounds/ # Built-in background definitions (22 files)
│   │   ├── academy-dropout.ts, acrobat.ts, at-home-underground.ts
│   │   └── [... and 19 more background files]
│   ├── subclasses/  # Specialization options for classes (22 files)
│   │   ├── berserker-mountainheart.ts, berserker-red-mist.ts
│   │   └── [... paired subclasses for each class]
│   └── spell-schools.ts # Spell school definitions
├── types/           # TypeScript type definitions
│   ├── character.ts # Character model with traits
│   ├── class.ts # Class and feature types
│   ├── ancestry.ts # Ancestry definitions
│   ├── background.ts # Background definitions
│   ├── feature-effects.ts # Feature effect types (NEW)
│   ├── inventory.ts # Equipment types
│   ├── abilities.ts # Action and spell types
│   ├── resources.ts # Resource system types
│   └── [other type files]
├── schemas/         # Zod validation schemas
│   ├── character.ts # Character validation
│   ├── class.ts # Class validation
│   ├── ancestry.ts # Ancestry validation
│   ├── background.ts # Background validation
│   ├── feature-effects.ts # Effect validation (NEW)
│   ├── resources.ts # Resource validation
│   └── [other schema files]
├── services/        # Business logic layer
│   ├── character-service.ts # Core character operations
│   ├── character-creation-service.ts # Character generation
│   ├── class-service.ts # Class progression
│   ├── feature-effect-service.ts # Effect application (NEW)
│   ├── ancestry-service.ts # Ancestry management
│   ├── background-service.ts # Background management
│   ├── content-repository-service.ts # Content storage
│   ├── resource-service.ts # Resource tracking
│   └── [other service files]
├── hooks/           # React hooks
│   ├── use-character-service.ts
│   ├── use-dice-actions.ts
│   └── use-activity-log.ts
└── utils/           # Utility functions
    ├── character-defaults.ts
    ├── equipment.ts
    └── dice-parser.ts

components/
├── ui/              # shadcn/ui components
├── sections/        # Character sheet sections
│   ├── attributes-section.tsx
│   ├── skills-section.tsx
│   ├── class-features-section.tsx
│   ├── subclass-selections-section.tsx
│   └── [other section components]
├── tabs/            # Tabbed interface
│   ├── combat-tab.tsx
│   ├── skills-tab.tsx
│   ├── character-tab.tsx
│   ├── equipment-tab.tsx
│   └── spells-tab.tsx
├── character-builder/ # Character creation flow
│   ├── features-overview.tsx
│   └── level-up-guide/
│       └── feature-selection-step.tsx
├── feature-effects-display.tsx # Effect rendering (NEW)
├── feature-display.tsx # Feature rendering (NEW)
├── character-sheet.tsx # Main sheet component
├── app-menu.tsx # Settings and character selection
└── [other components]

app/
└── page.tsx         # Main application entry
```

## Key Technical Achievements

### Architecture Improvements

- **Eliminated React Context**: Direct service access via singleton pattern
- **ResourceFeature Integration**: Class features automatically grant resources
- **Pure Resource Definitions**: Separated immutable templates from runtime state
- **Type Safety**: Comprehensive TypeScript coverage with runtime validation

### UI/UX Enhancements

- **Key Attribute Highlighting**: Visual emphasis on class-specific attributes
- **Compact Design**: Space-efficient mobile-first interface
- **Tooltip System**: Icon-only buttons with informative hover tooltips
- **Generic Resource System**: Flexible resource management with color schemes

## Development & Configuration

### Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint checks
npm run typecheck # Type checking
npm run test     # Run tests with Vitest
npm run test:ui  # Run tests with Vitest UI
npm run test:run # Run tests once (CI mode)
```

### Testing

The project uses **Vitest** for testing with the following conventions:

- **Test Location**: Tests are placed in `__tests__` folders within service directories
- **Test Naming**: Test files use `.test.ts` extension (e.g., `dice-formula-service.test.ts`)
- **Mocking**: Services use `vi.mock()` for mocking dependencies
- **Test Structure**: Tests use describe/it blocks with clear descriptions
- **Coverage**: Tests focus on service logic, edge cases, and error handling

#### Test Examples

- `dice-formula-service.test.ts`: Tests dice rolling formulas, variable substitution, advantage/disadvantage, criticals, and double-digit dice
- `flexible-value.test.ts`: Tests formula evaluation with attribute and level substitution

### Storage & Configuration

- **Local Storage Keys**: `nimble-navigator-characters`, `nimble-navigator-activity-log`, `nimble-navigator-settings`
- **Game Rules**: Centralized in `lib/config/game-config.ts` (dice mechanics, attribute ranges, equipment limits)
- **Validation**: Zod schemas enforce data integrity with configurable limits

## Mobile Application

### Capacitor Wrapper

The mobile application is a Capacitor wrapper located in `../nimble-mobile/` that packages the web app for native iOS and Android deployment.

#### Mobile Setup

- **App Name**: "Nimble Navigator"
- **Bundle ID**: `com.nimble.mobile`
- **Web Directory**: `../nimble/out` (Next.js static export)
- **Platforms**: iOS and Android with native project files

#### Mobile Development Commands

```bash
# In nimble-mobile directory
npm run build        # Build web app from ../nimble
npm run sync         # Sync platforms with latest build
npm run open:ios     # Open iOS project in Xcode
npm run open:android # Open Android project in Android Studio
npm run run:ios      # Run on iOS simulator/device
npm run run:android  # Run on Android emulator/device
```

#### Mobile Architecture

- **Static Export**: Next.js builds to `out/` directory for Capacitor consumption
- **Native Integration**: Capacitor provides native device API access
- **Offline-First**: Local storage works seamlessly in mobile environment
- **Responsive Design**: Existing mobile-first web design optimized for native apps

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
KEEP THINGS SHORT AND CONCISE - avoid verbose explanations, long commit messages, and unnecessary details.
NEVER commit changes automatically - ALWAYS wait for explicit user instruction to commit.
