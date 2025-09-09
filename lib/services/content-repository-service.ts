import { ancestryDefinitions as builtInAncestries } from "../data/ancestries/index";
import { backgroundDefinitions as builtInBackgrounds } from "../data/backgrounds/index";
// Built-in content imports
import { classDefinitions as builtInClasses } from "../data/classes/index";
import { ITEM_REPOSITORY } from "../data/items";
import { getBuiltInSpellSchools } from "../data/spell-schools/index";
import { subclassDefinitions as builtInSubclasses } from "../data/subclasses/index";
import { ActionAbilityDefinition, SpellAbilityDefinition } from "../schemas/abilities";
import { AncestryDefinition } from "../schemas/ancestry";
import { BackgroundDefinition } from "../schemas/background";
import { ClassDefinition, FeaturePool, SubclassDefinition } from "../schemas/class";
import { CustomContentType } from "../types/custom-content";
import { CustomItemContent, RepositoryItem } from "../types/item-repository";
import { ContentValidationService } from "./content-validation-service";
import { type IconId } from "../utils/icon-utils";

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

// For content management - combines school definition with spells
export interface SpellSchoolWithSpells {
  id: string;
  name: string;
  description: string;
  color: string; // Tailwind color classes for the school
  icon: IconId; // Icon identifier for the school
  spells: SpellAbilityDefinition[];
  utilitySpells: SpellAbilityDefinition[]; // Utility spells that must be learned separately
}

export class ContentRepositoryService {
  private static instance: ContentRepositoryService;
  private featurePoolMap: Map<string, FeaturePool> = new Map();

  constructor() {
    // Initialize the feature pool map from built-in classes
    this.initializeFeaturePools();
  }

  public static getInstance(): ContentRepositoryService {
    if (!ContentRepositoryService.instance) {
      ContentRepositoryService.instance = new ContentRepositoryService();
    }
    return ContentRepositoryService.instance;
  }

  private initializeFeaturePools(): void {
    // Add pools from built-in classes
    builtInClasses.forEach(classDef => {
      if (classDef.featurePools) {
        classDef.featurePools.forEach(pool => {
          this.featurePoolMap.set(pool.id, pool);
        });
      }
    });

    // Add pools from custom classes
    this.updateFeaturePoolsFromCustomClasses();
  }

  private updateFeaturePoolsFromCustomClasses(): void {
    const customClasses = this.getCustomClasses();
    customClasses.forEach(classDef => {
      if (classDef.featurePools) {
        classDef.featurePools.forEach(pool => {
          this.featurePoolMap.set(pool.id, pool);
        });
      }
    });
  }

  // Class Management
  public getAllClasses(): ClassDefinition[] {
    const customClasses = this.getCustomClasses();
    return [...builtInClasses, ...customClasses];
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
    return [...builtInAncestries, ...customAncestries];
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
        localStorage.setItem(STORAGE_KEYS.customAncestries, JSON.stringify(customAncestries));
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

        localStorage.setItem(STORAGE_KEYS.customAncestries, JSON.stringify(filteredAncestries));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private getCustomAncestries(): AncestryDefinition[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.customAncestries);
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
    return [...builtInBackgrounds, ...customBackgrounds];
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
        localStorage.setItem(STORAGE_KEYS.customBackgrounds, JSON.stringify(customBackgrounds));
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

        localStorage.setItem(STORAGE_KEYS.customBackgrounds, JSON.stringify(filteredBackgrounds));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private getCustomBackgrounds(): BackgroundDefinition[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.customBackgrounds);
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

  public uploadAncestries(ancestriesJson: string): ContentUploadResult {
    try {
      const data = JSON.parse(ancestriesJson);
      const ancestries = Array.isArray(data) ? data : [data];

      // Validate using Zod schemas
      const validAncestries: AncestryDefinition[] = [];
      const errors: string[] = [];
      ancestries.forEach((ancestry, index) => {
        const validation = ContentValidationService.validateAncestry(ancestry);
        if (validation.valid && validation.data) {
          validAncestries.push(validation.data);
        } else {
          errors.push(
            `Ancestry ${index + 1}: ${validation.errors?.join(", ") || "Invalid format"}`,
          );
        }
      });

      if (validAncestries.length === 0) {
        return {
          success: false,
          message: `No valid ancestry definitions found. Errors: ${errors.join("; ")}`,
        };
      }

      const existingAncestries = this.getCustomAncestries();
      const updatedAncestries = [...existingAncestries];
      validAncestries.forEach((newAncestry) => {
        const existingIndex = updatedAncestries.findIndex(
          (ancestry) => ancestry.id === newAncestry.id,
        );
        if (existingIndex >= 0) {
          updatedAncestries[existingIndex] = newAncestry; // Replace existing
        } else {
          updatedAncestries.push(newAncestry); // Add new
        }
      });

      localStorage.setItem(STORAGE_KEYS.customAncestries, JSON.stringify(updatedAncestries));
      const message =
        validAncestries.length === 1
          ? `Successfully added/updated ancestry: ${validAncestries[0].name}`
          : `Successfully added/updated ${validAncestries.length} ancestries`;

      return {
        success: true,
        message,
        itemsAdded: validAncestries.length,
      };
    } catch (error) {
      return { success: false, message: "Invalid JSON format" };
    }
  }

  public uploadBackgrounds(backgroundsJson: string): ContentUploadResult {
    try {
      const data = JSON.parse(backgroundsJson);
      const backgrounds = Array.isArray(data) ? data : [data];

      // Validate using Zod schemas
      const validBackgrounds: BackgroundDefinition[] = [];
      const errors: string[] = [];
      backgrounds.forEach((background, index) => {
        const validation = ContentValidationService.validateBackground(background);
        if (validation.valid && validation.data) {
          validBackgrounds.push(validation.data);
        } else {
          errors.push(
            `Background ${index + 1}: ${validation.errors?.join(", ") || "Invalid format"}`,
          );
        }
      });

      if (validBackgrounds.length === 0) {
        return {
          success: false,
          message: `No valid background definitions found. Errors: ${errors.join("; ")}`,
        };
      }

      const existingBackgrounds = this.getCustomBackgrounds();
      const updatedBackgrounds = [...existingBackgrounds];
      validBackgrounds.forEach((newBackground) => {
        const existingIndex = updatedBackgrounds.findIndex(
          (background) => background.id === newBackground.id,
        );
        if (existingIndex >= 0) {
          updatedBackgrounds[existingIndex] = newBackground; // Replace existing
        } else {
          updatedBackgrounds.push(newBackground); // Add new
        }
      });

      localStorage.setItem(STORAGE_KEYS.customBackgrounds, JSON.stringify(updatedBackgrounds));
      const message =
        validBackgrounds.length === 1
          ? `Successfully added/updated background: ${validBackgrounds[0].name}`
          : `Successfully added/updated ${validBackgrounds.length} backgrounds`;

      return {
        success: true,
        message,
        itemsAdded: validBackgrounds.length,
      };
    } catch (error) {
      return { success: false, message: "Invalid JSON format" };
    }
  }

  public uploadClasses(classesJson: string): ContentUploadResult {
    try {
      const data = JSON.parse(classesJson);
      const classes = Array.isArray(data) ? data : [data];

      // Validate using Zod schemas
      const validClasses: ClassDefinition[] = [];
      const errors: string[] = [];

      classes.forEach((cls, index) => {
        const validation = ContentValidationService.validateClass(cls);
        if (validation.valid && validation.data) {
          validClasses.push(validation.data);
        } else {
          errors.push(`Class ${index + 1}: ${validation.errors?.join(", ") || "Invalid format"}`);
        }
      });

      if (validClasses.length === 0) {
        return {
          success: false,
          message: `No valid class definitions found. Errors: ${errors.join("; ")}`,
        };
      }

      // Store custom classes
      const existingCustomClasses = this.getCustomClasses();
      const updatedClasses = [...existingCustomClasses];

      validClasses.forEach((newClass) => {
        const existingIndex = updatedClasses.findIndex((cls) => cls.id === newClass.id);
        if (existingIndex >= 0) {
          updatedClasses[existingIndex] = newClass; // Replace existing
        } else {
          updatedClasses.push(newClass); // Add new
        }
      });

      localStorage.setItem(STORAGE_KEYS.customClasses, JSON.stringify(updatedClasses));

      // Update feature pool map with new classes
      this.updateFeaturePoolsFromCustomClasses();

      const message =
        errors.length > 0
          ? `Successfully added/updated ${validClasses.length} class(es). ${errors.length} invalid entries skipped.`
          : `Successfully added/updated ${validClasses.length} class(es)`;

      return {
        success: true,
        message,
        itemsAdded: validClasses.length,
      };
    } catch (error) {
      return { success: false, message: "Invalid JSON format" };
    }
  }

  public removeCustomClass(classId: string): boolean {
    const customClasses = this.getCustomClasses();
    const filteredClasses = customClasses.filter((cls) => cls.id !== classId);

    if (filteredClasses.length < customClasses.length) {
      localStorage.setItem(STORAGE_KEYS.customClasses, JSON.stringify(filteredClasses));
      // Update feature pool map after removing class
      this.initializeFeaturePools();
      return true;
    }
    return false;
  }

  private getCustomClasses(): ClassDefinition[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.customClasses);
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
        localStorage.setItem(STORAGE_KEYS.customClasses, JSON.stringify(validClasses));
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
    return [...builtInSubclasses, ...customSubclasses];
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

  public uploadSubclasses(subclassesJson: string): ContentUploadResult {
    try {
      const data = JSON.parse(subclassesJson);
      const subclasses = Array.isArray(data) ? data : [data];

      // Validate using Zod schemas
      const validSubclasses: SubclassDefinition[] = [];
      const errors: string[] = [];

      subclasses.forEach((subclass, index) => {
        const validation = ContentValidationService.validateSubclass(subclass);
        if (validation.valid && validation.data) {
          validSubclasses.push(validation.data);
        } else {
          errors.push(
            `Subclass ${index + 1}: ${validation.errors?.join(", ") || "Invalid format"}`,
          );
        }
      });

      if (validSubclasses.length === 0) {
        return {
          success: false,
          message: `No valid subclass definitions found. Errors: ${errors.join("; ")}`,
        };
      }

      const existingSubclasses = this.getCustomSubclasses();
      const updatedSubclasses = [...existingSubclasses];

      validSubclasses.forEach((newSubclass) => {
        const existingIndex = updatedSubclasses.findIndex((sub) => sub.id === newSubclass.id);
        if (existingIndex >= 0) {
          updatedSubclasses[existingIndex] = newSubclass;
        } else {
          updatedSubclasses.push(newSubclass);
        }
      });

      localStorage.setItem(STORAGE_KEYS.customSubclasses, JSON.stringify(updatedSubclasses));

      const message =
        errors.length > 0
          ? `Successfully added/updated ${validSubclasses.length} subclass(es). ${errors.length} invalid entries skipped.`
          : `Successfully added/updated ${validSubclasses.length} subclass(es)`;

      return {
        success: true,
        message,
        itemsAdded: validSubclasses.length,
      };
    } catch (error) {
      return { success: false, message: "Invalid JSON format" };
    }
  }

  private getCustomSubclasses(): SubclassDefinition[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.customSubclasses);
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
        localStorage.setItem(STORAGE_KEYS.customSubclasses, JSON.stringify(validSubclasses));
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
    builtInSchools.forEach(school => {
      schoolMap.set(school.id, school);
    });
    
    // Add/override with custom schools
    customSchools.forEach(school => {
      schoolMap.set(school.id, school);
    });
    
    return Array.from(schoolMap.values());
  }

  public getSpellSchool(schoolId: string): SpellSchoolWithSpells | null {
    const allSchools = this.getAllSpellSchools();
    return allSchools.find((school) => school.id === schoolId) || null;
  }

  public getSpellsBySchool(schoolId: string): SpellAbilityDefinition[] {
    const school = this.getSpellSchool(schoolId);
    if (!school) return [];

    // Get all custom spells that belong to this school
    const customSpells = this.getCustomSpells().filter((spell) => spell.school === schoolId);

    // Merge school's defined spells with custom spells
    return [...school.spells, ...customSpells];
  }

  public getUtilitySpellsForSchool(schoolId: string): SpellAbilityDefinition[] {
    const school = this.getSpellSchool(schoolId);
    if (!school) return [];

    return school.utilitySpells || [];
  }

  public uploadSpellSchools(schoolsJson: string): ContentUploadResult {
    try {
      const data = JSON.parse(schoolsJson);
      const schools = Array.isArray(data) ? data : [data];

      const validSchools: SpellSchoolWithSpells[] = [];
      const errors: string[] = [];

      schools.forEach((school, index) => {
        const validation = ContentValidationService.validateSpellSchool(school);
        if (validation.valid && validation.data) {
          validSchools.push(validation.data);
        } else {
          errors.push(`School ${index + 1}: ${validation.errors?.join(", ") || "Invalid format"}`);
        }
      });

      if (validSchools.length === 0) {
        return {
          success: false,
          message: `No valid spell school definitions found. Errors: ${errors.join("; ")}`,
        };
      }

      const existingSchools = this.getCustomSpellSchools();
      const updatedSchools = [...existingSchools];

      validSchools.forEach((newSchool) => {
        const existingIndex = updatedSchools.findIndex((school) => school.id === newSchool.id);
        if (existingIndex >= 0) {
          updatedSchools[existingIndex] = newSchool;
        } else {
          updatedSchools.push(newSchool);
        }
      });

      localStorage.setItem(STORAGE_KEYS.customSpellSchools, JSON.stringify(updatedSchools));

      const message =
        errors.length > 0
          ? `Successfully added/updated ${validSchools.length} spell school(s). ${errors.length} invalid entries skipped.`
          : `Successfully added/updated ${validSchools.length} spell school(s)`;

      return {
        success: true,
        message,
        itemsAdded: validSchools.length,
      };
    } catch (error) {
      return { success: false, message: "Invalid JSON format" };
    }
  }

  private getCustomSpellSchools(): SpellSchoolWithSpells[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.customSpellSchools);
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
        localStorage.setItem(STORAGE_KEYS.customSpellSchools, JSON.stringify(validSchools));
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

  public uploadAbilities(abilitiesJson: string): ContentUploadResult {
    try {
      const data = JSON.parse(abilitiesJson);
      const abilities = Array.isArray(data) ? data : [data];

      const validAbilities: ActionAbilityDefinition[] = [];
      const errors: string[] = [];

      abilities.forEach((ability, index) => {
        const validation = ContentValidationService.validateActionAbility(ability);
        if (validation.valid && validation.data) {
          validAbilities.push(validation.data);
        } else {
          errors.push(`Ability ${index + 1}: ${validation.errors?.join(", ") || "Invalid format"}`);
        }
      });

      if (validAbilities.length === 0) {
        return {
          success: false,
          message: `No valid ability definitions found. Errors: ${errors.join("; ")}`,
        };
      }

      const existingAbilities = this.getCustomAbilities();
      const updatedAbilities = [...existingAbilities];

      validAbilities.forEach((newAbility) => {
        const existingIndex = updatedAbilities.findIndex((ability) => ability.id === newAbility.id);
        if (existingIndex >= 0) {
          updatedAbilities[existingIndex] = newAbility;
        } else {
          updatedAbilities.push(newAbility);
        }
      });

      localStorage.setItem(STORAGE_KEYS.customAbilities, JSON.stringify(updatedAbilities));

      const message =
        errors.length > 0
          ? `Successfully added/updated ${validAbilities.length} abilit(y/ies). ${errors.length} invalid entries skipped.`
          : `Successfully added/updated ${validAbilities.length} abilit(y/ies)`;

      return {
        success: true,
        message,
        itemsAdded: validAbilities.length,
      };
    } catch (error) {
      return { success: false, message: "Invalid JSON format" };
    }
  }

  private getCustomAbilities(): ActionAbilityDefinition[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.customAbilities);
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
        localStorage.setItem(STORAGE_KEYS.customAbilities, JSON.stringify(validAbilities));
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
    const builtInSpells = builtInSchools.flatMap(school => school.spells);
    const customSpells = this.getCustomSpells();
    return [...builtInSpells, ...customSpells];
  }

  public getSpell(spellId: string): SpellAbilityDefinition | null {
    const allSpells = this.getAllSpells();
    return allSpells.find((spell) => spell.id === spellId) || null;
  }

  public uploadSpells(spellsJson: string): ContentUploadResult {
    try {
      const data = JSON.parse(spellsJson);
      const spells = Array.isArray(data) ? data : [data];

      const validSpells: SpellAbilityDefinition[] = [];
      const errors: string[] = [];

      spells.forEach((spell, index) => {
        const validation = ContentValidationService.validateSpellAbility(spell);
        if (validation.valid && validation.data) {
          validSpells.push(validation.data);
        } else {
          errors.push(`Spell ${index + 1}: ${validation.errors?.join(", ") || "Invalid format"}`);
        }
      });

      if (validSpells.length === 0) {
        return {
          success: false,
          message: `No valid spell definitions found. Errors: ${errors.join("; ")}`,
        };
      }

      const existingSpells = this.getCustomSpells();
      const updatedSpells = [...existingSpells];

      validSpells.forEach((newSpell) => {
        const existingIndex = updatedSpells.findIndex((spell) => spell.id === newSpell.id);
        if (existingIndex >= 0) {
          updatedSpells[existingIndex] = newSpell;
        } else {
          updatedSpells.push(newSpell);
        }
      });

      localStorage.setItem(STORAGE_KEYS.customSpells, JSON.stringify(updatedSpells));

      const message =
        errors.length > 0
          ? `Successfully added/updated ${validSpells.length} spell(s). ${errors.length} invalid entries skipped.`
          : `Successfully added/updated ${validSpells.length} spell(s)`;

      return {
        success: true,
        message,
        itemsAdded: validSpells.length,
      };
    } catch (error) {
      return { success: false, message: "Invalid JSON format" };
    }
  }

  private getCustomSpells(): SpellAbilityDefinition[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.customSpells);
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
        localStorage.setItem(STORAGE_KEYS.customSpells, JSON.stringify(validSpells));
      }

      return validSpells;
    } catch (error) {
      console.warn("Error reading custom spells from storage:", error);
      return [];
    }
  }

  // Item Repository Management
  public getAllItems(): RepositoryItem[] {
    return [
      ...ITEM_REPOSITORY.weapons,
      ...ITEM_REPOSITORY.armor,
      ...ITEM_REPOSITORY.freeform,
      ...ITEM_REPOSITORY.consumables,
      ...ITEM_REPOSITORY.ammunition,
      ...this.getCustomItems(),
    ];
  }

  public uploadItems(itemsJson: string): ContentUploadResult {
    try {
      const data = JSON.parse(itemsJson);
      const content = data as CustomItemContent;

      if (!content.items || !Array.isArray(content.items)) {
        return {
          success: false,
          message: 'Invalid format: expected an object with "items" array property',
        };
      }

      const validItems: RepositoryItem[] = [];
      const errors: string[] = [];

      content.items.forEach((item, index) => {
        // Basic validation for repository items
        if (
          item &&
          typeof item === "object" &&
          item.item &&
          item.item.id &&
          item.item.name &&
          item.item.type &&
          item.category &&
          ["mundane", "magical"].includes(item.category)
        ) {
          validItems.push(item);
        } else {
          errors.push(`Item ${index + 1}: Invalid repository item format`);
        }
      });

      if (validItems.length === 0) {
        return {
          success: false,
          message: `No valid item definitions found. Errors: ${errors.join("; ")}`,
        };
      }

      const existingItems = this.getCustomItems();
      const updatedItems = [...existingItems];

      validItems.forEach((newItem) => {
        const existingIndex = updatedItems.findIndex((item) => item.item.id === newItem.item.id);
        if (existingIndex >= 0) {
          updatedItems[existingIndex] = newItem;
        } else {
          updatedItems.push(newItem);
        }
      });

      localStorage.setItem(STORAGE_KEYS.customItems, JSON.stringify(updatedItems));

      const message =
        errors.length > 0
          ? `Successfully added/updated ${validItems.length} item(s). ${errors.length} invalid entries skipped.`
          : `Successfully added/updated ${validItems.length} item(s)`;

      return {
        success: true,
        message,
        itemsAdded: validItems.length,
      };
    } catch (error) {
      return { success: false, message: "Invalid JSON format" };
    }
  }

  private getCustomItems(): RepositoryItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.customItems);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      // Basic validation for custom items
      const validItems: RepositoryItem[] = [];
      parsed.forEach((item, index) => {
        if (
          item &&
          typeof item === "object" &&
          item.item &&
          item.item.id &&
          item.item.name &&
          item.item.type &&
          item.category &&
          ["mundane", "magical"].includes(item.category)
        ) {
          validItems.push(item);
        } else {
          console.warn(`Invalid custom item found in storage at index ${index}:`, item);
        }
      });

      // If we filtered out invalid items, update localStorage
      if (validItems.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEYS.customItems, JSON.stringify(validItems));
      }

      return validItems;
    } catch (error) {
      console.warn("Error reading custom items from storage:", error);
      return [];
    }
  }

  // Feature Pool Management
  public getFeaturePool(poolId: string): FeaturePool | null {
    return this.featurePoolMap.get(poolId) || null;
  }

  public getAllFeaturePools(): FeaturePool[] {
    return Array.from(this.featurePoolMap.values());
  }

  // Utility Methods
  public clearAllCustomContent(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
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
      [CustomContentType.CLASS_DEFINITION]: customClasses.length,
      [CustomContentType.SUBCLASS_DEFINITION]: this.getCustomSubclasses().length,
      [CustomContentType.SPELL_SCHOOL_DEFINITION]: customSpellSchools.length,
      [CustomContentType.ANCESTRY_DEFINITION]: this.getCustomAncestries().length,
      [CustomContentType.BACKGROUND_DEFINITION]: this.getCustomBackgrounds().length,
      [CustomContentType.ACTION_ABILITY]: this.getCustomAbilities().length,
      [CustomContentType.SPELL_ABILITY]: customSpells.length,
      [CustomContentType.ITEM_REPOSITORY]: this.getAllItems().length,
    };
  }
}
