import { PDFDocument, PDFForm } from "pdf-lib";

import { Character, SaveAdvantageMap, SaveAdvantageType } from "../schemas/character";
import { ContentRepositoryService } from "./content-repository-service";
import { ICharacterService } from "./interfaces";
import {
  getAncestryService,
  getBackgroundService,
  getCharacterService,
  getClassService,
} from "./service-factory";

export interface PDFExportOptions {
  template: "full-page" | "half-page" | "detailed-page";
  editable: boolean;
  includeFullInventory: boolean;
}

export class PDFExportService {
  private static instance: PDFExportService;

  static getInstance(): PDFExportService {
    if (!PDFExportService.instance) {
      PDFExportService.instance = new PDFExportService();
    }
    return PDFExportService.instance;
  }

  /**
   * Helper to format modifiers with +/- signs
   */
  private formatModifier(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  /**
   * Download blob as file
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export character sheet as PDF using form-fillable template
   */
  async exportCharacterToPDF(
    character: Character,
    characterService: ICharacterService,
    options: PDFExportOptions = {
      template: "full-page",
      editable: true,
      includeFullInventory: false,
    },
  ): Promise<void> {
    try {
      // Load the template PDF based on selected template
      let templateFile: string;
      switch (options.template) {
        case "half-page":
          templateFile = "/character-sheet-half-page.pdf";
          break;
        case "detailed-page":
          templateFile = "/character-sheet-detailed-page.pdf";
          break;
        default:
          templateFile = "/character-sheet-full-page.pdf";
      }

      const response = await fetch(templateFile);
      if (!response.ok) {
        throw new Error(`Could not load PDF template: ${templateFile}`);
      }

      const templateBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();

      // Get character data
      const contentRepository = ContentRepositoryService.getInstance();
      const characterClass = contentRepository.getClassDefinition(character.classId);
      const subclassId = characterService.getSubclassId();
      const subclass = subclassId ? contentRepository.getSubclassDefinition(subclassId) : null;
      const ancestry = contentRepository.getAncestryDefinition(character.ancestryId);
      const background = contentRepository.getBackgroundDefinition(character.backgroundId);
      const attributes = characterService.getAttributes();
      const skills = characterService.getSkills();
      const initiative = characterService.getInitiative();
      const hitDice = characterService.getHitDice();
      const armorValue = characterService.getArmorValue();
      const speed = characterService.getSpeed();

      // Fill form fields using exact field names

      // Character Name - using exact field name
      this.setTextField(form, "Character Name", character.name);

      // Ancestry, Class, Level - using combined field
      const ancestryClassLevel = `${ancestry?.name || character.ancestryId}, ${characterClass?.name || character.classId}, Level ${character.level}`;
      this.setTextField(form, "Ancestry, Class, Level", ancestryClassLevel);

      // Character Features - populate the body columns
      this.populateFeatureColumns(form, character, options);

      // Attributes - using exact field names with centered alignment
      this.setTextField(form, "STR", attributes.strength.toString(), true);
      this.setTextField(form, "DEX", attributes.dexterity.toString(), true);
      this.setTextField(form, "INT", attributes.intelligence.toString(), true);
      this.setTextField(form, "WIL", attributes.will.toString(), true);

      // Save Advantages/Disadvantages - using checkboxes
      this.setSaveAdvantages(form, character.saveAdvantages);

      // Hit Points - using exact field names with centered alignment
      this.setTextField(form, "HP - Max", character.hitPoints.max.toString(), true);

      // Armor Class - using exact field name with centered alignment
      this.setTextField(form, "Armor", armorValue.toString(), true);

      // Initiative - using exact field name with centered alignment
      this.setTextField(form, "Initiative", this.formatModifier(initiative.modifier), true);

      // Speed - using exact field name with formatted text
      this.setTextField(form, "Height, Weight", `Speed: ${speed}`);
      this.setTextField(form, "Speed", `${speed}`, true);

      // Hit Dice - using exact field names with centered alignment
      this.setTextField(form, "Hit Dice Total", hitDice.max.toString(), true);
      this.setTextField(form, "Hit Dice - Max", hitDice.max.toString(), true);

      this.setTextField(form, "Hit Die", "d" + hitDice.size.toString(), true);

      // Skills - using exact field names (capitalized) with associated attribute values
      const skillMappings = [
        { key: "arcana", fieldName: "Arcana" },
        { key: "examination", fieldName: "Examination" },
        { key: "finesse", fieldName: "Finesse" },
        { key: "influence", fieldName: "Influence" },
        { key: "insight", fieldName: "Insight" },
        { key: "lore", fieldName: "Lore" },
        { key: "might", fieldName: "Might" },
        { key: "naturecraft", fieldName: "Naturecraft" },
        { key: "perception", fieldName: "Perception" },
        { key: "stealth", fieldName: "Stealth" },
      ];

      skillMappings.forEach(({ key, fieldName }) => {
        const skill = skills[key];
        if (skill) {
          const associatedAttributeValue = attributes[skill.associatedAttribute];
          const totalModifier = skill.modifier + associatedAttributeValue;
          this.setTextField(form, fieldName, this.formatModifier(totalModifier), true);
        }
      });

      // Flatten form if not editable
      if (!options.editable) {
        form.flatten();
      }

      // Save and download the PDF
      const pdfBytes = await pdfDoc.save();
      const arrayBuffer = new Uint8Array(pdfBytes).buffer;
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });

      // Create filename with template suffix
      let templateSuffix: string;
      switch (options.template) {
        case "half-page":
          templateSuffix = "_half";
          break;
        case "detailed-page":
          templateSuffix = "_detailed";
          break;
        default:
          templateSuffix = "_full";
      }
      const editableSuffix = options.editable ? "_editable" : "_flattened";
      const filename = `${character.name.replace(/[^a-zA-Z0-9]/g, "_")}_character_sheet${templateSuffix}${editableSuffix}.pdf`;

      this.downloadFile(blob, filename);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      throw error;
    }
  }

  /**
   * Helper to set a text field with exact field name
   */
  private setTextField(
    form: PDFForm,
    fieldName: string,
    value: string,
    centered: boolean = false,
  ): void {
    try {
      const field = form.getTextField(fieldName);
      if (field) {
        field.setText(value);
        if (centered) {
          field.setAlignment(1); // 0 = left, 1 = center, 2 = right
        }
      } else {
        // Only log in development mode
        if (process.env.NODE_ENV === "development") {
          console.error(`Field "${fieldName}" exists but is null`);
        }
      }
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === "development") {
        console.error(`Could not find field "${fieldName}" (value: ${value})`);
      }
    }
  }

  /**
   * Helper to set a checkbox field
   */
  private setCheckbox(form: PDFForm, fieldName: string, checked: boolean): void {
    try {
      const field = form.getCheckBox(fieldName);
      if (field) {
        if (checked) {
          field.check();
        } else {
          field.uncheck();
        }
      } else {
        // Only log in development mode
        if (process.env.NODE_ENV === "development") {
          console.error(`Checkbox field "${fieldName}" exists but is null`);
        }
      }
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === "development") {
        console.error(`Could not find checkbox "${fieldName}"`);
      }
    }
  }

  /**
   * Set save advantage/disadvantage checkboxes
   */
  private setSaveAdvantages(form: PDFForm, saveAdvantages: SaveAdvantageMap): void {
    const setSaveAdvantage = (formName: string, type?: SaveAdvantageType) => {
      const advantage = type === "advantage";
      const disadvantage = type === "disadvantage";

      this.setCheckbox(form, `${formName} Adv`, advantage);
      this.setCheckbox(form, `${formName} Dis`, disadvantage);
    };

    setSaveAdvantage("STR", saveAdvantages?.strength);
    setSaveAdvantage("DEX", saveAdvantages?.dexterity);
    setSaveAdvantage("INT", saveAdvantages?.intelligence);
    setSaveAdvantage("WIL", saveAdvantages?.will);
  }

  /**
   * Populate the body columns with character features (2 or 3 columns based on template)
   */
  private populateFeatureColumns(
    form: PDFForm,
    character: Character,
    options: PDFExportOptions,
  ): void {
    const contentRepository = ContentRepositoryService.getInstance();
    const classService = getClassService();
    const ancestryService = getAncestryService();
    const backgroundService = getBackgroundService();
    const characterService = getCharacterService();

    const allFeatures: string[] = [];

    // Get class features
    try {
      const classFeatures = classService.getExpectedFeaturesForCharacter(character);
      classFeatures.forEach((feature) => {
        allFeatures.push(`${feature.name}: ${feature.description || "Class feature"}`);
      });
    } catch (error) {
      console.error("Could not get class features:", error);
    }

    // Get ancestry features
    try {
      const ancestryFeatures = ancestryService.getExpectedFeaturesForCharacter(character);
      ancestryFeatures.forEach((feature) => {
        allFeatures.push(`${feature.name}: ${feature.description || "Ancestry feature"}`);
      });
    } catch (error) {
      console.error("Could not get ancestry features:", error);
    }

    // Get background features
    try {
      const backgroundFeatures = backgroundService.getExpectedFeaturesForCharacter(character);
      backgroundFeatures.forEach((feature) => {
        allFeatures.push(`${feature.name}: ${feature.description || "Background feature"}`);
      });
    } catch (error) {
      console.error("Could not get background features:", error);
    }

    // Add character abilities (non-spell abilities)
    characterService.getAbilities().forEach((ability) => {
      if (ability.type === "action") {
        allFeatures.push(`${ability.name}: ${ability.description || "Character ability"}`);
      }
    });

    // Add inventory items based on options
    this.addInventoryToFeatures(character, options, allFeatures);

    // Distribute features across columns (2 for half-page, 3 for full-page and detailed-page)
    const columnCount = options.template === "half-page" ? 2 : 3;
    const featuresPerColumn = Math.ceil(allFeatures.length / columnCount);

    for (let col = 1; col <= columnCount; col++) {
      const startIndex = (col - 1) * featuresPerColumn;
      const endIndex = startIndex + featuresPerColumn;
      const columnFeatures = allFeatures.slice(startIndex, endIndex);

      const columnText = columnFeatures.join("\n\n");
      this.setTextField(form, `Body - Column ${col}`, columnText);
    }
  }

  /**
   * Add inventory items to the features list based on export options
   */
  private addInventoryToFeatures(
    character: Character,
    options: PDFExportOptions,
    allFeatures: string[],
  ): void {
    const items = character.inventory.items;

    allFeatures.push("=== INVENTORY ===");

    if (options.includeFullInventory) {
      // Include all items when full inventory is enabled
      items.forEach((item) => {
        const itemDescription = this.formatItemDescription(item);
        if (itemDescription) {
          allFeatures.push(itemDescription);
        }
      });
    } else {
      // Only include equipped weapons and armor with enhanced descriptions
      items
        .filter((item) => (item.type === "weapon" || item.type === "armor") && item.equipped)
        .forEach((item) => {
          const itemDescription = this.formatItemDescription(item);
          if (itemDescription) {
            allFeatures.push(itemDescription);
          }
        });
    }
  }

  /**
   * Format an item description with all relevant details
   */
  private formatItemDescription(item: any): string | null {
    const parts: string[] = [item.name];

    if (item.type === "weapon") {
      // Add damage formula
      if (item.damage) {
        parts.push(`Damage: ${item.damage}`);
      }

      // Add damage type
      if (item.damageType) {
        parts.push(`Type: ${item.damageType}`);
      }

      // Add vicious property
      if (item.vicious) {
        parts.push("Vicious");
      }

      // Add weapon properties
      if (item.properties && item.properties.length > 0) {
        parts.push(`Properties: ${item.properties.join(", ")}`);
      }
    } else if (item.type === "armor") {
      // Add armor value
      if (typeof item.armor === "number") {
        parts.push(`Armor: +${item.armor}`);
      }

      // Add max dex bonus
      if (typeof item.maxDexBonus === "number") {
        parts.push(`Max Dex: +${item.maxDexBonus}`);
      }

      // Add armor type
      if (item.isMainArmor) {
        parts.push("Main Armor");
      } else {
        parts.push("Supplementary Armor");
      }

      // Add armor properties
      if (item.properties && item.properties.length > 0) {
        parts.push(`Properties: ${item.properties.join(", ")}`);
      }
    } else if (item.type === "consumable" || item.type === "ammunition") {
      // Add count for consumables and ammunition
      if (typeof item.count === "number") {
        parts.push(`Count: ${item.count}`);
      }
    }

    // Add equipped status for full inventory
    if (item.type === "weapon" || item.type === "armor") {
      if (item.equipped) {
        parts.push("(Equipped)");
      } else {
        parts.push("(Unequipped)");
      }
    }

    // Add description if it exists
    if (item.description) {
      parts.push(item.description);
    }

    // Return formatted string if we have more than just the name, or if there's a description
    if (parts.length > 1 || item.description) {
      return parts.join(" - ");
    }

    // For freeform items, include even if just name
    if (item.type === "freeform") {
      return item.name;
    }

    return null;
  }
}

export const pdfExportService = PDFExportService.getInstance();
