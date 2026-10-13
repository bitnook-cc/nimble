# @nimble/dice

A comprehensive dice rolling engine for the Nimble RPG system with support for advanced dice notation.

## Features

- Standard dice notation (e.g., `2d6`, `1d20+5`)
- Mathematical expressions with parentheses
- Exploding dice on critical rolls
- Vicious dice (extra non-exploding dice on criticals)
- Advantage/disadvantage system
- Double-digit dice (d44, d66, d88, d100)
- Full TypeScript support with Zod validation

## Installation

```bash
npm install @nimble/dice
```

## Usage

```typescript
import { evaluateDiceFormula } from "@nimble/dice";

// Basic roll
const result = evaluateDiceFormula("2d6+5");
console.log(result.total); // e.g., 12
console.log(result.displayString); // e.g., "[4] + [3] + 5"

// With options
const advResult = evaluateDiceFormula("1d20", {
  advantageLevel: 1,
  allowCriticals: true,
});
```

## Dice Notation

### Basic Notation

- `XdY` - Roll X dice with Y sides (e.g., `3d6`)
- `dY` - Roll 1 die with Y sides (e.g., `d20`)
- `+/-` - Add or subtract modifiers (e.g., `2d6+5`)
- `*` `/` - Multiplication and division (e.g., `(2d6)*2`)
- `()` - Parentheses for order of operations

### Postfix Modifiers

Postfix modifiers are added directly after the dice notation:

#### Exploding Dice (`!` and `!!`)

- `!` - First die explodes on max value (e.g., `1d20!`)
- `!!` - ALL dice explode on max value (e.g., `3d6!!`)

When a die "explodes", it adds another roll when it rolls its maximum value. This continues until a non-maximum is rolled.

#### Vicious (`v`)

- `v` - Adds one extra die per critical hit (e.g., `1d8v`)
- Can combine with exploding: `1d20!v` or `2d6!!v`

Vicious dice are added after all explosions are resolved and do not explode themselves.

#### Advantage/Disadvantage (`a` and `d`)

- `a` or `a1` - Single advantage (roll 2, keep highest)
- `a2` - Double advantage (roll 3, keep highest)
- `a3` - Triple advantage (roll 4, keep highest)
- `d` or `d1` - Single disadvantage (roll 2, keep lowest)
- `d2` - Double disadvantage (roll 3, keep lowest)

**⚠️ IMPORTANT: Order of postfixes matters!**
Advantage/disadvantage postfixes (`a` and `d`) must come AFTER any exploding (`!`, `!!`) or vicious (`v`) postfixes.

✅ Correct order:

- `1d20!a` - Exploding THEN advantage
- `2d6!!va2` - All explode THEN vicious THEN double advantage
- `1d8vd` - Vicious THEN disadvantage

❌ Incorrect order:

- `1d20a!` - Won't work as expected
- `2d6a!!v` - Won't work as expected

Examples:

- `1d20a` - Roll with advantage
- `1d20d2` - Roll with double disadvantage
- `2d6!a` - Roll 2d6 with exploding and advantage

### Double-Digit Dice

Special dice that roll two separate dice for tens and ones:

- `d44` - Rolls 2d4 (tens and ones)
- `d66` - Rolls 2d6 (tens and ones)
- `d88` - Rolls 2d8 (tens and ones)
- `d100` - Rolls 2d10 as percentile digits 0–9, with `00` counting as 100

Results range from 11-44, 11-66, or 11-88 respectively.

Advantage/disadvantage applies to a single shared digit pool. With single
advantage, roll three dice and discard the lowest; with single disadvantage,
discard the highest. The first retained die is tens and the second is ones,
preserving the original roll order. For example, `d44a` rolling `[2, 4, 1]`
discards `1` and produces **24**, without rearranging the retained digits.
Each extra advantage/disadvantage level adds one die and one discard, leaving
exactly two digits. Ties discard the earliest low digit for advantage and the
latest high digit for disadvantage.

For d100, an underlying d10 roll of 10 becomes digit 0 before comparing or
combining digits. Normal rolls remain uniform over 1–100. Multiple percentiles
(e.g. `2d100a`) use one shared pool per percentile and sum the resulting numbers;
d44/d66/d88 remain limited to one per dice token. Double-digit dice do not
explode, fumble or trigger vicious dice. Roll and histogram limits count the
underlying dice: `d66a` costs three rolls and `d100a2` costs four.

## Options

```typescript
interface DiceFormulaOptions {
  advantageLevel?: number; // Positive for advantage, negative for disadvantage
  allowCriticals?: boolean; // Enable exploding dice on max rolls
  allowFumbles?: boolean; // Enable fumble detection on natural 1s
  vicious?: boolean; // Add extra dice on criticals
  explodeAll?: boolean; // All dice can explode, not just first
}
```

## Examples

```typescript
// Basic roll with modifier
evaluateDiceFormula("2d6+5");

// Exploding d20
evaluateDiceFormula("1d20!");

// All dice explode
evaluateDiceFormula("4d4!!");

// Vicious weapon
evaluateDiceFormula("1d8v", { allowCriticals: true });

// Advantage using postfix
evaluateDiceFormula("1d20a");

// Disadvantage using option
evaluateDiceFormula("1d20", { advantageLevel: -1 });

// Complex expression
evaluateDiceFormula("(2d6+3)*2 + 1d4!");

// Double-digit dice with advantage
evaluateDiceFormula("d66a");
```

## Return Value

```typescript
interface DiceFormulaResult {
  formula: string; // Original formula
  displayString: string; // Human-readable result with dice shown
  total: number; // Final calculated total
  diceData?: {
    dice: CategorizedDie[]; // Individual die results
    total: number; // Combined digit number, or sum of standard dice
    isDoubleDigit: boolean; // Whether double-digit dice were used
    isFumble: boolean; // Whether a fumble occurred
    advantageLevel: number; // Advantage/disadvantage level used
    criticalHits: number; // Number of critical hits rolled
  };
}
```

## Supported Dice Types

Standard: d4, d6, d8, d10, d12, d20, d100
Double-digit: d44, d66, d88, d100 (percentile)

## License

MIT
