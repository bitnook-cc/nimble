import { beforeEach, describe, expect, it } from "vitest";

import { Character, ChoiceTraitSelection } from "../../schemas/character";
import { ChoiceFeatureTrait, FeatureTrait } from "../../schemas/features";
import { CharacterService } from "../character-service";
import { featureSelectionService } from "../feature-selection-service";
import { getCharacterService } from "../service-factory";

describe("ChoiceTrait Selection", () => {
  let characterService: CharacterService;
  let mockCharacter: Character;

  beforeEach(() => {
    characterService = getCharacterService();

    // Create a minimal mock character
    mockCharacter = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Test Character",
      level: 5,
      classId: "commander",
      ancestryId: "human",
      backgroundId: "soldier",
      _schemaVersion: 2,
      _spellTierAccess: 0,
      _spellScalingLevel: 0,
      _proficiencies: { armor: [], weapons: [] },
      _attributes: { strength: 2, dexterity: 1, intelligence: 0, will: 1 },
      _initiative: {
        name: "Initiative",
        associatedAttribute: "dexterity" as const,
        modifier: 0,
        advantage: 0,
      },
      _skills: {},
      _abilities: [],
      _abilityUses: new Map(),
      _hitDice: { size: 10, current: 5, max: 5 },
      saveAdvantages: {},
      hitPoints: { current: 50, max: 50, temporary: 0 },
      wounds: { current: 0 },
      _resourceDefinitions: [],
      _resourceValues: new Map(),
      _dicePools: [],
      _favorites: { spells: [] },
      config: {
        maxWounds: 3,
        maxInventorySize: 12,
        skillPoints: { startingPoints: 4, pointsPerLevel: 1 },
      },
      speed: 30,
      actionTracker: { current: 3, base: 3, bonus: 0 },
      inEncounter: false,
      inventory: {
        items: [],
        maxSize: 12,
        currency: { gold: 0, silver: 0, copper: 0 },
      },
      notes: [],
      traitSelections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSyncedAt: null,
      deletedAt: null,
    } as Character;
  });

  describe("Schema Validation", () => {
    it("should validate a ChoiceTrait with simple options", () => {
      const choiceTrait: ChoiceFeatureTrait = {
        type: "choice",
        id: "commander-battlefield-choice",
        numSelections: 1,
        options: [
          {
            type: "stat_bonus",
            id: "combat-dice-bonus",
            statBonus: {
              combatDice: { type: "fixed", value: 1 },
            },
          },
          {
            type: "ability",
            id: "tactical-advantage",
            ability: {
              type: "freeform",
              id: "tactical-advantage-ability",
              name: "Tactical Advantage",
              description: "Grant advantage to an ally within 30 feet",
            },
          },
        ],
      };

      expect(choiceTrait.type).toBe("choice");
      expect(choiceTrait.numSelections).toBe(1);
      expect(choiceTrait.options).toHaveLength(2);
    });

    it("should validate a ChoiceTraitSelection", () => {
      const selection: ChoiceTraitSelection = {
        type: "choice",
        grantedByTraitId: "commander-battlefield-choice",
        choiceTraitId: "commander-battlefield-choice",
        selectedOptions: [
          {
            traitId: "combat-dice-bonus",
          },
        ],
      };

      expect(selection.type).toBe("choice");
      expect(selection.selectedOptions).toHaveLength(1);
      expect(selection.selectedOptions[0].traitId).toBe("combat-dice-bonus");
    });

    it("should validate a ChoiceTraitSelection with nested selection", () => {
      const selection: ChoiceTraitSelection = {
        type: "choice",
        grantedByTraitId: "commander-battlefield-choice",
        choiceTraitId: "commander-battlefield-choice",
        selectedOptions: [
          {
            traitId: "attribute-boost-option",
            selection: {
              type: "attribute_boost",
              grantedByTraitId: "attribute-boost-option",
              attribute: "strength",
              amount: 1,
            },
          },
        ],
      };

      expect(selection.selectedOptions[0].selection).toBeDefined();
      expect(selection.selectedOptions[0].selection?.type).toBe("attribute_boost");
    });
  });

  describe("FeatureSelectionService", () => {
    it("should calculate remaining selections correctly - no selections made", () => {
      const choiceTrait: ChoiceFeatureTrait = {
        type: "choice",
        id: "test-choice",
        numSelections: 2,
        options: [
          { type: "stat_bonus", id: "option-1", statBonus: {} },
          { type: "stat_bonus", id: "option-2", statBonus: {} },
          { type: "stat_bonus", id: "option-3", statBonus: {} },
        ],
      };

      const remaining = featureSelectionService.getRemainingChoiceSelections(
        mockCharacter,
        choiceTrait,
      );

      expect(remaining).toBe(2);
    });

    it("should calculate remaining selections correctly - partial selections made", () => {
      const choiceTrait: ChoiceFeatureTrait = {
        type: "choice",
        id: "test-choice",
        numSelections: 3,
        options: [
          { type: "stat_bonus", id: "option-1", statBonus: {} },
          { type: "stat_bonus", id: "option-2", statBonus: {} },
          { type: "stat_bonus", id: "option-3", statBonus: {} },
        ],
      };

      mockCharacter.traitSelections = [
        {
          type: "choice",
          grantedByTraitId: "test-choice",
          choiceTraitId: "test-choice",
          selectedOptions: [{ traitId: "option-1" }],
        },
      ];

      const remaining = featureSelectionService.getRemainingChoiceSelections(
        mockCharacter,
        choiceTrait,
      );

      expect(remaining).toBe(2);
    });

    it("should calculate remaining selections correctly - all selections made", () => {
      const choiceTrait: ChoiceFeatureTrait = {
        type: "choice",
        id: "test-choice",
        numSelections: 2,
        options: [
          { type: "stat_bonus", id: "option-1", statBonus: {} },
          { type: "stat_bonus", id: "option-2", statBonus: {} },
        ],
      };

      mockCharacter.traitSelections = [
        {
          type: "choice",
          grantedByTraitId: "test-choice",
          choiceTraitId: "test-choice",
          selectedOptions: [{ traitId: "option-1" }, { traitId: "option-2" }],
        },
      ];

      const remaining = featureSelectionService.getRemainingChoiceSelections(
        mockCharacter,
        choiceTrait,
      );

      expect(remaining).toBe(0);
    });

    it("should include choice traits in available selections", () => {
      const choiceTrait: ChoiceFeatureTrait = {
        type: "choice",
        id: "test-choice",
        numSelections: 1,
        options: [
          { type: "stat_bonus", id: "option-1", statBonus: {} },
          { type: "stat_bonus", id: "option-2", statBonus: {} },
        ],
      };

      const allTraits: FeatureTrait[] = [choiceTrait];

      const available = featureSelectionService.getAvailableTraitSelections(
        mockCharacter,
        allTraits,
      );

      expect(available.choiceTraits).toHaveLength(1);
      expect(available.choiceTraits[0].id).toBe("test-choice");
    });

    it("should not include choice traits with no remaining selections", () => {
      const choiceTrait: ChoiceFeatureTrait = {
        type: "choice",
        id: "test-choice",
        numSelections: 1,
        options: [
          { type: "stat_bonus", id: "option-1", statBonus: {} },
          { type: "stat_bonus", id: "option-2", statBonus: {} },
        ],
      };

      mockCharacter.traitSelections = [
        {
          type: "choice",
          grantedByTraitId: "test-choice",
          choiceTraitId: "test-choice",
          selectedOptions: [{ traitId: "option-1" }],
        },
      ];

      const allTraits: FeatureTrait[] = [choiceTrait];

      const available = featureSelectionService.getAvailableTraitSelections(
        mockCharacter,
        allTraits,
      );

      expect(available.choiceTraits).toHaveLength(0);
    });
  });

  describe("CharacterService - Choice Selection Management", () => {
    beforeEach(() => {
      // Directly set the character without loading from storage
      (characterService as unknown as { _character: Character })._character = mockCharacter;
    });

    it("should add a choice option to a new selection", async () => {
      // Mock the save and notify methods to avoid validation errors
      const serviceInternal = characterService as unknown as {
        saveCharacter: () => Promise<void>;
        notifyCharacterChanged: () => void;
      };
      const originalSave = serviceInternal.saveCharacter;
      const originalNotify = serviceInternal.notifyCharacterChanged;
      serviceInternal.saveCharacter = async () => {};
      serviceInternal.notifyCharacterChanged = () => {};

      await characterService.addChoiceOption("test-choice", "option-1");

      // Restore original methods
      serviceInternal.saveCharacter = originalSave;
      serviceInternal.notifyCharacterChanged = originalNotify;

      // Get the character from the service (since it reassigns _character)
      const updatedCharacter = (characterService as unknown as { _character: Character })
        ._character;
      const selection = updatedCharacter.traitSelections.find(
        (s): s is ChoiceTraitSelection =>
          s.type === "choice" && s.grantedByTraitId === "test-choice",
      );

      expect(selection).toBeDefined();
      expect(selection?.selectedOptions).toHaveLength(1);
      expect(selection?.selectedOptions[0].traitId).toBe("option-1");
    });

    it("should add a choice option to an existing selection", async () => {
      // Mock the save and notify methods
      const serviceInternal = characterService as unknown as {
        saveCharacter: () => Promise<void>;
        notifyCharacterChanged: () => void;
        _character: Character;
      };
      const originalSave = serviceInternal.saveCharacter;
      const originalNotify = serviceInternal.notifyCharacterChanged;
      serviceInternal.saveCharacter = async () => {};
      serviceInternal.notifyCharacterChanged = () => {};

      // Set up existing selection on the service's character
      serviceInternal._character.traitSelections = [
        {
          type: "choice",
          grantedByTraitId: "test-choice",
          choiceTraitId: "test-choice",
          selectedOptions: [{ traitId: "option-1" }],
        },
      ];

      await characterService.addChoiceOption("test-choice", "option-2");

      // Restore original methods
      serviceInternal.saveCharacter = originalSave;
      serviceInternal.notifyCharacterChanged = originalNotify;

      const updatedCharacter = serviceInternal._character;
      const selection = updatedCharacter.traitSelections.find(
        (s): s is ChoiceTraitSelection =>
          s.type === "choice" && s.grantedByTraitId === "test-choice",
      );

      expect(selection?.selectedOptions).toHaveLength(2);
      expect(selection?.selectedOptions.map((o) => o.traitId)).toContain("option-1");
      expect(selection?.selectedOptions.map((o) => o.traitId)).toContain("option-2");
    });

    it("should remove a choice option from a selection", async () => {
      // Mock the save and notify methods
      const serviceInternal = characterService as unknown as {
        saveCharacter: () => Promise<void>;
        notifyCharacterChanged: () => void;
        _character: Character;
      };
      const originalSave = serviceInternal.saveCharacter;
      const originalNotify = serviceInternal.notifyCharacterChanged;
      serviceInternal.saveCharacter = async () => {};
      serviceInternal.notifyCharacterChanged = () => {};

      serviceInternal._character.traitSelections = [
        {
          type: "choice",
          grantedByTraitId: "test-choice",
          choiceTraitId: "test-choice",
          selectedOptions: [{ traitId: "option-1" }, { traitId: "option-2" }],
        },
      ];

      await characterService.removeChoiceOption("test-choice", "option-1");

      // Restore original methods
      serviceInternal.saveCharacter = originalSave;
      serviceInternal.notifyCharacterChanged = originalNotify;

      const updatedCharacter = serviceInternal._character;
      const selection = updatedCharacter.traitSelections.find(
        (s): s is ChoiceTraitSelection =>
          s.type === "choice" && s.grantedByTraitId === "test-choice",
      );

      expect(selection?.selectedOptions).toHaveLength(1);
      expect(selection?.selectedOptions[0].traitId).toBe("option-2");
    });

    it("should remove the entire selection when last option is removed", async () => {
      // Mock the save and notify methods
      const serviceInternal = characterService as unknown as {
        saveCharacter: () => Promise<void>;
        notifyCharacterChanged: () => void;
        _character: Character;
      };
      const originalSave = serviceInternal.saveCharacter;
      const originalNotify = serviceInternal.notifyCharacterChanged;
      serviceInternal.saveCharacter = async () => {};
      serviceInternal.notifyCharacterChanged = () => {};

      serviceInternal._character.traitSelections = [
        {
          type: "choice",
          grantedByTraitId: "test-choice",
          choiceTraitId: "test-choice",
          selectedOptions: [{ traitId: "option-1" }],
        },
      ];

      await characterService.removeChoiceOption("test-choice", "option-1");

      // Restore original methods
      serviceInternal.saveCharacter = originalSave;
      serviceInternal.notifyCharacterChanged = originalNotify;

      const updatedCharacter = serviceInternal._character;
      const selection = updatedCharacter.traitSelections.find(
        (s): s is ChoiceTraitSelection =>
          s.type === "choice" && s.grantedByTraitId === "test-choice",
      );

      expect(selection).toBeUndefined();
    });

    it("should add a nested selection to a choice option", async () => {
      // Mock the save and notify methods
      const serviceInternal = characterService as unknown as {
        saveCharacter: () => Promise<void>;
        notifyCharacterChanged: () => void;
        _character: Character;
      };
      const originalSave = serviceInternal.saveCharacter;
      const originalNotify = serviceInternal.notifyCharacterChanged;
      serviceInternal.saveCharacter = async () => {};
      serviceInternal.notifyCharacterChanged = () => {};

      serviceInternal._character.traitSelections = [
        {
          type: "choice",
          grantedByTraitId: "test-choice",
          choiceTraitId: "test-choice",
          selectedOptions: [{ traitId: "attribute-boost-option" }],
        },
      ];

      const nestedSelection = {
        type: "attribute_boost" as const,
        grantedByTraitId: "attribute-boost-option",
        attribute: "strength" as const,
        amount: 1,
      };

      await characterService.addChoiceOptionNestedSelection(
        "test-choice",
        "attribute-boost-option",
        nestedSelection,
      );

      // Restore original methods
      serviceInternal.saveCharacter = originalSave;
      serviceInternal.notifyCharacterChanged = originalNotify;

      const updatedCharacter = serviceInternal._character;
      const selection = updatedCharacter.traitSelections.find(
        (s): s is ChoiceTraitSelection =>
          s.type === "choice" && s.grantedByTraitId === "test-choice",
      );

      expect(selection?.selectedOptions[0].selection).toBeDefined();
      expect(selection?.selectedOptions[0].selection?.type).toBe("attribute_boost");
    });
  });

  describe("Complex ChoiceTrait Scenarios", () => {
    it("should handle a choice with multiple selection types", () => {
      const complexChoice: ChoiceFeatureTrait = {
        type: "choice",
        id: "versatile-training",
        numSelections: 2,
        options: [
          {
            type: "attribute_boost",
            id: "attr-boost",
            allowedAttributes: ["strength", "dexterity"],
            amount: 1,
          },
          {
            type: "proficiency",
            id: "skill-prof",
            proficiencies: [
              { type: "skill", name: "Athletics" },
              { type: "skill", name: "Acrobatics" },
            ],
          },
          {
            type: "ability",
            id: "special-ability",
            ability: {
              type: "freeform",
              id: "quick-learner",
              name: "Quick Learner",
              description: "Learn new skills faster",
            },
          },
        ],
      };

      expect(complexChoice.options).toHaveLength(3);
      expect(complexChoice.numSelections).toBe(2);
      expect(complexChoice.options[0].type).toBe("attribute_boost");
      expect(complexChoice.options[1].type).toBe("proficiency");
      expect(complexChoice.options[2].type).toBe("ability");
    });

    it("should handle selecting different option types", () => {
      const selection: ChoiceTraitSelection = {
        type: "choice",
        grantedByTraitId: "versatile-training",
        choiceTraitId: "versatile-training",
        selectedOptions: [
          {
            traitId: "attr-boost",
            selection: {
              type: "attribute_boost",
              grantedByTraitId: "attr-boost",
              attribute: "strength",
              amount: 1,
            },
          },
          {
            traitId: "skill-prof",
          },
        ],
      };

      expect(selection.selectedOptions).toHaveLength(2);
      expect(selection.selectedOptions[0].selection).toBeDefined();
      expect(selection.selectedOptions[1].selection).toBeUndefined();
    });
  });
});
