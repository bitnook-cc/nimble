import { Character, Attributes, SelectedFeature } from '../types/character';
import { ICharacterCreation, ICharacterStorage, ICharacterService, IAncestryService, IBackgroundService } from './interfaces';
import { ContentRepositoryService } from './content-repository-service';
import { ItemService } from './item-service';
import { gameConfig } from '../config/game-config';
import { 
  createDefaultCharacterConfiguration, 
  createDefaultHitPoints, 
  createDefaultHitDice, 
  createDefaultProficiencies,
  createDefaultSkills,
  createDefaultInventory,
  createDefaultInitiative,
  createDefaultActionTracker,
  createDefaultWounds,
} from '../utils/character-defaults';
import { Item } from '../types/inventory';
import { NameGenerator } from '../utils/name-generator';
import { genericNames } from '../config/name-config';

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
  selectedFeatures: SelectedFeature[];
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
    private backgroundService: IBackgroundService
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
        throw new Error('No ancestries available');
      }
      ancestryId = availableAncestries[Math.floor(Math.random() * availableAncestries.length)].id;
    }

    // Get or select background
    let backgroundId = options.backgroundId;
    if (!backgroundId) {
      const availableBackgrounds = this.backgroundService.getAvailableBackgrounds();
      if (availableBackgrounds.length === 0) {
        throw new Error('No backgrounds available');
      }
      backgroundId = availableBackgrounds[Math.floor(Math.random() * availableBackgrounds.length)].id;
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
      // Generate sample attributes based on class key attributes
      const [primary, secondary] = classDefinition.keyAttributes;
      attributes = {
        strength: primary === 'strength' || secondary === 'strength' ? 3 : 1,
        dexterity: primary === 'dexterity' || secondary === 'dexterity' ? 3 : 1,
        intelligence: primary === 'intelligence' || secondary === 'intelligence' ? 3 : 1,
        will: primary === 'will' || secondary === 'will' ? 3 : 1,
      };
    }

    // Use createCompleteCharacter with generated/selected values
    return this.createCompleteCharacter({
      name,
      ancestryId,
      backgroundId,
      classId,
      attributes,
      skillAllocations: {}, // Use defaults
      selectedFeatures: [], // No custom feature selections for quick create
      selectedEquipment: classDefinition.startingEquipment || [] // Use class default equipment
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
      selectedFeatures,
      selectedEquipment
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

    // Create ancestry and background traits
    const ancestry = this.ancestryService.createAncestryTrait(ancestryId);
    const background = this.backgroundService.createBackgroundTrait(backgroundId);

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
          modifier: points
        };
      }
    });

    // Create inventory with selected equipment
    const inventory = createDefaultInventory(attributes.strength);
    if (selectedEquipment.length > 0) {
      const items: Item[] = selectedEquipment.map(itemId => {
        return this.itemService.createInventoryItem(itemId);
      }).filter(item => item !== null) as Item[];
      
      inventory.items = items;
    }

    // Create the character with all data
    const characterId = `character-${Date.now()}`;
    const character = await this.characterStorage.createCharacter({
      name,
      ancestry,
      background,
      level: 1,
      classId,
      grantedFeatures: [], // Will be populated by syncCharacterFeatures
      selectedFeatures,
      spellTierAccess: 0, // Will be updated by class features
      proficiencies,
      _attributes: attributes,
      saveAdvantages: { ...classDefinition.saveAdvantages },
      hitPoints,
      _hitDice: hitDice,
      wounds: createDefaultWounds(config.maxWounds),
      resources: [],
      config,
      _initiative: createDefaultInitiative(),
      actionTracker: createDefaultActionTracker(),
      inEncounter: false,
      _skills: skills,
      inventory,
      abilities: []
    }, characterId);

    // Load the character into the service to apply features
    await this.characterService.loadCharacter(character.id);

    // Apply ancestry features
    await this.ancestryService.grantAncestryFeatures(character.id);
    
    // Apply background features
    await this.backgroundService.grantBackgroundFeatures(character.id);

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
    const equipmentItems = equipmentIds.map(repositoryId => {
      const inventoryItem = this.itemService.createInventoryItem(repositoryId);
      if (!inventoryItem) {
        console.warn(`Failed to create inventory item for repository ID: ${repositoryId}`);
        return null;
      }
      return inventoryItem;
    }).filter(item => item !== null);

    // Add items to character's inventory
    const updatedInventory = {
      ...character.inventory,
      items: [...character.inventory.items, ...equipmentItems]
    };

    const updatedCharacter = {
      ...character,
      inventory: updatedInventory
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