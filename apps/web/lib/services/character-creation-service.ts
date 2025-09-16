import { v4 as uuidv4 } from "uuid";

import { gameConfig } from "../config/game-config";
import { genericNames } from "../config/name-config";
import { Attributes, Character, TraitSelection } from "../schemas/character";
import { Item } from "../schemas/inventory";
import { CURRENT_SCHEMA_VERSION } from "../schemas/migration/constants";
import {
  createDefaultActionTracker,
  createDefaultCharacterConfiguration,
  createDefaultHitDice,
  createDefaultHitPoints,
  createDefaultInitiative,
  createDefaultInventory,
  createDefaultProficiencies,
  createDefaultSkills,
  createDefaultWounds,
} from "../utils/character-defaults";
import { NameGenerator } from "../utils/name-generator";
import { ContentRepositoryService } from "./content-repository-service";
import {
  IAncestryService,
  IBackgroundService,
  ICharacterCreation,
  ICharacterService,
  ICharacterStorage,
} from "./interfaces";
import { ItemService } from "./item-service";

export interface QuickCreateOptions {
  name?: string; // Optional - will be generated if not provided
  ancestryId?: string; // Optional - will be random if not provided
  backgroundId?: string; // Optional - will be random if not provided
  classId: string;
  level?: number;
  attributes?: Attributes;
}

export interface CreateCompleteCharacterOptions {
  name: string;
  ancestryId: string;
  backgroundId: string;
  classId: string;
  attributes: Attributes;
  skillAllocations: Record<string, number>;
  traitSelections: TraitSelection[];
  selectedEquipment: string[];
}

/**
 * Character Creation Service with Dependency Injection
 * Handles character creation and initialization without tight coupling
 */
export class CharacterCreationService implements ICharacterCreation {
  private contentRepository: ContentRepositoryService;
  private itemService: ItemService;

  constructor(
    private characterStorage: ICharacterStorage,
    private characterService: ICharacterService,
    private ancestryService: IAncestryService,
    private backgroundService: IBackgroundService,
  ) {
    this.contentRepository = ContentRepositoryService.getInstance();
    this.itemService = ItemService.getInstance();
  }

  /**
   * Quick character creation with random ancestry, background, and generated name
   * Uses createCompleteCharacter internally for consistency
   */
  async quickCreateCharacter(options: QuickCreateOptions): Promise<Character> {
    const { classId, level = 1 } = options;

    // Validate class exists
    const classDefinition = this.contentRepository.getClassDefinition(classId);
    if (!classDefinition) {
      throw new Error(`Class not found: ${classId}`);
    }

    // Get or select ancestry
    let ancestryId = options.ancestryId;
    if (!ancestryId) {
      const availableAncestries = this.ancestryService.getAvailableAncestries();
      if (availableAncestries.length === 0) {
        throw new Error("No ancestries available");
      }
      ancestryId = availableAncestries[Math.floor(Math.random() * availableAncestries.length)].id;
    }

    // Get or select background
    let backgroundId = options.backgroundId;
    if (!backgroundId) {
      const availableBackgrounds = this.backgroundService.getAvailableBackgrounds();
      if (availableBackgrounds.length === 0) {
        throw new Error("No backgrounds available");
      }
      backgroundId =
        availableBackgrounds[Math.floor(Math.random() * availableBackgrounds.length)].id;
    }

    // Validate selected ancestry and background exist
    const ancestryDefinition = this.contentRepository.getAncestryDefinition(ancestryId);
    if (!ancestryDefinition) {
      throw new Error(`Ancestry not found: ${ancestryId}`);
    }

    const backgroundDefinition = this.contentRepository.getBackgroundDefinition(backgroundId);
    if (!backgroundDefinition) {
      throw new Error(`Background not found: ${backgroundId}`);
    }

    // Generate name if not provided
    let name = options.name;
    if (!name) {
      if (ancestryDefinition.nameConfig) {
        name = NameGenerator.generateFullName(ancestryDefinition.nameConfig);
      } else {
        // Fallback to generic names
        name = NameGenerator.generateFullName(genericNames);
      }
    }

    // Set attributes based on class or use provided ones
    let attributes = options.attributes;
    if (!attributes) {
      // Use the standard array: 2, 2, 0, -1
      // Assign both key attributes a 2, randomly assign -1 and 0 to the others
      const [primary, secondary] = classDefinition.keyAttributes;

      // Start with all zeros
      attributes = {
        strength: 0,
        dexterity: 0,
        intelligence: 0,
        will: 0,
      };

      // Assign 2 to both key attributes
      attributes[primary] = 2;
      attributes[secondary] = 2;

      // Get the non-key attributes
      const allAttributes: (keyof typeof attributes)[] = [
        "strength",
        "dexterity",
        "intelligence",
        "will",
      ];
      const nonKeyAttributes = allAttributes.filter(
        (attr) => attr !== primary && attr !== secondary,
      );

      // Randomly assign -1 and 0 to the non-key attributes
      const shuffled = [...nonKeyAttributes].sort(() => Math.random() - 0.5);
      attributes[shuffled[0]] = -1;
      attributes[shuffled[1]] = 0;
    }

    // Use createCompleteCharacter with generated/selected values
    return this.createCompleteCharacter({
      name,
      ancestryId,
      backgroundId,
      classId,
      attributes,
      skillAllocations: {}, // Use defaults
      traitSelections: [], // No custom feature selections for quick create
      selectedEquipment: classDefinition.startingEquipment || [], // Use class default equipment
    });
  }

  /**
   * Creates a complete character with all selections made during character creation
   */
  async createCompleteCharacter(options: CreateCompleteCharacterOptions): Promise<Character> {
    const {
      name,
      ancestryId,
      backgroundId,
      classId,
      attributes,
      skillAllocations,
      traitSelections,
      selectedEquipment,
    } = options;

    // Validate class, ancestry, and background exist
    const classDefinition = this.contentRepository.getClassDefinition(classId);
    if (!classDefinition) {
      throw new Error(`Class not found: ${classId}`);
    }

    const ancestryDefinition = this.contentRepository.getAncestryDefinition(ancestryId);
    if (!ancestryDefinition) {
      throw new Error(`Ancestry not found: ${ancestryId}`);
    }

    const backgroundDefinition = this.contentRepository.getBackgroundDefinition(backgroundId);
    if (!backgroundDefinition) {
      throw new Error(`Background not found: ${backgroundId}`);
    }

    // Create base character configuration
    const config = createDefaultCharacterConfiguration();
    const hitPoints = createDefaultHitPoints(classDefinition.startingHP);
    const hitDice = createDefaultHitDice(1, classDefinition.hitDieSize);
    const proficiencies = createDefaultProficiencies(classDefinition);

    // Create skills with allocations
    const skills = createDefaultSkills();
    Object.entries(skillAllocations).forEach(([skillName, points]) => {
      const skill = skills[skillName];
      if (skill) {
        skills[skillName] = {
          ...skill,
          modifier: points,
        };
      }
    });

    // Create inventory with selected equipment
    const inventory = createDefaultInventory(attributes.strength);
    if (selectedEquipment.length > 0) {
      const items: Item[] = selectedEquipment
        .map((itemId) => {
          return this.itemService.createInventoryItem(itemId);
        })
        .filter((item) => item !== null) as Item[];

      inventory.items = items;
    }

    // Create the character with all data
    const character = await this.characterStorage.createCharacter({
      id: uuidv4(),
      name,
      ancestryId,
      backgroundId,
      level: 1,
      classId,
      _schemaVersion: CURRENT_SCHEMA_VERSION,
      _spellTierAccess: 0,
      _spellScalingLevel: 0,
      _proficiencies: proficiencies,
      _attributes: attributes,
      _initiative: createDefaultInitiative(),
      _skills: skills,
      _abilities: [],
      _abilityUses: new Map(),
      _hitDice: hitDice,
      saveAdvantages: { ...classDefinition.saveAdvantages },
      hitPoints,
      wounds: createDefaultWounds(config.maxWounds),
      _resourceDefinitions: [],
      _resourceValues: new Map(),
      _dicePools: [],
      config,
      speed: gameConfig.character.defaultSpeed,
      actionTracker: createDefaultActionTracker(),
      inEncounter: false,
      inventory,
      traitSelections,
      timestamps: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });

    // Load the character into the service to apply features
    await this.characterService.loadCharacter(character.id);

    // Return the updated character
    return this.characterService.getCurrentCharacter() || character;
  }

  /**
   * Applies starting equipment to a character based on their class
   */
  async applyStartingEquipment(characterId: string, equipmentIds: string[]): Promise<void> {
    const character = await this.characterStorage.getCharacter(characterId);
    if (!character) {
      throw new Error(`Character not found: ${characterId}`);
    }

    // Convert repository item IDs to inventory items
    const equipmentItems = equipmentIds
      .map((repositoryId) => {
        const inventoryItem = this.itemService.createInventoryItem(repositoryId);
        if (!inventoryItem) {
          console.warn(`Failed to create inventory item for repository ID: ${repositoryId}`);
          return null;
        }
        return inventoryItem;
      })
      .filter((item) => item !== null);

    // Add items to character's inventory
    const updatedInventory = {
      ...character.inventory,
      items: [...character.inventory.items, ...equipmentItems],
    };

    const updatedCharacter = {
      ...character,
      inventory: updatedInventory,
    };

    await this.characterStorage.updateCharacter(updatedCharacter);
  }

  /**
   * Gets the standard starting equipment for a class
   */
  getClassStartingEquipment(classId: string): string[] {
    const classDefinition = this.contentRepository.getClassDefinition(classId);
    return classDefinition?.startingEquipment || [];
  }
}
