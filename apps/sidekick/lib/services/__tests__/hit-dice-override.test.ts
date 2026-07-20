import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CharacterService } from "../character-service";
import { ContentRepositoryService } from "../content-repository-service";
import { ServiceFactory, getCharacterService } from "../service-factory";
import { createTestCharacter, loadCharacterForTesting } from "./test-utils";

describe("Hit Dice Override", () => {
  let characterService: CharacterService;

  beforeEach(() => {
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("inMemory");
    characterService = getCharacterService();
  });

  afterEach(() => {
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("localStorage");
  });

  it("Oozeling Keeper of the Wild Heart should have d12 hit dice", async () => {
    // Hunter base hit die is d8
    // Oozeling "Odd Constitution" increments one step: d8 → d10
    // Keeper of the Wild Heart "Impressive Form" overrides to d10
    // Step applies after override: d10 → d12
    const character = await createTestCharacter({
      classId: "hunter",
      ancestryId: "oozeling",
      backgroundId: "fearless",
    });

    character.level = 3;
    character.traitSelections = [
      {
        type: "subclass",
        grantedByTraitId: "subclass-0",
        subclassId: "hunter-wildheart",
      },
    ];

    await characterService.updateCharacter(character);
    await loadCharacterForTesting(character);

    const hitDice = characterService.getHitDice();
    expect(hitDice.size).toBe(12);
  });

  it("Oozeling Hunter without subclass should have d10 hit dice", async () => {
    // Hunter base d8, Oozeling steps up one: d8 → d10
    const character = await createTestCharacter({
      classId: "hunter",
      ancestryId: "oozeling",
      backgroundId: "fearless",
    });

    await loadCharacterForTesting(character);

    const hitDice = characterService.getHitDice();
    expect(hitDice.size).toBe(10);
  });

  it("Keeper of the Wild Heart without Oozeling should have d10 hit dice", async () => {
    // Hunter base d8, Wild Heart overrides to d10
    const character = await createTestCharacter({
      classId: "hunter",
      ancestryId: "human",
      backgroundId: "fearless",
    });

    character.level = 3;
    character.traitSelections = [
      {
        type: "subclass",
        grantedByTraitId: "subclass-0",
        subclassId: "hunter-wildheart",
      },
    ];

    await characterService.updateCharacter(character);
    await loadCharacterForTesting(character);

    const hitDice = characterService.getHitDice();
    expect(hitDice.size).toBe(10);
  });

  it("Keeper of the Wild Heart should grant +5 max HP", async () => {
    const character = await createTestCharacter({
      classId: "hunter",
      ancestryId: "human",
      backgroundId: "fearless",
    });

    // hitPoints.max is set at creation and only changes via the Level Up wizard.
    // Setting level here just unlocks the subclass features; it doesn't change hitPoints.max.
    character.level = 3;
    character.traitSelections = [
      {
        type: "subclass",
        grantedByTraitId: "subclass-0",
        subclassId: "hunter-wildheart",
      },
    ];

    await characterService.updateCharacter(character);
    await loadCharacterForTesting(character);

    // getMaxHp() should be base hitPoints.max (still the level-1 starting value) + 5 from Impressive Form
    expect(characterService.getMaxHp()).toBe(character.hitPoints.max + 5);
  });

  it("Survivalist Dwarf Shadowmancer with Fiendish Boon should have correct hit dice quantity", async () => {
    // Dwarf: +2 max hit dice
    // Survivalist: +1 max hit die
    // Shadowmancer Fiendish Boon (Greater Invocation, available at level 4): -1 max hit dice
    const character = await createTestCharacter({
      classId: "shadowmancer",
      ancestryId: "dwarf",
      backgroundId: "survivalist",
    });

    // Level 4 to unlock "A Gift from the Master" (Greater Invocation pick)
    character.level = 4;

    // Look up Fiendish Boon from the content repository instead of hardcoding
    const pool = ContentRepositoryService.getInstance().getFeaturePool("greater-invocations");
    const fiendishBoon = pool!.features.find((f) => f.id === "fiendish-boon")!;

    character.traitSelections = [
      ...character.traitSelections,
      {
        type: "pool_feature" as const,
        grantedByTraitId: "gift-from-the-master-1-0",
        poolId: "greater-invocations",
        feature: fiendishBoon,
      },
    ];

    await characterService.updateCharacter(character);
    await loadCharacterForTesting(character);

    const hitDice = characterService.getHitDice();
    // Created at level 1, so base _hitDice.max = 1
    // Dwarf +2, Survivalist +1, Fiendish Boon -1 = net +2
    // Total: 1 + 2 = 3
    expect(hitDice.max).toBe(3);

    // Verify without Fiendish Boon it would be 4
    // by checking that the -1 actually matters
    character.traitSelections = character.traitSelections.filter(
      (s) => !(s.type === "pool_feature" && s.poolId === "greater-invocations"),
    );
    await characterService.updateCharacter(character);
    await loadCharacterForTesting(character);

    expect(characterService.getHitDice().max).toBe(4); // 1 + 2 + 1 = 4
  });

  it("effective max HP can be overridden to 1 even with HP bonuses", async () => {
    const character = await createTestCharacter({
      classId: "hunter",
      ancestryId: "human",
      backgroundId: "fearless",
    });

    character.level = 3;
    character.traitSelections = [
      {
        type: "subclass",
        grantedByTraitId: "subclass-0",
        subclassId: "hunter-wildheart",
      },
    ];

    // Simulate a witch curse: set base HP so that effective = 1
    // Impressive Form grants +5, so base must be -4 for effective = max(1, -4+5) = 1
    character.hitPoints = { ...character.hitPoints, max: -4, current: 1 };

    await characterService.updateCharacter(character);
    await loadCharacterForTesting(character);

    expect(characterService.getMaxHp()).toBe(1);
  });

  it("manual sizeOverride takes priority over feature bonuses", async () => {
    // Oozeling Wild Heart Hunter would normally compute d12 (d8 base, override d10, +1 step)
    const character = await createTestCharacter({
      classId: "hunter",
      ancestryId: "oozeling",
      backgroundId: "fearless",
    });

    character.level = 3;
    character.traitSelections = [
      {
        type: "subclass",
        grantedByTraitId: "subclass-0",
        subclassId: "hunter-wildheart",
      },
    ];

    // User manually overrides to d4
    character._hitDice = { ...character._hitDice, sizeOverride: 4 };

    await characterService.updateCharacter(character);
    await loadCharacterForTesting(character);

    expect(characterService.getHitDice().size).toBe(4);

    // Clearing the override restores the feature-computed value (d12)
    // This is a regression guard — there's no UI to clear the override today
    character._hitDice = { ...character._hitDice, sizeOverride: undefined };
    await characterService.updateCharacter(character);
    await loadCharacterForTesting(character);

    expect(characterService.getHitDice().size).toBe(12);
  });

  it("applyHealing should cap at computed max HP including bonuses", async () => {
    const character = await createTestCharacter({
      classId: "hunter",
      ancestryId: "human",
      backgroundId: "fearless",
    });

    character.level = 3;
    character.traitSelections = [
      {
        type: "subclass",
        grantedByTraitId: "subclass-0",
        subclassId: "hunter-wildheart",
      },
    ];

    // Set current HP to 1 so healing has room
    character.hitPoints = { ...character.hitPoints, current: 1 };

    await characterService.updateCharacter(character);
    await loadCharacterForTesting(character);

    const maxHp = characterService.getMaxHp();
    expect(maxHp).toBe(character.hitPoints.max + 5);

    // Heal for a huge amount — should cap at computed max
    await characterService.applyHealing(9999);
    const healed = characterService.getCurrentCharacter()!;
    expect(healed.hitPoints.current).toBe(maxHp);
  });

  it("performSafeRest should restore HP to computed max including bonuses", async () => {
    const character = await createTestCharacter({
      classId: "hunter",
      ancestryId: "human",
      backgroundId: "fearless",
    });

    character.level = 3;
    character.traitSelections = [
      {
        type: "subclass",
        grantedByTraitId: "subclass-0",
        subclassId: "hunter-wildheart",
      },
    ];

    character.hitPoints = { ...character.hitPoints, current: 1 };

    await characterService.updateCharacter(character);
    await loadCharacterForTesting(character);

    const maxHp = characterService.getMaxHp();

    await characterService.performSafeRest();
    const rested = characterService.getCurrentCharacter()!;
    expect(rested.hitPoints.current).toBe(maxHp);
  });

  it("performCatchBreath should use computed hit die size for healing", async () => {
    const character = await createTestCharacter({
      classId: "hunter",
      ancestryId: "oozeling",
      backgroundId: "fearless",
      attributes: { strength: 0 },
    });

    // Oozeling Hunter has d10 hit dice (d8 + 1 step)
    // Set HP low so healing doesn't cap
    character.hitPoints = { ...character.hitPoints, current: 1 };
    character._hitDice = { ...character._hitDice, current: 1 };

    await characterService.updateCharacter(character);
    await loadCharacterForTesting(character);

    expect(characterService.getHitDice().size).toBe(10);

    await characterService.performCatchBreath();
    const afterRest = characterService.getCurrentCharacter()!;

    // With d10 + 0 STR, minimum heal is 1, max is 10
    // Just verify healing happened and used the right die (healed > 0, healed <= 10)
    const healed = afterRest.hitPoints.current - 1;
    expect(healed).toBeGreaterThanOrEqual(1);
    expect(healed).toBeLessThanOrEqual(10);
  });

  it("performMakeCamp should use computed hit die size for healing", async () => {
    const character = await createTestCharacter({
      classId: "hunter",
      ancestryId: "oozeling",
      backgroundId: "fearless",
      attributes: { strength: 0 },
    });

    // Oozeling Hunter has d10 hit dice
    // Make Camp heals hitDieSize + STR = 10 + 0 = 10
    character.hitPoints = { ...character.hitPoints, current: 1 };
    character._hitDice = { ...character._hitDice, current: 1 };

    await characterService.updateCharacter(character);
    await loadCharacterForTesting(character);

    await characterService.performMakeCamp();
    const afterCamp = characterService.getCurrentCharacter()!;

    // Make Camp heals max die + STR = 10 + 0 = 10, so current should be 11
    expect(afterCamp.hitPoints.current).toBe(11);
  });
});
