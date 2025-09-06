import { AttributeName } from "./character";
import { FlexibleValue } from "./flexible-value";

/**
 * Stat bonus system for passive features
 * Allows features to provide bonuses to various character stats using flexible values
 */

export interface AttributeBonuses {
  strength?: FlexibleValue;
  dexterity?: FlexibleValue;
  intelligence?: FlexibleValue;
  will?: FlexibleValue;
}

export interface StatBonus {
  // Core attributes
  attributes?: AttributeBonuses;

  // Skills (by skill name)
  skillBonuses?: Record<string, FlexibleValue>;

  // Combat and health stats
  hitDiceBonus?: FlexibleValue;
  maxWoundsBonus?: FlexibleValue;
  armorBonus?: FlexibleValue;
  initiativeBonus?: FlexibleValue;
  speedBonus?: FlexibleValue;

  // Resource bonuses (by resource definition id)
  resourceMaxBonuses?: Record<string, FlexibleValue>;
  resourceMinBonuses?: Record<string, FlexibleValue>;
}
