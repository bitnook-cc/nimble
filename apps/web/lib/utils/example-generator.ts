import { JSONSchemaFaker } from "json-schema-faker";
import { z } from "zod";

import { CustomContentType } from "../types/custom-content";
import { SCHEMA_REGISTRY } from "./schema-documentation";
import { ClassDefinition, SubclassDefinition, SpellSchoolDefinition } from "../schemas/class";
import { AncestryDefinition } from "../schemas/ancestry";
import { BackgroundDefinition } from "../schemas/background";
import { ActionAbilityDefinition, SpellAbilityDefinition } from "../schemas/abilities";

// Type mapping for content types to their corresponding data types
type ContentTypeMap = {
  [CustomContentType.CLASS_DEFINITION]: ClassDefinition;
  [CustomContentType.SUBCLASS_DEFINITION]: SubclassDefinition;
  [CustomContentType.SPELL_SCHOOL_DEFINITION]: SpellSchoolDefinition;
  [CustomContentType.ANCESTRY_DEFINITION]: AncestryDefinition;
  [CustomContentType.BACKGROUND_DEFINITION]: BackgroundDefinition;
  [CustomContentType.ACTION_ABILITY]: ActionAbilityDefinition;
  [CustomContentType.SPELL_ABILITY]: SpellAbilityDefinition;
  [CustomContentType.ITEM_REPOSITORY]: { items: Array<{ item: Record<string, unknown>; category: string; rarity?: string }> };
};

type ContentData = ContentTypeMap[CustomContentType];

/**
 * Generate example JSON for different content types
 */
export class ExampleGenerator {
  /**
   * Generate an example JSON object for a given content type
   */
  static generateExample<T extends CustomContentType>(contentType: T): ContentTypeMap[T] | null {
    try {
      // Get the Zod schema for this content type
      const zodSchema = SCHEMA_REGISTRY[contentType];
      if (!zodSchema) {
        throw new Error(`No schema found for content type: ${contentType}`);
      }

      // Convert Zod schema to JSON Schema
      const jsonSchema = z.toJSONSchema(zodSchema);

      // Generate fake data using json-schema-faker
      return JSONSchemaFaker.generate(jsonSchema as Parameters<typeof JSONSchemaFaker.generate>[0]) as ContentTypeMap[T];
    } catch (error) {
      console.warn(`Failed to generate example for ${contentType}:`, error);
      return null;
    }
  }

  /**
   * Generate a formatted JSON string for a given content type
   */
  static generateExampleJSON(contentType: CustomContentType): string | null {
    const example = this.generateExample(contentType);
    if (!example) return null;

    return JSON.stringify(example, null, 2);
  }

  /**
   * Generate examples for all content types
   */
  static generateAllExamples(): Record<CustomContentType, ContentData | null> {
    const examples: Partial<Record<CustomContentType, ContentData | null>> = {};

    Object.values(CustomContentType).forEach((contentType) => {
      examples[contentType] = this.generateExample(contentType);
    });

    return examples as Record<CustomContentType, ContentData | null>;
  }
}
