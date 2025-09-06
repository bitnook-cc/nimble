import { ActionAbility } from "./abilities";
import { AttributeName } from "./character";
import { WeaponItem } from "./inventory";

export type ActionType = "weapon" | "ability";

export interface BaseAction {
  id: string;
  name: string;
  type: ActionType;
}

export interface WeaponAction extends BaseAction {
  type: "weapon";
  weapon: WeaponItem;
  damage: string;
  attribute?: AttributeName;
  attributeModifier: number;
}

export interface AbilityAction extends BaseAction {
  type: "ability";
  ability: ActionAbility;
  description: string;
  usesRemaining: number;
  maxUses: number;
  frequency: "per_turn" | "per_encounter";
}

export type Action = WeaponAction | AbilityAction;
