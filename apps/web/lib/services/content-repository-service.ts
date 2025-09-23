import { ancestryDefinitions as builtInAncestries } from "@/data/ancestries/index";
import { backgroundDefinitions as builtInBackgrounds } from "@/data/backgrounds/index";
// Built-in content imports
import { classDefinitions as builtInClasses } from "@/data/classes/index";
import { getBuiltInSpellSchools } from "@/data/spell-schools/index";
import { subclassDefinitions as builtInSubclasses } from "@/data/subclasses/index";

import { uploadableContentSchema } from "@/lib/schemas/uploadable-content";

import { ActionAbilityDefinition, SpellAbilityDefinition } from "../schemas/abilities";
import { AncestryDefinition } from "../schemas/ancestry";
import { BackgroundDefinition } from "../schemas/background";
import { ClassDefinition, FeaturePool, SubclassDefinition } from "../schemas/class";
import { CustomContentType } from "../types/custom-content";
import { CustomItemContent, RepositoryItem } from "../types/item-repository";
import { type IconId } from "../utils/icon-utils";
import { ContentValidationService } from "./content-validation-service";
import { ItemService } from "./item-service";
import { IStorageService, LocalStorageService } from "./storage-service";

// Storage keys for custom content
const STORAGE_KEYS = {
  customClasses: "nimble-navigator-custom-classes",
  customSubclasses: "nimble-navigator-custom-subclasses",
  customAncestries: "nimble-navigator-custom-ancestries",
  customBackgrounds: "nimble-navigator-custom-backgrounds",
  customSpellSchools: "nimble-navigator-custom-spell-schools",
  customAbilities: "nimble-navigator-custom-abilities",
  customSpells: "nimble-navigator-custom-spells",
  customItems: "nimble-navigator-custom-items",
} as const;

// Content validation schemas
export interface ContentUploadResult {
  success: boolean;
  message: string;
  itemsAdded?: number;
}

export interface MultiFileUploadResult {
  success: boolean;
  message: string;
  results: Array<{
    filename: string;
    contentType: CustomContentType | null;
    result: ContentUploadResult;
  }>;
}

// For content management - combines school definition with spells
export interface SpellSchoolWithSpells {
  id: string;
  name: string;
  description: string;
  color: string; // Tailwind color classes for the school
  icon: IconId; // Icon identifier for the school
  spells: SpellAbilityDefinition[]; // All spells (both combat and utility)
}

export class ContentRepositoryService {
  private static instance: ContentRepositoryService;
  private featurePoolMap: Map<string, FeaturePool> = new Map();
  private storage: IStorageService;

  constructor(storageService?: IStorageService) {
    this.storage = storageService || new LocalStorageService();
    this.initializeFeaturePools();
  }

  public static getInstance(storageService?: IStorageService): ContentRepositoryService {
    if (!ContentRepositoryService.instance) {
      ContentRepositoryService.instance = new ContentRepositoryService(storageService);
    }
    return ContentRepositoryService.instance;
  }

  private initializeFeaturePools(): void {
    // Add pools from built-in classes
    builtInClasses.forEach((classDef) => {
      if (classDef.featurePools) {
        classDef.featurePools.forEach((pool) => {
          this.featurePoolMap.set(pool.id, pool);
        });
      }
    });

    // Add pools from custom classes
    this.updateFeaturePoolsFromCustomClasses();
  }

  private updateFeaturePoolsFromCustomClasses(): void {
    const customClasses = this.getCustomClasses();
    customClasses.forEach((classDef) => {
      if (classDef.featurePools) {
        classDef.featurePools.forEach((pool) => {
          this.featurePoolMap.set(pool.id, pool);
        });
      }
    });
  }

  // Class Management
  public getAllClasses(): ClassDefinition[] {
    const customClasses = this.getCustomClasses();
    const customIds = new Set(customClasses.map((cls) => cls.id));

    // Filter out built-in classes that are overridden by custom ones
    const filteredBuiltIns = builtInClasses.filter((cls) => !customIds.has(cls.id));

    return [...filteredBuiltIns, ...customClasses];
  }

  public getClassDefinition(classId: string): ClassDefinition | null {
    // Check built-in classes first
    const builtInClass = builtInClasses.find((cls) => cls.id === classId);
    if (builtInClass) return builtInClass;

    // Check custom classes
    const customClasses = this.getCustomClasses();
    return customClasses.find((cls) => cls.id === classId) || null;
  }

  public getClassFeaturesForLevel(classId: string, level: number): ClassDefinition["features"] {
    const classDef = this.getClassDefinition(classId);
    if (!classDef) return [];

    return classDef.features.filter((feature) => feature.level === level);
  }

  public getAllClassFeaturesUpToLevel(classId: string, level: number): ClassDefinition["features"] {
    const classDef = this.getClassDefinition(classId);
    if (!classDef) return [];

    return classDef.features.filter((feature) => feature.level <= level);
  }

  // Ancestry Management
  public getAllAncestries(): AncestryDefinition[] {
    const customAncestries = this.getCustomAncestries();
    const customIds = new Set(customAncestries.map((ancestry) => ancestry.id));

    // Filter out built-in ancestries that are overridden by custom ones
    const filteredBuiltIns = builtInAncestries.filter((ancestry) => !customIds.has(ancestry.id));

    return [...filteredBuiltIns, ...customAncestries];
  }

  public getAncestryDefinition(ancestryId: string): AncestryDefinition | null {
    // Check built-in ancestries first
    const builtInAncestry = builtInAncestries.find((ancestry) => ancestry.id === ancestryId);
    if (builtInAncestry) return builtInAncestry;

    // Check custom ancestries
    const customAncestries = this.getCustomAncestries();
    return customAncestries.find((ancestry) => ancestry.id === ancestryId) || null;
  }

  public addCustomAncestry(ancestry: AncestryDefinition): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const customAncestries = this.getCustomAncestries();

        // Check for duplicate IDs
        if (customAncestries.some((existing) => existing.id === ancestry.id)) {
          reject(new Error(`Ancestry with ID '${ancestry.id}' already exists`));
          return;
        }

        // Add the new ancestry
        customAncestries.push(ancestry);

        // Save to storage
        this.storage.setItem(STORAGE_KEYS.customAncestries, JSON.stringify(customAncestries));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  public removeCustomAncestry(ancestryId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const customAncestries = this.getCustomAncestries();
        const filteredAncestries = customAncestries.filter(
          (ancestry) => ancestry.id !== ancestryId,
        );

        if (filteredAncestries.length === customAncestries.length) {
          reject(new Error(`Custom ancestry with ID '${ancestryId}' not found`));
          return;
        }

        this.storage.setItem(STORAGE_KEYS.customAncestries, JSON.stringify(filteredAncestries));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private getCustomAncestries(): AncestryDefinition[] {
    try {
      const stored = this.storage.getItem(STORAGE_KEYS.customAncestries);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      // Validate each ancestry and filter out invalid ones
      const validAncestries: AncestryDefinition[] = [];
      parsed.forEach((item, index) => {
        // TODO: Add ancestry validation when ContentValidationService is updated
        // For now, just do basic validation
        if (item && typeof item === "object" && item.id && item.name && item.description) {
          validAncestries.push(item);
        } else {
          console.warn(`Invalid custom ancestry at index ${index}:`, item);
        }
      });

      return validAncestries;
    } catch (error) {
      console.warn("Error reading custom ancestries from storage:", error);
      return [];
    }
  }

  // Background Management
  public getAllBackgrounds(): BackgroundDefinition[] {
    const customBackgrounds = this.getCustomBackgrounds();
    const customIds = new Set(customBackgrounds.map((bg) => bg.id));

    // Filter out built-in backgrounds that are overridden by custom ones
    const filteredBuiltIns = builtInBackgrounds.filter((bg) => !customIds.has(bg.id));

    return [...filteredBuiltIns, ...customBackgrounds];
  }

  public getBackgroundDefinition(backgroundId: string): BackgroundDefinition | null {
    // Check built-in backgrounds first
    const builtInBackground = builtInBackgrounds.find(
      (background) => background.id === backgroundId,
    );
    if (builtInBackground) return builtInBackground;

    // Check custom backgrounds
    const customBackgrounds = this.getCustomBackgrounds();
    return customBackgrounds.find((background) => background.id === backgroundId) || null;
  }

  public addCustomBackground(background: BackgroundDefinition): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const customBackgrounds = this.getCustomBackgrounds();

        // Check for duplicate IDs
        if (customBackgrounds.some((existing) => existing.id === background.id)) {
          reject(new Error(`Background with ID '${background.id}' already exists`));
          return;
        }

        // Add the new background
        customBackgrounds.push(background);

        // Save to storage
        this.storage.setItem(STORAGE_KEYS.customBackgrounds, JSON.stringify(customBackgrounds));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  public removeCustomBackground(backgroundId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const customBackgrounds = this.getCustomBackgrounds();
        const filteredBackgrounds = customBackgrounds.filter(
          (background) => background.id !== backgroundId,
        );

        if (filteredBackgrounds.length === customBackgrounds.length) {
          reject(new Error(`Custom background with ID '${backgroundId}' not found`));
          return;
        }

        this.storage.setItem(STORAGE_KEYS.customBackgrounds, JSON.stringify(filteredBackgrounds));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private getCustomBackgrounds(): BackgroundDefinition[] {
    try {
      const stored = this.storage.getItem(STORAGE_KEYS.customBackgrounds);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      // Validate each background and filter out invalid ones
      const validBackgrounds: BackgroundDefinition[] = [];
      parsed.forEach((item, index) => {
        // TODO: Add background validation when ContentValidationService is updated
        // For now, just do basic validation
        if (item && typeof item === "object" && item.id && item.name && item.description) {
          validBackgrounds.push(item);
        } else {
          console.warn(`Invalid custom background at index ${index}:`, item);
        }
      });

      return validBackgrounds;
    } catch (error) {
      console.warn("Error reading custom backgrounds from storage:", error);
      return [];
    }
  }

  public uploadAncestry(ancestry: AncestryDefinition): ContentUploadResult {
    const existingAncestries = this.getCustomAncestries();
    const updatedAncestries = [...existingAncestries];

    const existingIndex = updatedAncestries.findIndex((existing) => existing.id === ancestry.id);
    if (existingIndex >= 0) {
      updatedAncestries[existingIndex] = ancestry; // Replace existing
    } else {
      updatedAncestries.push(ancestry); // Add new
    }

    this.storage.setItem(STORAGE_KEYS.customAncestries, JSON.stringify(updatedAncestries));

    return {
      success: true,
      message: `Successfully added/updated ancestry: ${ancestry.name}`,
      itemsAdded: 1,
    };
  }

  public uploadBackground(background: BackgroundDefinition): ContentUploadResult {
    const existingBackgrounds = this.getCustomBackgrounds();
    const updatedBackgrounds = [...existingBackgrounds];

    const existingIndex = updatedBackgrounds.findIndex((existing) => existing.id === background.id);
    if (existingIndex >= 0) {
      updatedBackgrounds[existingIndex] = background; // Replace existing
    } else {
      updatedBackgrounds.push(background); // Add new
    }

    this.storage.setItem(STORAGE_KEYS.customBackgrounds, JSON.stringify(updatedBackgrounds));

    return {
      success: true,
      message: `Successfully added/updated background: ${background.name}`,
      itemsAdded: 1,
    };
  }

  public uploadClass(classDefinition: ClassDefinition): ContentUploadResult {
    const existingCustomClasses = this.getCustomClasses();
    const updatedClasses = [...existingCustomClasses];

    const existingIndex = updatedClasses.findIndex((cls) => cls.id === classDefinition.id);
    if (existingIndex >= 0) {
      updatedClasses[existingIndex] = classDefinition; // Replace existing
    } else {
      updatedClasses.push(classDefinition); // Add new
    }

    this.storage.setItem(STORAGE_KEYS.customClasses, JSON.stringify(updatedClasses));

    // Update feature pool map with new classes
    this.updateFeaturePoolsFromCustomClasses();

    return {
      success: true,
      message: `Successfully added/updated class: ${classDefinition.name}`,
      itemsAdded: 1,
    };
  }

  public removeCustomClass(classId: string): boolean {
    const customClasses = this.getCustomClasses();
    const filteredClasses = customClasses.filter((cls) => cls.id !== classId);

    if (filteredClasses.length < customClasses.length) {
      this.storage.setItem(STORAGE_KEYS.customClasses, JSON.stringify(filteredClasses));
      // Update feature pool map after removing class
      this.initializeFeaturePools();
      return true;
    }
    return false;
  }

  private getCustomClasses(): ClassDefinition[] {
    try {
      const stored = this.storage.getItem(STORAGE_KEYS.customClasses);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      // Validate each class and filter out invalid ones
      const validClasses: ClassDefinition[] = [];
      parsed.forEach((item, index) => {
        const validation = ContentValidationService.validateClass(item);
        if (validation.valid && validation.data) {
          validClasses.push(validation.data);
        } else {
          console.warn(`Invalid class found in storage at index ${index}:`, validation.errors);
        }
      });

      // If we filtered out invalid items, update localStorage
      if (validClasses.length !== parsed.length) {
        this.storage.setItem(STORAGE_KEYS.customClasses, JSON.stringify(validClasses));
      }

      return validClasses;
    } catch (error) {
      console.warn("Error reading custom classes from storage:", error);
      return [];
    }
  }

  // Subclass Management
  public getAllSubclasses(): SubclassDefinition[] {
    const customSubclasses = this.getCustomSubclasses();
    const customIds = new Set(customSubclasses.map((sub) => sub.id));

    // Filter out built-in subclasses that are overridden by custom ones
    const filteredBuiltIns = builtInSubclasses.filter((sub) => !customIds.has(sub.id));

    return [...filteredBuiltIns, ...customSubclasses];
  }

  public getSubclassDefinition(subclassId: string): SubclassDefinition | null {
    // Check built-in subclasses first
    const builtInSubclass = builtInSubclasses.find((sub) => sub.id === subclassId);
    if (builtInSubclass) return builtInSubclass;

    // Check custom subclasses
    const customSubclasses = this.getCustomSubclasses();
    return customSubclasses.find((sub) => sub.id === subclassId) || null;
  }

  public getSubclassesForClass(classId: string): SubclassDefinition[] {
    return this.getAllSubclasses().filter((sub) => sub.parentClassId === classId);
  }

  public getSubclassFeaturesForLevel(
    subclassId: string,
    level: number,
  ): SubclassDefinition["features"] {
    const subclassDef = this.getSubclassDefinition(subclassId);
    if (!subclassDef) return [];

    return subclassDef.features.filter((feature) => feature.level === level);
  }

  public getAllSubclassFeaturesUpToLevel(
    subclassId: string,
    level: number,
  ): SubclassDefinition["features"] {
    const subclassDef = this.getSubclassDefinition(subclassId);
    if (!subclassDef) return [];

    return subclassDef.features.filter((feature) => feature.level <= level);
  }

  public uploadSubclass(subclass: SubclassDefinition): ContentUploadResult {
    const existingSubclasses = this.getCustomSubclasses();
    const updatedSubclasses = [...existingSubclasses];

    const existingIndex = updatedSubclasses.findIndex((sub) => sub.id === subclass.id);
    if (existingIndex >= 0) {
      updatedSubclasses[existingIndex] = subclass;
    } else {
      updatedSubclasses.push(subclass);
    }

    this.storage.setItem(STORAGE_KEYS.customSubclasses, JSON.stringify(updatedSubclasses));

    return {
      success: true,
      message: `Successfully added/updated subclass: ${subclass.name}`,
      itemsAdded: 1,
    };
  }

  private getCustomSubclasses(): SubclassDefinition[] {
    try {
      const stored = this.storage.getItem(STORAGE_KEYS.customSubclasses);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      // Validate each subclass and filter out invalid ones
      const validSubclasses: SubclassDefinition[] = [];
      parsed.forEach((item, index) => {
        const validation = ContentValidationService.validateSubclass(item);
        if (validation.valid && validation.data) {
          validSubclasses.push(validation.data);
        } else {
          console.warn(`Invalid subclass found in storage at index ${index}:`, validation.errors);
        }
      });

      // If we filtered out invalid items, update localStorage
      if (validSubclasses.length !== parsed.length) {
        this.storage.setItem(STORAGE_KEYS.customSubclasses, JSON.stringify(validSubclasses));
      }

      return validSubclasses;
    } catch (error) {
      console.warn("Error reading custom subclasses from storage:", error);
      return [];
    }
  }

  // Spell School Management
  public getAllSpellSchools(): SpellSchoolWithSpells[] {
    const builtInSchools = getBuiltInSpellSchools();
    const customSchools = this.getCustomSpellSchools();

    // Combine built-in and custom schools
    // Custom schools can override built-in ones with the same ID
    const schoolMap = new Map<string, SpellSchoolWithSpells>();

    // Add built-in schools first
    builtInSchools.forEach((school) => {
      schoolMap.set(school.id, school);
    });

    // Add/override with custom schools
    customSchools.forEach((school) => {
      schoolMap.set(school.id, school);
    });

    return Array.from(schoolMap.values());
  }

  public getSpellSchool(schoolId: string): SpellSchoolWithSpells | null {
    const allSchools = this.getAllSpellSchools();
    return allSchools.find((school) => school.id === schoolId) || null;
  }

  /**
   * Get all spells from a school (both combat and utility)
   */
  public getSpellsBySchool(schoolId: string): SpellAbilityDefinition[] {
    const school = this.getSpellSchool(schoolId);
    if (!school) return [];

    // Get all custom spells that belong to this school
    const customSpells = this.getCustomSpells().filter((spell) => spell.school === schoolId);

    // Merge school's defined spells with custom spells
    return [...school.spells, ...customSpells];
  }

  /**
   * Get only combat spells from a school (excludes utility spells)
   * These are automatically known when a character gains access to a spell school
   */
  public getCombatSpellsForSchool(schoolId: string): SpellAbilityDefinition[] {
    const allSpells = this.getSpellsBySchool(schoolId);
    // Return spells that are NOT utility spells
    return allSpells.filter((spell) => spell.category !== "utility");
  }

  public getUtilitySpellsForSchool(schoolId: string): SpellAbilityDefinition[] {
    const school = this.getSpellSchool(schoolId);
    if (!school) return [];

    // Filter for utility spells only (category: "utility")
    return school.spells.filter((spell) => spell.category === "utility");
  }

  /**
   * Get a spell by its ID, searching across all schools
   * @param spellId The ID of the spell to find
   * @returns The spell definition or null if not found
   */
  public getSpellById(spellId: string): SpellAbilityDefinition | null {
    // First check custom spells
    const customSpells = this.getCustomSpells();
    const customSpell = customSpells.find((spell) => spell.id === spellId);
    if (customSpell) return customSpell;

    // Then search through all schools
    const allSchools = this.getAllSpellSchools();
    for (const school of allSchools) {
      const spell = school.spells.find((s) => s.id === spellId);
      if (spell) return spell;
    }

    return null;
  }

  public uploadSpellSchool(school: SpellSchoolWithSpells): ContentUploadResult {
    const existingSchools = this.getCustomSpellSchools();
    const updatedSchools = [...existingSchools];

    const existingIndex = updatedSchools.findIndex((existing) => existing.id === school.id);
    if (existingIndex >= 0) {
      updatedSchools[existingIndex] = school;
    } else {
      updatedSchools.push(school);
    }

    this.storage.setItem(STORAGE_KEYS.customSpellSchools, JSON.stringify(updatedSchools));

    return {
      success: true,
      message: `Successfully added/updated spell school: ${school.name}`,
      itemsAdded: 1,
    };
  }

  private getCustomSpellSchools(): SpellSchoolWithSpells[] {
    try {
      const stored = this.storage.getItem(STORAGE_KEYS.customSpellSchools);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      // Validate each spell school and filter out invalid ones
      const validSchools: SpellSchoolWithSpells[] = [];
      parsed.forEach((item, index) => {
        const validation = ContentValidationService.validateSpellSchool(item);
        if (validation.valid && validation.data) {
          validSchools.push(validation.data);
        } else {
          console.warn(
            `Invalid spell school found in storage at index ${index}:`,
            validation.errors,
          );
        }
      });

      // If we filtered out invalid items, update localStorage
      if (validSchools.length !== parsed.length) {
        this.storage.setItem(STORAGE_KEYS.customSpellSchools, JSON.stringify(validSchools));
      }

      return validSchools;
    } catch (error) {
      console.warn("Error reading custom spell schools from storage:", error);
      return [];
    }
  }

  // Ability Management (for non-spell abilities)
  public getAllActionAbilities(): ActionAbilityDefinition[] {
    const customAbilities = this.getCustomAbilities();
    return [...customAbilities];
  }

  public getActionAbility(abilityId: string): ActionAbilityDefinition | null {
    const allAbilities = this.getAllActionAbilities();
    return allAbilities.find((ability) => ability.id === abilityId) || null;
  }

  public uploadAbility(ability: ActionAbilityDefinition): ContentUploadResult {
    const existingAbilities = this.getCustomAbilities();
    const updatedAbilities = [...existingAbilities];

    const existingIndex = updatedAbilities.findIndex((existing) => existing.id === ability.id);
    if (existingIndex >= 0) {
      updatedAbilities[existingIndex] = ability;
    } else {
      updatedAbilities.push(ability);
    }

    this.storage.setItem(STORAGE_KEYS.customAbilities, JSON.stringify(updatedAbilities));

    return {
      success: true,
      message: `Successfully added/updated ability: ${ability.name}`,
      itemsAdded: 1,
    };
  }

  private getCustomAbilities(): ActionAbilityDefinition[] {
    try {
      const stored = this.storage.getItem(STORAGE_KEYS.customAbilities);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      // Validate each ability and filter out invalid ones
      const validAbilities: ActionAbilityDefinition[] = [];
      parsed.forEach((item, index) => {
        const validation = ContentValidationService.validateActionAbility(item);
        if (validation.valid && validation.data) {
          validAbilities.push(validation.data);
        } else {
          console.warn(
            `Invalid action ability found in storage at index ${index}:`,
            validation.errors,
          );
        }
      });

      // If we filtered out invalid items, update localStorage
      if (validAbilities.length !== parsed.length) {
        this.storage.setItem(STORAGE_KEYS.customAbilities, JSON.stringify(validAbilities));
      }

      return validAbilities;
    } catch (error) {
      console.warn("Error reading custom abilities from storage:", error);
      return [];
    }
  }

  // Spell Management (separate from abilities)
  public getAllSpells(): SpellAbilityDefinition[] {
    // Get all spells from all built-in schools
    const builtInSchools = getBuiltInSpellSchools();
    const builtInSpells = builtInSchools.flatMap((school) => school.spells);
    const customSpells = this.getCustomSpells();
    const customIds = new Set(customSpells.map((spell) => spell.id));

    // Filter out built-in spells that are overridden by custom ones
    const filteredBuiltInSpells = builtInSpells.filter((spell) => !customIds.has(spell.id));

    return [...filteredBuiltInSpells, ...customSpells];
  }

  public getSpell(spellId: string): SpellAbilityDefinition | null {
    const allSpells = this.getAllSpells();
    return allSpells.find((spell) => spell.id === spellId) || null;
  }

  public uploadSpell(spell: SpellAbilityDefinition): ContentUploadResult {
    const existingSpells = this.getCustomSpells();
    const updatedSpells = [...existingSpells];

    const existingIndex = updatedSpells.findIndex((existing) => existing.id === spell.id);
    if (existingIndex >= 0) {
      updatedSpells[existingIndex] = spell;
    } else {
      updatedSpells.push(spell);
    }

    this.storage.setItem(STORAGE_KEYS.customSpells, JSON.stringify(updatedSpells));

    return {
      success: true,
      message: `Successfully added/updated spell: ${spell.name}`,
      itemsAdded: 1,
    };
  }

  private getCustomSpells(): SpellAbilityDefinition[] {
    try {
      const stored = this.storage.getItem(STORAGE_KEYS.customSpells);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      // Validate each spell and filter out invalid ones
      const validSpells: SpellAbilityDefinition[] = [];
      parsed.forEach((item, index) => {
        const validation = ContentValidationService.validateSpellAbility(item);
        if (validation.valid && validation.data) {
          validSpells.push(validation.data);
        } else {
          console.warn(`Invalid spell found in storage at index ${index}:`, validation.errors);
        }
      });

      // If we filtered out invalid items, update localStorage
      if (validSpells.length !== parsed.length) {
        this.storage.setItem(STORAGE_KEYS.customSpells, JSON.stringify(validSpells));
      }

      return validSpells;
    } catch (error) {
      console.warn("Error reading custom spells from storage:", error);
      return [];
    }
  }

  // Item Repository Management
  public getAllItems(): RepositoryItem[] {
    const itemService = ItemService.getInstance();
    const builtInItems = itemService.getAllItems();
    const customItems = this.getCustomItems();
    const customIds = new Set(customItems.map((item) => item.id));

    // Filter out built-in items that are overridden by custom ones
    const filteredBuiltInItems = builtInItems.filter((item) => !customIds.has(item.id));

    return [...filteredBuiltInItems, ...customItems];
  }

  public uploadItems(data: CustomItemContent): ContentUploadResult {
    const validItems = data.items;
    const existingItems = this.getCustomItems();
    const updatedItems = [...existingItems];

    validItems.forEach((newItem) => {
      const existingIndex = updatedItems.findIndex((item) => item.id === newItem.id);
      if (existingIndex >= 0) {
        updatedItems[existingIndex] = newItem;
      } else {
        updatedItems.push(newItem);
      }
    });

    this.storage.setItem(STORAGE_KEYS.customItems, JSON.stringify(updatedItems));

    const message =
      validItems.length === 1
        ? `Successfully added/updated item: ${validItems[0].name}`
        : `Successfully added/updated ${validItems.length} item(s)`;

    return {
      success: true,
      message,
      itemsAdded: validItems.length,
    };
  }

  public getCustomItems(): RepositoryItem[] {
    try {
      const stored = this.storage.getItem(STORAGE_KEYS.customItems);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      // Validate custom items using ContentValidationService
      const validItems: RepositoryItem[] = [];
      parsed.forEach((item, index) => {
        const validation = ContentValidationService.validateRepositoryItem(item);
        if (validation.valid && validation.data) {
          validItems.push(validation.data);
        } else {
          console.warn(
            `Invalid custom item found in storage at index ${index}:`,
            validation.errors,
          );
        }
      });

      // If we filtered out invalid items, update localStorage
      if (validItems.length !== parsed.length) {
        this.storage.setItem(STORAGE_KEYS.customItems, JSON.stringify(validItems));
      }

      return validItems;
    } catch (error) {
      console.warn("Error reading custom items from storage:", error);
      return [];
    }
  }

  // Feature Pool Management
  public getFeaturePool(poolId: string): FeaturePool | null {
    if (this.featurePoolMap.size === 0) {
      this.initializeFeaturePools();
    }
    return this.featurePoolMap.get(poolId) || null;
  }

  public getAllFeaturePools(): FeaturePool[] {
    if (this.featurePoolMap.size === 0) {
      this.initializeFeaturePools();
    }
    return Array.from(this.featurePoolMap.values());
  }

  // Multi-file upload method
  public uploadMultipleFiles(files: File[]): Promise<MultiFileUploadResult> {
    return new Promise((resolve) => {
      const results: MultiFileUploadResult["results"] = [];
      let pendingFiles = files.length;

      if (pendingFiles === 0) {
        resolve({
          success: false,
          message: "No files provided",
          results: [],
        });
        return;
      }

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const data = JSON.parse(content);

            // Validate with uploadable content schema
            const validation = uploadableContentSchema.safeParse(data);
            let result: ContentUploadResult;

            if (!validation.success) {
              result = {
                success: false,
                message:
                  "File does not match expected uploadable content format. Ensure your JSON includes a 'contentType' field and 'data' field with valid content.",
              };
            } else {
              // Extract content type and data from validated structure
              const uploadableContent = validation.data;

              // Upload using the detected content type with typed data directly
              switch (uploadableContent.contentType) {
                case CustomContentType.CLASS:
                  result = this.uploadClass(uploadableContent.data as ClassDefinition);
                  break;
                case CustomContentType.SUBCLASS:
                  result = this.uploadSubclass(uploadableContent.data as SubclassDefinition);
                  break;
                case CustomContentType.SPELL_SCHOOL:
                  result = this.uploadSpellSchool(uploadableContent.data as SpellSchoolWithSpells);
                  break;
                case CustomContentType.ANCESTRY:
                  result = this.uploadAncestry(uploadableContent.data as AncestryDefinition);
                  break;
                case CustomContentType.BACKGROUND:
                  result = this.uploadBackground(uploadableContent.data as BackgroundDefinition);
                  break;
                case CustomContentType.ACTION:
                  result = this.uploadAbility(uploadableContent.data as ActionAbilityDefinition);
                  break;
                case CustomContentType.SPELL:
                  result = this.uploadSpell(uploadableContent.data as SpellAbilityDefinition);
                  break;
                case CustomContentType.ITEM:
                  result = this.uploadItems(uploadableContent.data as CustomItemContent);
                  break;
                default:
                  result = {
                    success: false,
                    message: "Unknown content type",
                  };
              }
            }

            results.push({
              filename: file.name,
              contentType: validation.data?.contentType || null,
              result,
            });

            pendingFiles--;
            if (pendingFiles === 0) {
              // All files processed
              const successfulResults = results.filter((r) => r.result.success);
              const failedResults = results.filter((r) => !r.result.success);

              let message = "";
              if (successfulResults.length > 0) {
                // Track content by type
                const contentCounts: Record<string, number> = {};
                successfulResults.forEach((r) => {
                  if (r.contentType) {
                    const typeName = r.contentType.replace("-", " ");
                    contentCounts[typeName] = (contentCounts[typeName] || 0) + 1;
                  }
                });

                // Create detailed breakdown
                const breakdownParts = Object.entries(contentCounts).map(
                  ([type, count]) => `${count} ${type}${count === 1 ? "" : "s"}`,
                );

                if (breakdownParts.length > 0) {
                  message = `Successfully processed ${successfulResults.length} file(s): ${breakdownParts.join(", ")}`;
                } else {
                  message = `Successfully processed ${successfulResults.length} file(s)`;
                }
              }

              if (failedResults.length > 0) {
                if (message) message += ". ";
                message += `${failedResults.length} file(s) failed to process`;
              }

              resolve({
                success: successfulResults.length > 0,
                message,
                results,
              });
            }
          } catch (error) {
            results.push({
              filename: file.name,
              contentType: null,
              result: {
                success: false,
                message: "Invalid JSON format",
              },
            });

            pendingFiles--;
            if (pendingFiles === 0) {
              resolve({
                success: false,
                message: "All files failed to process",
                results,
              });
            }
          }
        };
        reader.readAsText(file);
      });
    });
  }

  // Utility Methods
  public clearAllCustomContent(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      this.storage.removeItem(key);
    });
  }

  public getCustomContentStats(): Record<CustomContentType, number> {
    // For classes, only count truly custom ones (not built-in)
    const customClasses = this.getCustomClasses();

    // For spell schools, count only custom ones
    const customSpellSchools = this.getCustomSpellSchools();

    // For spells, count only loose custom spells (not part of school definitions)
    const customSpells = this.getCustomSpells();

    return {
      [CustomContentType.CLASS]: customClasses.length,
      [CustomContentType.SUBCLASS]: this.getCustomSubclasses().length,
      [CustomContentType.SPELL_SCHOOL]: customSpellSchools.length,
      [CustomContentType.ANCESTRY]: this.getCustomAncestries().length,
      [CustomContentType.BACKGROUND]: this.getCustomBackgrounds().length,
      [CustomContentType.ACTION]: this.getCustomAbilities().length,
      [CustomContentType.SPELL]: customSpells.length,
      [CustomContentType.ITEM]: this.getCustomItems().length,
    };
  }
}
