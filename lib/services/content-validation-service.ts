import { z } from "zod";

import { AncestryDefinitionSchema } from "../schemas/ancestry";
import { BackgroundDefinitionSchema } from "../schemas/background";
import {
  ActionAbilitySchema,
  ClassDefinitionSchema,
  SpellAbilitySchema,
  SpellSchoolDefinitionSchema,
  SubclassDefinitionSchema,
} from "../schemas/class";
import { ActionAbilityDefinition, SpellAbilityDefinition } from "../types/abilities";
import { AncestryDefinition } from "../types/ancestry";
import { BackgroundDefinition } from "../types/background";
import { ClassDefinition, SubclassDefinition } from "../types/class";
import { SpellSchoolWithSpells } from "./content-repository-service";

// Validation functions
export class ContentValidationService {
  static validateClass(data: unknown): {
    valid: boolean;
    data?: ClassDefinition;
    errors?: string[];
  } {
    try {
      const validatedData = ClassDefinitionSchema.parse(data);
      return { valid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.issues.map((err) => `${err.path.join(".")}: ${err.message}`),
        };
      }
      return { valid: false, errors: ["Unknown validation error"] };
    }
  }

  static validateSubclass(data: unknown): {
    valid: boolean;
    data?: SubclassDefinition;
    errors?: string[];
  } {
    try {
      const validatedData = SubclassDefinitionSchema.parse(data);
      return { valid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.issues.map((err) => `${err.path.join(".")}: ${err.message}`),
        };
      }
      return { valid: false, errors: ["Unknown validation error"] };
    }
  }

  static validateActionAbility(data: unknown): {
    valid: boolean;
    data?: ActionAbilityDefinition;
    errors?: string[];
  } {
    try {
      const validatedData = ActionAbilitySchema.parse(data);
      return { valid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.issues.map((err) => `${err.path.join(".")}: ${err.message}`),
        };
      }
      return { valid: false, errors: ["Unknown validation error"] };
    }
  }

  static validateSpellAbility(data: unknown): {
    valid: boolean;
    data?: SpellAbilityDefinition;
    errors?: string[];
  } {
    try {
      const validatedData = SpellAbilitySchema.parse(data);
      return { valid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.issues.map((err) => `${err.path.join(".")}: ${err.message}`),
        };
      }
      return { valid: false, errors: ["Unknown validation error"] };
    }
  }

  static validateSpellSchool(data: unknown): {
    valid: boolean;
    data?: SpellSchoolWithSpells;
    errors?: string[];
  } {
    try {
      const validatedData = SpellSchoolDefinitionSchema.parse(data);
      return { valid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.issues.map((err) => `${err.path.join(".")}: ${err.message}`),
        };
      }
      return { valid: false, errors: ["Unknown validation error"] };
    }
  }

  static validateAncestry(data: unknown): {
    valid: boolean;
    data?: AncestryDefinition;
    errors?: string[];
  } {
    try {
      const validatedData = AncestryDefinitionSchema.parse(data);
      return { valid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.issues.map((err) => `${err.path.join(".")}: ${err.message}`),
        };
      }
      return { valid: false, errors: ["Unknown validation error"] };
    }
  }

  static validateBackground(data: unknown): {
    valid: boolean;
    data?: BackgroundDefinition;
    errors?: string[];
  } {
    try {
      const validatedData = BackgroundDefinitionSchema.parse(data);
      return { valid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.issues.map((err) => `${err.path.join(".")}: ${err.message}`),
        };
      }
      return { valid: false, errors: ["Unknown validation error"] };
    }
  }
}
