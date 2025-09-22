import { z } from "zod";

import { CustomContentType } from "@/lib/types/custom-content";

import { ActionAbilitySchema, SpellAbilitySchema } from "./abilities";
import { AncestryDefinitionSchema } from "./ancestry";
import { BackgroundDefinitionSchema } from "./background";
import { ClassDefinitionSchema } from "./class";
import { SubclassDefinitionSchema } from "./class";
import { SpellSchoolDefinitionSchema } from "./class";
import { repositoryItemSchema } from "./inventory";

// Base uploadable wrapper schema
const uploadableBaseSchema = z.object({
  contentType: z.enum(CustomContentType),
});

// Individual uploadable schemas that include contentType
export const uploadableClassSchema = uploadableBaseSchema.extend({
  contentType: z.literal(CustomContentType.CLASS),
  data: ClassDefinitionSchema,
});

export const uploadableSubclassSchema = uploadableBaseSchema.extend({
  contentType: z.literal(CustomContentType.SUBCLASS),
  data: SubclassDefinitionSchema,
});

export const uploadableSpellSchoolSchema = uploadableBaseSchema.extend({
  contentType: z.literal(CustomContentType.SPELL_SCHOOL),
  data: SpellSchoolDefinitionSchema,
});

export const uploadableAncestrySchema = uploadableBaseSchema.extend({
  contentType: z.literal(CustomContentType.ANCESTRY),
  data: AncestryDefinitionSchema,
});

export const uploadableBackgroundSchema = uploadableBaseSchema.extend({
  contentType: z.literal(CustomContentType.BACKGROUND),
  data: BackgroundDefinitionSchema,
});

export const uploadableActionAbilitySchema = uploadableBaseSchema.extend({
  contentType: z.literal(CustomContentType.ACTION),
  data: ActionAbilitySchema,
});

export const uploadableSpellAbilitySchema = uploadableBaseSchema.extend({
  contentType: z.literal(CustomContentType.SPELL),
  data: SpellAbilitySchema,
});

// For item repositories, we expect an array of items
export const uploadableItemRepositorySchema = uploadableBaseSchema.extend({
  contentType: z.literal(CustomContentType.ITEM),
  data: z.object({
    items: z.array(repositoryItemSchema),
  }),
});

// Union type for all uploadable content
export const uploadableContentSchema = z.discriminatedUnion("contentType", [
  uploadableClassSchema,
  uploadableSubclassSchema,
  uploadableSpellSchoolSchema,
  uploadableAncestrySchema,
  uploadableBackgroundSchema,
  uploadableActionAbilitySchema,
  uploadableSpellAbilitySchema,
  uploadableItemRepositorySchema,
]);

// Type exports
export type UploadableClass = z.infer<typeof uploadableClassSchema>;
export type UploadableSubclass = z.infer<typeof uploadableSubclassSchema>;
export type UploadableSpellSchool = z.infer<typeof uploadableSpellSchoolSchema>;
export type UploadableAncestry = z.infer<typeof uploadableAncestrySchema>;
export type UploadableBackground = z.infer<typeof uploadableBackgroundSchema>;
export type UploadableActionAbility = z.infer<typeof uploadableActionAbilitySchema>;
export type UploadableSpellAbility = z.infer<typeof uploadableSpellAbilitySchema>;
export type UploadableItemRepository = z.infer<typeof uploadableItemRepositorySchema>;
export type UploadableContent = z.infer<typeof uploadableContentSchema>;
