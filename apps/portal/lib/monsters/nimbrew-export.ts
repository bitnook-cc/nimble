import type { AnyMonster, LegendaryMonster } from "./types";

interface NimbrewPassive {
  type: "single";
  name: string;
  desc: string;
}

interface NimbrewAction {
  type: "single";
  name: string;
  desc: string;
}

interface NimbrewMultiAction {
  type: "multi";
  name: string;
  desc: string;
  actions: NimbrewAction[];
}

interface NimbrewTheme {
  BGColor: string;
  BGOpacity: string;
  passiveBGColor: string;
  textColor: string;
  accentColor: string;
  borderOpacity: string;
}

interface NimbrewMonster {
  name: string;
  CR: string;
  armor: string;
  hp: string;
  saves: string;
  speed: string;
  passives: NimbrewPassive[];
  actions: (NimbrewAction | NimbrewMultiAction)[];
  theme: NimbrewTheme;
  bloodied?: string;
  laststand?: string;
}

const DEFAULT_THEME: NimbrewTheme = {
  BGColor: "#f2ebda",
  BGOpacity: "1",
  passiveBGColor: "#d8d2c2",
  textColor: "#000000",
  accentColor: "#555555",
  borderOpacity: "1",
};

function formatArmor(armor: string): string {
  if (armor === "None") return "";
  return armor;
}

function formatSaves(saves: AnyMonster["saves"]): string {
  if (!saves) return "";
  const parts: string[] = [];
  const labels: Record<string, string> = {
    strength: "STR",
    dexterity: "DEX",
    intelligence: "INT",
    will: "WIL",
  };
  for (const [key, label] of Object.entries(labels)) {
    const value = saves[key as keyof typeof saves];
    if (value !== undefined && value !== 0) {
      const sign = value > 0 ? "+" : "-";
      parts.push(`${sign}${label}`);
    }
  }
  return parts.join(" ");
}

function formatCR(monster: AnyMonster): string {
  const parts: string[] = [];
  if (monster.kind === "legendary") {
    parts.push(`Level ${monster.level} Solo`);
  } else {
    parts.push(`Lvl ${monster.level}`);
  }
  if (monster.type) parts.push(monster.type);
  return parts.join(" ");
}

function formatActionDesc(action: { description: string; reach?: number; diceFormula?: string }): string {
  const parts: string[] = [];
  if (action.diceFormula) {
    parts.push(` ${action.diceFormula}.`);
  }
  if (action.description) {
    parts.push(action.description);
  }
  if (action.reach && action.reach > 1) {
    parts.push(`Reach ${action.reach}.`);
  }
  return parts.join(" ").trim();
}

export function toNimbrewJson(monster: AnyMonster): NimbrewMonster {
  const passives: NimbrewPassive[] = monster.passives.map((p) => ({
    type: "single",
    name: p.name,
    desc: p.description,
  }));

  const actions: (NimbrewAction | NimbrewMultiAction)[] = monster.actions.map((a) => ({
    type: "single" as const,
    name: a.name,
    desc: formatActionDesc(a),
  }));

  const result: NimbrewMonster = {
    name: monster.name || "Unnamed Monster",
    CR: formatCR(monster),
    armor: formatArmor(monster.armor),
    hp: String(monster.hitPoints),
    saves: formatSaves(monster.saves),
    speed: monster.speed ? String(monster.speed) : "",
    passives,
    actions,
    theme: DEFAULT_THEME,
  };

  if (monster.kind === "legendary") {
    const legendary = monster as LegendaryMonster;
    if (legendary.bloodied) {
      result.bloodied = legendary.bloodied.description;
    }
    if (legendary.lastStand) {
      const lsHp = legendary.lastStandHp;
      result.laststand = legendary.lastStand.description;
      if (lsHp) {
        result.laststand = `${lsHp} HP remaining. ${result.laststand}`;
      }
    }
  }

  return result;
}

export function downloadNimbrewJson(monster: AnyMonster): void {
  const nimbrew = toNimbrewJson(monster);
  const json = JSON.stringify(nimbrew, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const slug = (monster.name || "monster").toLowerCase().replace(/\s+/g, "-");
  a.download = `${slug}-nimbrew.json`;
  a.click();
  URL.revokeObjectURL(url);
}
