import { JSONSchemaFaker } from "json-schema-faker";
import { z } from "zod";

import { CustomContentType } from "../types/custom-content";
import { SCHEMA_REGISTRY } from "./schema-documentation";

/**
 * Generate example JSON for different content types
 */
export class ExampleGenerator {
  /**
   * Generate an example JSON object for a given content type
   */
  static generateExample(contentType: CustomContentType): any {
    try {
      // Get the Zod schema for this content type
      const zodSchema = SCHEMA_REGISTRY[contentType];
      if (!zodSchema) {
        throw new Error(`No schema found for content type: ${contentType}`);
      }

      // Convert Zod schema to JSON Schema
      const jsonSchema = z.toJSONSchema(zodSchema);

      // Generate fake data using json-schema-faker
      return JSONSchemaFaker.generate(jsonSchema as any);
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
  static generateAllExamples(): Record<CustomContentType, any> {
    const examples: Partial<Record<CustomContentType, any>> = {};

    Object.values(CustomContentType).forEach((contentType) => {
      examples[contentType] = this.generateExample(contentType);
    });

    return examples as Record<CustomContentType, any>;
  }
}
