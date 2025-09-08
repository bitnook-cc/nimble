import { AttributeName, CharacterFeature, HitDieSize, SaveAdvantageMap } from "./character";

// Import and re-export types from schemas
import type {
  ClassFeature as SchemaClassFeature,
  FeaturePool,
  ArmorProficiency,
  WeaponProficiency,
  ClassDefinition,
  SubclassDefinition,
} from "../schemas/class";

export type {
  FeaturePool,
  ArmorProficiency,
  WeaponProficiency,
  ClassDefinition,
  SubclassDefinition,
};

// Extend ClassFeature to match CharacterFeature interface
// Note: SchemaClassFeature already has all the same properties as CharacterFeature
export type ClassFeature = SchemaClassFeature;

// Helper to check if a feature has a specific effect type
export function hasEffectType(feature: ClassFeature, effectType: string): boolean {
  return feature.effects.some((effect) => effect.type === effectType);
}
