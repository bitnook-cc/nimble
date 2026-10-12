import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ActionAbilityDefinition } from "../../schemas/abilities";
import { AbilityService } from "../ability-service";
import { ServiceFactory, getCharacterService } from "../service-factory";
import { createTestSpellcaster, loadCharacterForTesting } from "./test-utils";

const ability = (frequency: ActionAbilityDefinition["frequency"]): ActionAbilityDefinition => ({
  id: `test-${frequency}`,
  name: `Test ${frequency}`,
  description: "An ability with one use per reset period",
  type: "action",
  frequency,
  maxUses: { type: "fixed", value: 1 },
  actionCost: 1,
});
const turnAbility = {
  ...ability("per_turn"),
  resourceCost: { type: "fixed" as const, resourceId: "mana", amount: 1 },
};
const encounterAbility = ability("per_encounter");
const restAbility = ability("per_safe_rest");
const manualAbility = ability("manual");
const abilities = [turnAbility, encounterAbility, restAbility, manualAbility];

describe("Ability uses across combat boundaries", () => {
  beforeEach(async () => {
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("inMemory");
    const character = await createTestSpellcaster({ manaAmount: 10, maxMana: 10 });
    await loadCharacterForTesting(character);
    await getCharacterService().updateCharacterFields({
      _abilities: abilities,
      _abilityUses: new Map(),
      inEncounter: false,
      actionTracker: { current: 0, base: 3, bonus: 0 },
    });
  });

  afterEach(() => {
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("localStorage");
  });

  it.each([0, 1])(
    "allows repeated per-turn uses outside combat with %i saved uses",
    async (savedUses) => {
      const service = getCharacterService();
      await service.updateCharacterFields({
        _abilityUses: new Map([[turnAbility.id, savedUses]]),
      });
      await service.performUseAbility(turnAbility.id);
      await service.performUseAbility(turnAbility.id);
      const character = service.getCurrentCharacter()!;
      expect(character._abilityUses.get(turnAbility.id)).toBe(savedUses);
      expect(new AbilityService().getCurrentUses(turnAbility, character)).toBe(0);
      expect(character.actionTracker.current).toBe(0);
      expect(service.getResourceValue("mana")).toBe(8);
      await service.loadCharacter(character.id);
      expect(service.getCurrentCharacter()!._abilityUses.get(turnAbility.id)).toBe(savedUses);
    },
  );

  it("enforces per-turn uses and action costs during combat, then refreshes the next turn", async () => {
    const service = getCharacterService();
    await service.startEncounter(21);
    await service.performUseAbility(turnAbility.id);
    await service.performUseAbility(turnAbility.id);
    expect(service.getCurrentCharacter()!._abilityUses.get(turnAbility.id)).toBe(1);
    expect(service.getCurrentCharacter()!.actionTracker.current).toBe(2);
    expect(service.getResourceValue("mana")).toBe(9);
    await service.endTurn();
    await service.performUseAbility(turnAbility.id);
    expect(service.getCurrentCharacter()!._abilityUses.get(turnAbility.id)).toBe(1);
    expect(service.getCurrentCharacter()!.actionTracker.current).toBe(2);
    expect(service.getResourceValue("mana")).toBe(8);
  });

  it.each([encounterAbility, restAbility, manualAbility])(
    "still tracks $frequency uses outside combat",
    async (limitedAbility) => {
      const service = getCharacterService();
      await service.performUseAbility(limitedAbility.id);
      await service.performUseAbility(limitedAbility.id);
      expect(service.getCurrentCharacter()!._abilityUses.get(limitedAbility.id)).toBe(1);
    },
  );

  it.each([
    [1, 1],
    [10, 2],
    [20, 2],
    [21, 3],
  ])(
    "initiative %i resets turn and combat uses while granting %i actions",
    async (roll, actions) => {
      const service = getCharacterService();
      await service.updateCharacterFields({
        _abilityUses: new Map([
          ...abilities.map((a) => [a.id, 1] as [string, number]),
          ["other", 4],
        ]),
      });
      await service.startEncounter(roll);
      const character = service.getCurrentCharacter()!;
      expect(character.inEncounter).toBe(true);
      expect(character.actionTracker.current).toBe(actions);
      expect(character._abilityUses).toEqual(
        new Map([
          [turnAbility.id, 0],
          [encounterAbility.id, 0],
          [restAbility.id, 1],
          [manualAbility.id, 1],
          ["other", 4],
        ]),
      );
      await service.loadCharacter(character.id);
      expect(service.getCurrentCharacter()!._abilityUses).toEqual(character._abilityUses);
    },
  );

  it("refreshes both frequencies when initiative is rolled again", async () => {
    const service = getCharacterService();
    await service.startEncounter(21);
    await service.performUseAbility(turnAbility.id);
    await service.performUseAbility(encounterAbility.id);
    await service.startEncounter(10);
    expect(service.getCurrentCharacter()!._abilityUses.get(turnAbility.id)).toBe(0);
    expect(service.getCurrentCharacter()!._abilityUses.get(encounterAbility.id)).toBe(0);
  });

  it.each(["endEncounter", "performSafeRest"] as const)(
    "%s combines resets without restoring already spent turn uses",
    async (reset) => {
      const service = getCharacterService();
      await service.updateCharacterFields({
        inEncounter: true,
        _abilityUses: new Map(abilities.map((a) => [a.id, 1])),
      });
      await service[reset]();
      const uses = service.getCurrentCharacter()!._abilityUses;
      expect(uses.get(turnAbility.id)).toBe(0);
      expect(uses.get(encounterAbility.id)).toBe(0);
      expect(uses.get(restAbility.id)).toBe(reset === "performSafeRest" ? 0 : 1);
      expect(uses.get(manualAbility.id)).toBe(1);
    },
  );
});
