import { ItemRepository } from "../../types/item-repository";
import { MAGICAL_AMMUNITION, MUNDANE_AMMUNITION } from "./ammunition";
import { MAGICAL_ARMOR, MUNDANE_ARMOR } from "./armor";
import { MAGICAL_CONSUMABLES, MUNDANE_CONSUMABLES } from "./consumables";
import { MAGICAL_FREEFORM, MUNDANE_FREEFORM } from "./freeform";
import { MAGICAL_WEAPONS, MUNDANE_WEAPONS } from "./weapons";

export const ITEM_REPOSITORY: ItemRepository = {
  weapons: [...MUNDANE_WEAPONS, ...MAGICAL_WEAPONS],
  armor: [...MUNDANE_ARMOR, ...MAGICAL_ARMOR],
  freeform: [...MUNDANE_FREEFORM, ...MAGICAL_FREEFORM],
  consumables: [...MUNDANE_CONSUMABLES, ...MAGICAL_CONSUMABLES],
  ammunition: [...MUNDANE_AMMUNITION, ...MAGICAL_AMMUNITION],
};

export * from "./weapons";
export * from "./armor";
export * from "./consumables";
export * from "./ammunition";
export * from "./freeform";
