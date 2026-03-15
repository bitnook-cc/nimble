import { z } from "zod";

import {
  uploadableActionAbilitySchema,
  uploadableAncestrySchema,
  uploadableBackgroundSchema,
  uploadableClassSchema,
  uploadableItemRepositorySchema,
  uploadableSpellAbilitySchema,
  uploadableSpellSchoolSchema,
  uploadableSubclassSchema,
} from "../schemas/uploadable-content";
import { CustomContentType } from "../types/custom-content";

// Registry of supported uploadable schemas for custom import
export const SCHEMA_REGISTRY: Record<CustomContentType, z.ZodSchema> = {
  [CustomContentType.CLASS]: uploadableClassSchema,
  [CustomContentType.SUBCLASS]: uploadableSubclassSchema,
  [CustomContentType.SPELL_SCHOOL]: uploadableSpellSchoolSchema,
  [CustomContentType.ANCESTRY]: uploadableAncestrySchema,
  [CustomContentType.BACKGROUND]: uploadableBackgroundSchema,
  [CustomContentType.ACTION]: uploadableActionAbilitySchema,
  [CustomContentType.SPELL]: uploadableSpellAbilitySchema,
  [CustomContentType.ITEM]: uploadableItemRepositorySchema,
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
