# Changelog

## September 16, 2025

### Added

- **Spell Browser**: New comprehensive spell browser dialog for browsing and adding spells directly to character
  - Filter spells by school, tier, and category (combat/utility)
  - Search functionality for spell names and descriptions
  - Visual indicators for already-known spells (grayed out)
  - Grouped display by school and tier with collapsible sections
  - Spell preview showing damage formula, resource costs, and scaling bonuses
  - "Browse Spells" button added to abilities section
  - Manually added spells appear in both abilities and spells tabs

## September 15, 2025

### Added

- **Effects System**: One-time events that apply on ability/spell use (damage, healing, temp HP, resource/dice pool changes)
- **Effect Previews**: Visual indicators on ability cards showing what effects will apply
- **Automatic Effect Application**: Effects trigger automatically when abilities are used
- **Effect Logging**: All effects are tracked in the activity log with dice roll results
- **Dice Pool System**: Pool-based resources with visual slots, rolling mechanics, and reset conditions
- **Dice Pool Feature Traits**: Classes can grant dice pools through features (e.g., Berserker's Fury Dice)
- **Combat Tab Integration**: Dice pools now visible in combat tab for quick access
- **Comprehensive Tests**: Added test suite for DicePoolService

### Changed

- **Character Config Dialog**: Refactored into modular components for better maintainability
- **Schema Migrations**: Restructured into `/lib/schemas/migration/` directory
- **Schema Version**: Bumped to v4 with effects system and removal of freeform abilities
- **DiceService**: Now supports pure math expressions without dice notation

### Removed

- **Freeform Abilities**: Removed support for text-only abilities (all abilities now use action system)

### Improved

- **UI/UX**: Always show all dice slots (filled and empty) for better visual feedback
- **Code Reuse**: Extracted shared DicePoolCards component used in multiple tabs
- **Feature Display**: Added dice pool preview in feature traits display
- **Service Architecture**: Proper separation of concerns with ResourceService handling calculations
