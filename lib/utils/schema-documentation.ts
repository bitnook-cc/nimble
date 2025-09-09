import { z } from "zod";

import { ActionAbilitySchema, SpellAbilitySchema } from "../schemas/abilities";
import { AncestryDefinitionSchema } from "../schemas/ancestry";
import { BackgroundDefinitionSchema } from "../schemas/background";
import {
  ClassDefinitionSchema,
  SpellSchoolDefinitionSchema,
  SubclassDefinitionSchema,
} from "../schemas/class";
import { CustomContentType } from "../types/custom-content";

// Item Repository Schema
const ItemRepositorySchema = z.object({
  items: z.array(
    z.object({
      item: z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(["weapon", "armor", "freeform", "consumable", "ammunition"]),
        size: z.number(),
        description: z.string().optional(),
        damage: z.string().optional(),
        armor: z.number().optional(),
        count: z.number().optional(),
        properties: z.array(z.string()).optional(),
      }),
      category: z.enum(["mundane", "magical"]),
      rarity: z.enum(["common", "uncommon", "rare", "very-rare", "legendary"]).optional(),
    }),
  ),
});

// Registry of supported schemas for custom import
export const SCHEMA_REGISTRY: Record<CustomContentType, z.ZodSchema> = {
  [CustomContentType.CLASS_DEFINITION]: ClassDefinitionSchema,
  [CustomContentType.SUBCLASS_DEFINITION]: SubclassDefinitionSchema,
  [CustomContentType.SPELL_SCHOOL_DEFINITION]: SpellSchoolDefinitionSchema,
  [CustomContentType.ANCESTRY_DEFINITION]: AncestryDefinitionSchema,
  [CustomContentType.BACKGROUND_DEFINITION]: BackgroundDefinitionSchema,
  [CustomContentType.ACTION_ABILITY]: ActionAbilitySchema,
  [CustomContentType.SPELL_ABILITY]: SpellAbilitySchema,
  [CustomContentType.ITEM_REPOSITORY]: ItemRepositorySchema,
};

// Generate JSON schema documentation with metadata from Zod schemas
export function getSchemaDocumentation(contentType: CustomContentType) {
  const schema = SCHEMA_REGISTRY[contentType];
  return z.toJSONSchema(schema);
}

// Get all schemas with their JSON schema documentation
export function getAllSchemaDocumentation() {
  const documentation: Record<CustomContentType, any> = {} as any;

  Object.values(CustomContentType).forEach((contentType) => {
    documentation[contentType] = getSchemaDocumentation(contentType);
  });

  return documentation;
}

// Get schema for a specific content type
export function getSchema(contentType: CustomContentType) {
  return SCHEMA_REGISTRY[contentType];
}
