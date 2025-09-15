# Changelog

## September 15, 2025

### Added

- **Dice Pool System**: Pool-based resources with visual slots, rolling mechanics, and reset conditions
- **Dice Pool Feature Traits**: Classes can grant dice pools through features (e.g., Berserker's Fury Dice)
- **Combat Tab Integration**: Dice pools now visible in combat tab for quick access
- **Comprehensive Tests**: Added test suite for DicePoolService

### Changed

- **Character Config Dialog**: Refactored into modular components for better maintainability
- **Schema Migrations**: Restructured into `/lib/schemas/migration/` directory
- **Schema Version**: Bumped to v3 with `dicePool` introduction

### Improved

- **UI/UX**: Always show all dice slots (filled and empty) for better visual feedback
- **Code Reuse**: Extracted shared DicePoolCards component used in multiple tabs
- **Feature Display**: Added dice pool preview in feature traits display
