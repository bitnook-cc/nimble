import {
  defaultSpan,
  canPlace,
  findSpace,
  type Screen,
  type Widget,
} from "./model";

// Registry metadata drives the catalogue and leaves rendering/domain state separate.
export const widgetTypes: Record<
  Widget["kind"],
  {
    title: string;
    category: string;
    description: string;
    keywords: string;
    minimumPixels: { width: number; height: number };
    initial: { w: number; h: number };
  }
> = {
  table: {
    title: "Random table",
    category: "Utilities",
    description: "Roll weighted or dice-range tables.",
    keywords: "random encounter roll chart",
    minimumPixels: { width: 240, height: 200 },
    initial: defaultSpan.table,
  },
  time: {
    title: "Clock & timer",
    category: "Utilities",
    description: "Clock, countdown and stopwatch with compact controls.",
    keywords: "time clock timer countdown stopwatch session elapsed deadline",
    minimumPixels: { width: 180, height: 120 },
    initial: defaultSpan.time,
  },
  counter: {
    title: "Counter",
    category: "Utilities",
    description: "Count manually or add/subtract on combat turns and rounds.",
    keywords:
      "travel exploration miles units resource clock countdown progress round turn steps",
    minimumPixels: { width: 180, height: 150 },
    initial: defaultSpan.counter,
  },
  image: {
    title: "Image card",
    category: "Content",
    description: "Keep a local map, portrait or handout in view.",
    keywords: "map picture image portrait handout",
    minimumPixels: { width: 180, height: 140 },
    initial: defaultSpan.image,
  },
  checklist: {
    title: "Checklist",
    category: "Utilities",
    description: "Track tasks, clues and session preparation.",
    keywords: "tasks todo prep list",
    minimumPixels: { width: 220, height: 180 },
    initial: defaultSpan.checklist,
  },
  items: {
    title: "Item library",
    category: "Content",
    description: "Search, edit and pin campaign items.",
    keywords: "equipment inventory rarity favourites database",
    minimumPixels: { width: 280, height: 200 },
    initial: defaultSpan.items,
  },
  npc: {
    title: "NPC generator",
    category: "Generators",
    description: "Create names, scars, mannerisms and quirks.",
    keywords:
      "people ancestry fantasy appearance trait personality random name",
    minimumPixels: { width: 280, height: 220 },
    initial: defaultSpan.npc,
  },
  initiative: {
    title: "Initiative tracker",
    category: "Combat",
    description: "Track turns, hit points and conditions.",
    keywords: "encounter hp enemies rounds",
    minimumPixels: { width: 340, height: 280 },
    initial: defaultSpan.initiative,
  },
  note: {
    title: "Notes",
    category: "Content",
    description: "Markdown notes with links to your campaign library.",
    keywords: "journal text reference",
    minimumPixels: { width: 220, height: 160 },
    initial: defaultSpan.note,
  },
  reference: {
    title: "Reference",
    category: "Content",
    description: "Pin a rule, spell, item or section for offline play.",
    keywords: "rules spells items library",
    minimumPixels: { width: 240, height: 180 },
    initial: defaultSpan.reference,
  },
  dice: {
    title: "Dice roller",
    category: "Utilities",
    description: "Roll formulas and keep favourite rolls.",
    keywords: "random advantage presets roll",
    minimumPixels: { width: 280, height: 300 },
    initial: defaultSpan.dice,
  },
};

// Prefer the largest available footprint up to the default, permitting any whole-cell span.
export function fitWidget(
  screen: Screen,
  preferred: { w: number; h: number },
  origin?: { x: number; y: number } | null,
) {
  const sizes: { w: number; h: number }[] = [];
  for (let h = Math.min(preferred.h, screen.grid.rows); h >= 1; h--)
    for (let w = Math.min(preferred.w, screen.grid.columns); w >= 1; w--)
      sizes.push({ w, h });
  sizes.sort((a, b) => b.w * b.h - a.w * a.h);
  for (const size of sizes) {
    const rect = origin ? { ...origin, ...size } : findSpace(screen, size);
    if (rect && canPlace(screen, rect)) return rect;
  }
  return null;
}
