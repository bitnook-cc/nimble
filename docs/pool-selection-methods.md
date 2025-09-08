# Pool Selection Methods Documentation

## Overview

The class service has four related methods for handling feature pool selections. Each serves a different purpose in the feature selection system.

## Method Comparison

### 1. `getAvailablePoolFeatures(character, poolId)`

- **Returns**: `ClassFeature[]` - The actual feature objects from a specific pool
- **Purpose**: Gets the features within a pool that haven't been selected yet
- **Use Case**: When displaying the list of features a player can choose from in a selection dialog
- **Example**: If a pool contains ["Extra Attack", "Defensive Stance", "Power Strike"] and the player already selected "Extra Attack", this returns ["Defensive Stance", "Power Strike"]

### 2. `getAvailablePoolSelections(character)`

- **Returns**: `PickFeatureFromPoolFeature[]` - The "chooser" features that grant selections
- **Purpose**: Gets all the pool selection features that still have remaining choices
- **Use Case**: When showing which pools the player still needs to make selections from
- **Example**: If a character has a "Fighting Style" feature that allows 1 choice (already made) and a "Combat Maneuver" feature that allows 2 choices (1 made), this returns only the "Combat Maneuver" feature

### 3. `getRemainingPoolSelections(character, pickFeature)`

- **Returns**: `number` - Count of remaining selections for a specific pool feature
- **Purpose**: Calculates how many more selections can be made from a specific pool
- **Use Case**: When showing "2 selections remaining" in the UI for a specific pool
- **Example**: If a feature allows 3 choices and the player has made 1, this returns 2

### 4. `hasPendingPoolSelections(character)`

- **Returns**: `boolean` - Whether any pool selections remain
- **Purpose**: Quick check if the player needs to make any pool selections
- **Use Case**: When determining whether to show a notification badge or highlight in the UI
- **Example**: Returns true if any pool has remaining selections, false if all are complete

## Relationship Diagram

```
PickFeatureFromPoolFeature (The "chooser")
    ├── grants ability to pick from a FeaturePool
    ├── specifies choicesAllowed (e.g., 2)
    └── tracked by grantedByFeatureId

FeaturePool (The container)
    ├── contains multiple ClassFeature objects
    └── identified by poolId

ClassFeature (The actual features)
    ├── the items you can select from a pool
    └── tracked in selectedFeatures when chosen

Flow:
1. Character gains PickFeatureFromPoolFeature → getAvailablePoolSelections() returns it
2. Player opens selection dialog → getAvailablePoolFeatures() shows options
3. UI shows remaining count → getRemainingPoolSelections() calculates it
4. Player makes all selections → getAvailablePoolSelections() no longer returns it
5. Check if done → hasPendingPoolSelections() returns false
```

## Key Concepts

- **PickFeatureFromPoolFeature**: A feature that grants the ability to select from a pool
- **FeaturePool**: A collection of features that can be selected from
- **ClassFeature**: The actual features within a pool
- **PoolFeatureEffectSelection**: Record of a feature that was selected from a pool
