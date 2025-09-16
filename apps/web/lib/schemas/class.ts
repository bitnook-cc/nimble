import { z } from "zod";

import { SpellAbilitySchema } from "./abilities";
import { ClassFeatureSchema } from "./features";

// Armor proficiency schemas
const ArmorProficiencySchema = z.union([
  z.object({ type: z.literal("cloth") }),
  z.object({ type: z.literal("leather") }),
  z.object({ type: z.literal("mail") }),
  z.object({ type: z.literal("plate") }),
  z.object({ type: z.literal("shields") }),
  z.object({
    type: z.literal("freeform"),
    name: z.string().min(1),
  }),
]);

// Weapon proficiency schemas
const WeaponProficiencySchema = z.union([
  z.object({ type: z.literal("strength_weapons") }),
  z.object({ type: z.literal("dexterity_weapons") }),
  z.object({
    type: z.literal("freeform"),
    name: z.string().min(1),
  }),
]);

const FeaturePoolSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  features: z.array(ClassFeatureSchema),
});

// Main schemas
export const ClassDefinitionSchema = z
  .object({
    id: z.string().min(1).meta({ title: "ID", description: "Unique identifier for the class" }),
    name: z.string().min(1).meta({ title: "Name", description: "Display name of the class" }),
    description: z
      .string()
      .min(1)
      .meta({ title: "Description", description: "Detailed description of the class" }),
    hitDieSize: z
      .union([z.literal(4), z.literal(6), z.literal(8), z.literal(10), z.literal(12)])
      .meta({
        title: "Hit Die Size",
        description: "Hit die size for this class (d4, d6, d8, d10, d12, integer)",
      }),
    keyAttributes: z
      .array(z.enum(["strength", "dexterity", "intelligence", "will"]))
      .meta({ title: "Key Attributes", description: "Primary attributes for this class" }),
    startingHP: z
      .number()
      .int()
      .min(1)
      .meta({ title: "Starting HP", description: "Base hit points at level 1 (integer)" }),
    armorProficiencies: z
      .array(ArmorProficiencySchema)
      .meta({ title: "Armor Proficiencies", description: "Types of armor this class can use" }),
    weaponProficiencies: z
      .array(WeaponProficiencySchema)
      .meta({ title: "Weapon Proficiencies", description: "Types of weapons this class can use" }),
    saveAdvantages: z
      .object({
        strength: z
          .enum(["advantage", "disadvantage", "normal"])
          .optional()
          .meta({ title: "Strength Saves", description: "Saving throw modifier for strength" }),
        dexterity: z
          .enum(["advantage", "disadvantage", "normal"])
          .optional()
          .meta({ title: "Dexterity Saves", description: "Saving throw modifier for dexterity" }),
        intelligence: z.enum(["advantage", "disadvantage", "normal"]).optional().meta({
          title: "Intelligence Saves",
          description: "Saving throw modifier for intelligence",
        }),
        will: z
          .enum(["advantage", "disadvantage", "normal"])
          .optional()
          .meta({ title: "Will Saves", description: "Saving throw modifier for will" }),
      })
      .meta({ title: "Save Advantages", description: "Saving throw advantages/disadvantages" }),
    startingEquipment: z.array(z.string()).meta({
      title: "Starting Equipment",
      description: "Array of repository item IDs for starting equipment",
    }),
    features: z
      .array(ClassFeatureSchema)
      .meta({ title: "Features", description: "Array of class features by level" }),
    featurePools: z
      .array(FeaturePoolSchema)
      .optional()
      .meta({ title: "Feature Pools", description: "Pools of features for player selection" }),
    subclasses: z
      .array(
        z.object({
          id: z
            .string()
            .min(1)
            .meta({ title: "ID", description: "Unique identifier for the subclass" }),
          name: z
            .string()
            .min(1)
            .meta({ title: "Name", description: "Display name of the subclass" }),
          description: z
            .string()
            .min(1)
            .meta({ title: "Description", description: "Detailed description of the subclass" }),
          parentClassId: z
            .string()
            .min(1)
            .meta({ title: "Parent Class ID", description: "ID of the parent class" }),
          features: z
            .array(ClassFeatureSchema)
            .meta({ title: "Features", description: "Array of subclass features by level" }),
        }),
      )
      .optional()
      .meta({ title: "Subclasses", description: "Available subclasses for this class" }),
  })
  .meta({
    title: "Class Definition",
    description: "Character class definition with features, proficiencies, and progression",
  });

export const SubclassDefinitionSchema = z
  .object({
    id: z.string().min(1).meta({ title: "ID", description: "Unique identifier for the subclass" }),
    name: z.string().min(1).meta({ title: "Name", description: "Display name of the subclass" }),
    description: z
      .string()
      .min(1)
      .meta({ title: "Description", description: "Detailed description of the subclass" }),
    parentClassId: z
      .string()
      .min(1)
      .meta({ title: "Parent Class ID", description: "ID of the parent class" }),
    features: z
      .array(ClassFeatureSchema)
      .meta({ title: "Features", description: "Array of subclass features by level" }),
  })
  .meta({ title: "Subclass Definition", description: "Character subclass specialization" });

export const SpellSchoolDefinitionSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .meta({ title: "ID", description: "Unique identifier for the spell school" }),
    name: z
      .string()
      .min(1)
      .meta({ title: "Name", description: "Display name of the spell school" }),
    description: z
      .string()
      .min(1)
      .meta({ title: "Description", description: "Description of the school's magical focus" }),
    color: z
      .string()
      .min(1)
      .meta({ title: "Color", description: "Tailwind color classes for the school" }),
    icon: z.string().min(1).meta({ title: "Icon", description: "Icon identifier for the school" }),
    spells: z.array(SpellAbilitySchema).meta({
      title: "Spells",
      description: "Array of all spells in this school (both combat and utility)",
    }),
  })
  .meta({
    title: "Spell School Definition",
    description: "School of magic with associated spells",
  });

// Export inferred types
export type ArmorProficiency = z.infer<typeof ArmorProficiencySchema>;
export type WeaponProficiency = z.infer<typeof WeaponProficiencySchema>;
export type FeaturePool = z.infer<typeof FeaturePoolSchema>;
export type ClassDefinition = z.infer<typeof ClassDefinitionSchema>;
export type SubclassDefinition = z.infer<typeof SubclassDefinitionSchema>;
export type SpellSchoolDefinition = z.infer<typeof SpellSchoolDefinitionSchema>;
