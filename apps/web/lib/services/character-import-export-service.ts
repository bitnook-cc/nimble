import { type Character, characterSchema } from "../schemas/character";
import type { ICharacterStorage } from "./interfaces";
import { MigrationService } from "./migration-service";
import { getCharacterStorage } from "./service-factory";

export interface ImportResult {
  success: boolean;
  character?: Character;
  error?: string;
  needsConfirmation?: boolean;
  existingCharacter?: Character;
}

export class CharacterImportExportService {
  private static instance: CharacterImportExportService;
  private migrationService: MigrationService;
  private characterStorage: ICharacterStorage;

  private constructor() {
    this.migrationService = MigrationService.getInstance();
    this.characterStorage = getCharacterStorage();
  }

  public static getInstance(): CharacterImportExportService {
    if (!CharacterImportExportService.instance) {
      CharacterImportExportService.instance = new CharacterImportExportService();
    }
    return CharacterImportExportService.instance;
  }

  /**
   * Import a character from JSON string
   */
  async importCharacter(jsonString: string, overwriteExisting = false): Promise<ImportResult> {
    try {
      // Parse JSON
      let characterData: unknown;
      try {
        characterData = JSON.parse(jsonString);
      } catch {
        return {
          success: false,
          error: "Invalid JSON format. Please check your file and try again.",
        };
      }

      // Apply migrations first
      try {
        characterData = await this.migrationService.migrateCharacter(characterData);
      } catch (error) {
        return {
          success: false,
          error: `Migration failed: ${error instanceof Error ? error.message : "Unknown migration error"}`,
        };
      }

      // Validate against schema
      const validationResult = characterSchema.safeParse(characterData);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        return {
          success: false,
          error: `Character validation failed: ${errorMessages}`,
        };
      }

      const character = validationResult.data;

      // Check for existing character with same ID
      const existingCharacter = await this.characterStorage.getCharacter(character.id);
      if (existingCharacter && !overwriteExisting) {
        return {
          success: false,
          needsConfirmation: true,
          character,
          existingCharacter,
          error: `A character with ID "${character.id}" already exists.`,
        };
      }

      // Save the character (use updateCharacter for both create and update)
      await this.characterStorage.updateCharacter(character);

      return {
        success: true,
        character,
      };
    } catch (error) {
      return {
        success: false,
        error: `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Export a character to downloadable JSON file
   */
  exportCharacter(character: Character): void {
    try {
      // Create clean JSON without any potential circular references
      const exportData = {
        ...character,
        // Convert Maps to Objects for JSON serialization
        _resourceValues: Object.fromEntries(character._resourceValues),
        _abilityUses: Object.fromEntries(character._abilityUses),
        // Timestamps are already numbers (Unix milliseconds), no conversion needed
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = this.generateFileName(character);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Generate a safe filename for character export
   */
  private generateFileName(character: Character): string {
    // Remove special characters and replace spaces with dashes
    const safeName = character.name
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();

    return `${safeName}.json`;
  }

  /**
   * Check if a character with the given ID already exists
   */
  async checkCharacterExists(characterId: string): Promise<boolean> {
    try {
      const existing = await this.characterStorage.getCharacter(characterId);
      return existing !== null;
    } catch {
      return false;
    }
  }
}

export const characterImportExportService = CharacterImportExportService.getInstance();
