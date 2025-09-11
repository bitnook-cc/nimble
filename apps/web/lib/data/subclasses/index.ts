// Import all subclass definitions for the main subclasses object
import { SubclassDefinition } from "../../schemas/class";
import { berserkerMountainheart } from "./berserker-mountainheart";
import { berserkerRedMist } from "./berserker-red-mist";
import { cheatScoundrel } from "./cheat-scoundrel";
import { cheatSilentBlade } from "./cheat-silent-blade";
import { commanderBulwark } from "./commander-bulwark";
import { commanderVanguard } from "./commander-vanguard";
import { hunterShadowpath } from "./hunter-shadowpath";
import { hunterWildheart } from "./hunter-wildheart";
import { mageChaos } from "./mage-chaos";
import { mageControl } from "./mage-control";
import { oathswornRefuge } from "./oathsworn-refuge";
import { oathswornVengeance } from "./oathsworn-vengeance";
import { shadowmancerAbyssalDepths } from "./shadowmancer-abyssal-depths";
import { shadowmancerRedDragon } from "./shadowmancer-red-dragon";
import { shepherdLuminaryMalice } from "./shepherd-luminary-malice";
import { shepherdLuminaryMercy } from "./shepherd-luminary-mercy";
import { songweaverHeraldCourage } from "./songweaver-herald-courage";
import { songweaverHeraldSnark } from "./songweaver-herald-snark";
import { circleOfFangAndClaw } from "./stormshifter-fang-claw";
import { circleOfSkyAndStorm } from "./stormshifter-sky-storm";
import { wayOfFlame } from "./zephyr-flame";
import { wayOfPain } from "./zephyr-pain";

// Berserker subclasses
export { berserkerRedMist } from "./berserker-red-mist";
export { berserkerMountainheart } from "./berserker-mountainheart";

// Cheat subclasses
export { cheatSilentBlade } from "./cheat-silent-blade";
export { cheatScoundrel } from "./cheat-scoundrel";

// Commander subclasses
export { commanderBulwark } from "./commander-bulwark";
export { commanderVanguard } from "./commander-vanguard";

// Hunter subclasses
export { hunterWildheart } from "./hunter-wildheart";
export { hunterShadowpath } from "./hunter-shadowpath";

// Mage subclasses
export { mageChaos } from "./mage-chaos";
export { mageControl } from "./mage-control";

// Oathsworn subclasses
export { oathswornVengeance } from "./oathsworn-vengeance";
export { oathswornRefuge } from "./oathsworn-refuge";

// Stormshifter subclasses
export { circleOfSkyAndStorm } from "./stormshifter-sky-storm";
export { circleOfFangAndClaw } from "./stormshifter-fang-claw";

// Shadowmancer subclasses
export { shadowmancerRedDragon } from "./shadowmancer-red-dragon";
export { shadowmancerAbyssalDepths } from "./shadowmancer-abyssal-depths";

// Shepherd subclasses
export { shepherdLuminaryMercy } from "./shepherd-luminary-mercy";
export { shepherdLuminaryMalice } from "./shepherd-luminary-malice";

// Songweaver subclasses
export { songweaverHeraldSnark } from "./songweaver-herald-snark";
export { songweaverHeraldCourage } from "./songweaver-herald-courage";

// Zephyr subclasses
export { wayOfPain } from "./zephyr-pain";
export { wayOfFlame } from "./zephyr-flame";

// All subclass definitions
export const subclassDefinitions: SubclassDefinition[] = [
  berserkerRedMist,
  berserkerMountainheart,
  cheatSilentBlade,
  cheatScoundrel,
  commanderBulwark,
  commanderVanguard,
  hunterWildheart,
  hunterShadowpath,
  mageChaos,
  mageControl,
  oathswornVengeance,
  oathswornRefuge,
  circleOfSkyAndStorm,
  circleOfFangAndClaw,
  shadowmancerRedDragon,
  shadowmancerAbyssalDepths,
  shepherdLuminaryMercy,
  shepherdLuminaryMalice,
  songweaverHeraldSnark,
  songweaverHeraldCourage,
  wayOfPain,
  wayOfFlame,
];

// Helper function to get a subclass definition by ID
export function getSubclassDefinition(subclassId: string): SubclassDefinition | null {
  return subclassDefinitions.find((subclass) => subclass.id === subclassId) || null;
}

// Helper function to get all subclasses for a specific class
export function getSubclassesForClass(classId: string): SubclassDefinition[] {
  return subclassDefinitions.filter((subclass) => subclass.parentClassId === classId);
}

// Helper function to get features for a specific subclass and level
export function getSubclassFeaturesForLevel(
  subclassId: string,
  level: number,
): SubclassDefinition["features"] {
  const subclassDef = getSubclassDefinition(subclassId);
  if (!subclassDef) return [];

  return subclassDef.features.filter((feature) => feature.level === level);
}

// Helper function to get all subclass features up to a specific level
export function getAllSubclassFeaturesUpToLevel(
  subclassId: string,
  level: number,
): SubclassDefinition["features"] {
  const subclassDef = getSubclassDefinition(subclassId);
  if (!subclassDef) return [];

  return subclassDef.features.filter((feature) => feature.level <= level);
}
