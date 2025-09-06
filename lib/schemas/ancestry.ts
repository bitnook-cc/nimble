import { z } from "zod";

import { FeatureEffectSchema } from "./feature-effects";

// Size categories for different ancestries
const SizeCategorySchema = z.enum(["tiny", "small", "medium", "large", "huge", "gargantuan"]);

// Ancestry rarity types
const AncestryRaritySchema = z.enum(["common", "exotic"]);

// Damage/condition resistances
const ResistanceSchema = z
  .object({
    type: z
      .enum(["damage", "condition"])
      .meta({ title: "Resistance Type", description: "Type of resistance (damage or condition)" }),
    name: z
      .string()
      .min(1)
      .meta({ title: "Name", description: "Name of what is resisted (e.g., fire, poison, charm)" }),
    description: z
      .string()
      .optional()
      .meta({ title: "Description", description: "Optional description of the resistance" }),
  })
  .meta({ title: "Resistance", description: "Damage or condition resistance" });

// Ancestry Feature Schema - now uses effects array
export const AncestryFeatureSchema = z
  .object({
    id: z.string().min(1).meta({ title: "ID", description: "Unique identifier for the feature" }),
    name: z.string().min(1).meta({ title: "Name", description: "Feature name" }),
    description: z
      .string()
      .min(1)
      .meta({ title: "Description", description: "Feature description" }),
    effects: z
      .array(FeatureEffectSchema)
      .meta({ title: "Effects", description: "Array of effects this feature provides" }),
  })
  .meta({
    title: "Ancestry Feature",
    description: "A feature that provides effects to characters from their ancestry",
  });

// Name generator configuration schemas
const NameGeneratorConfigSchema = z
  .object({
    syllables: z
      .object({
        prefixes: z
          .array(z.string().min(1))
          .meta({ title: "Prefixes", description: "Syllable prefixes for name generation" }),
        middle: z
          .array(z.string().min(1))
          .meta({ title: "Middle", description: "Middle syllables for name generation" }),
        suffixes: z
          .array(z.string().min(1))
          .meta({ title: "Suffixes", description: "Syllable suffixes for name generation" }),
      })
      .meta({ title: "Syllables", description: "Syllable collections for name generation" }),
    patterns: z
      .array(z.string().min(1))
      .meta({
        title: "Patterns",
        description: "Name generation patterns (P=prefix, M=middle, S=suffix)",
      }),
    constraints: z
      .object({
        minLength: z
          .number()
          .int()
          .min(1)
          .meta({ title: "Min Length", description: "Minimum name length" }),
        maxLength: z
          .number()
          .int()
          .min(1)
          .meta({ title: "Max Length", description: "Maximum name length" }),
        syllableCount: z
          .object({
            min: z
              .number()
              .int()
              .min(1)
              .meta({ title: "Min Syllables", description: "Minimum syllable count" }),
            max: z
              .number()
              .int()
              .min(1)
              .meta({ title: "Max Syllables", description: "Maximum syllable count" }),
          })
          .meta({ title: "Syllable Count", description: "Syllable count constraints" }),
      })
      .meta({ title: "Constraints", description: "Name generation constraints" }),
  })
  .meta({ title: "Name Generator Config", description: "Configuration for generating names" });

const NameConfigSchema = z
  .object({
    male: NameGeneratorConfigSchema.optional().meta({
      title: "Male Names",
      description: "Configuration for male names",
    }),
    female: NameGeneratorConfigSchema.optional().meta({
      title: "Female Names",
      description: "Configuration for female names",
    }),
    surnames: NameGeneratorConfigSchema.optional().meta({
      title: "Surnames",
      description: "Configuration for surnames",
    }),
    unisex: NameGeneratorConfigSchema.optional().meta({
      title: "Unisex Names",
      description: "Configuration for unisex names",
    }),
  })
  .meta({ title: "Name Config", description: "Name generation configuration" });

export const AncestryDefinitionSchema = z
  .object({
    id: z.string().min(1).meta({ title: "ID", description: "Unique identifier for the ancestry" }),
    name: z.string().min(1).meta({ title: "Name", description: "Display name of the ancestry" }),
    description: z
      .string()
      .min(1)
      .meta({ title: "Description", description: "Detailed description of the ancestry" }),
    size: SizeCategorySchema.meta({ title: "Size", description: "Default size category" }),
    rarity: AncestryRaritySchema.meta({
      title: "Rarity",
      description: "Common or exotic ancestry",
    }),
    features: z
      .array(AncestryFeatureSchema)
      .meta({ title: "Features", description: "All features provided by this ancestry" }),
    nameConfig: NameConfigSchema.optional().meta({
      title: "Name Config",
      description: "Optional name generation configuration",
    }),
  })
  .meta({
    title: "Ancestry Definition",
    description: "Character ancestry definition with features and traits",
  });

export const AncestryTraitSchema = z
  .object({
    ancestryId: z
      .string()
      .min(1)
      .meta({ title: "Ancestry ID", description: "ID of the character's ancestry" }),
    grantedFeatures: z
      .array(z.string())
      .meta({ title: "Granted Features", description: "IDs of ancestry features already granted" }),
  })
  .meta({ title: "Ancestry Trait", description: "Character ancestry reference" });

// Export individual schemas for specific use cases
export {
  SizeCategorySchema,
  AncestryRaritySchema,
  ResistanceSchema,
  NameConfigSchema,
  NameGeneratorConfigSchema,
};
