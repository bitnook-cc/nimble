import {
  uid,
  newTool,
  layoutSchema,
  campaignSchema,
  type Campaign,
  type Layout,
  type Screen,
  type ScreenPreset,
  type Widget,
  type Tool,
} from "./model";
import { addCampaignTool } from "./notes";

export function editScreen(
  c: Campaign,
  screenId: string,
  edit: (layout: Layout) => Layout,
): Campaign {
  return {
    ...c,
    screens: c.screens.map((screen) => {
      if (screen.id !== screenId) return screen;
      const before = layoutSchema.parse({
        grid: screen.grid,
        widgets: screen.widgets,
      });
      const after = layoutSchema.parse(edit(structuredClone(before)));
      if (JSON.stringify(before) === JSON.stringify(after)) return screen;
      return {
        ...screen,
        ...after,
        undo: [before, ...screen.undo].slice(0, 20),
        redo: [],
      };
    }),
  };
}
export function undoLayout(
  c: Campaign,
  screenId: string,
  redo = false,
): Campaign {
  return {
    ...c,
    screens: c.screens.map((s) => {
      if (s.id !== screenId) return s;
      const source = redo ? s.redo : s.undo;
      const target = redo ? s.undo : s.redo;
      if (!source.length) return s;
      return {
        ...s,
        ...source[0],
        [redo ? "redo" : "undo"]: source.slice(1),
        [redo ? "undo" : "redo"]: [
          { grid: s.grid, widgets: s.widgets },
          ...target,
        ].slice(0, 20),
      };
    }),
  };
}
export function duplicateScreen(c: Campaign, id: string): Campaign {
  const original = c.screens.find((s) => s.id === id);
  if (!original) throw new Error("Screen not found.");
  const screen: Screen = {
    ...structuredClone(original),
    id: uid(),
    name: `${original.name.slice(0, 73)} (copy)`,
    undo: [],
    redo: [],
    widgets: original.widgets.map((w) => ({ ...w, id: uid() })),
  };
  return campaignSchema.parse({
    ...c,
    screens: [...c.screens, screen],
    activeScreenId: screen.id,
  });
}
export const builtInPresets: ScreenPreset[] = [
  {
    id: "blank",
    name: "Blank",
    grid: { columns: 12, rows: 8 },
    tools: [],
    widgets: [],
  },
  {
    id: "combat",
    name: "Combat",
    grid: { columns: 12, rows: 8 },
    tools: [
      { id: "tracker", kind: "initiative", name: "Initiative tracker" },
      { id: "dice", kind: "dice", name: "Dice roller" },
    ],
    widgets: [
      {
        id: "tracker-view",
        toolId: "tracker",
        kind: "initiative",
        x: 0,
        y: 0,
        w: 6,
        h: 5,
        title: "",
      },
      {
        id: "dice-view",
        toolId: "dice",
        kind: "dice",
        x: 6,
        y: 0,
        w: 4,
        h: 5,
        title: "",
      },
    ],
  },
  {
    id: "dice-table",
    name: "Dice table",
    grid: { columns: 8, rows: 6 },
    tools: [{ id: "dice", kind: "dice", name: "Dice roller" }],
    widgets: [
      {
        id: "dice-view",
        toolId: "dice",
        kind: "dice",
        x: 0,
        y: 0,
        w: 4,
        h: 5,
        title: "",
      },
    ],
  },
];
export function createWorldScreen(campaign: Campaign, name: string): Campaign {
  const screen: Screen = {
    id: uid(),
    name,
    kind: "world",
    grid: { columns: 12, rows: 8 },
    widgets: [],
    undo: [],
    redo: [],
    world: { selectedNoteId: null, positions: {} },
  };
  return campaignSchema.parse({
    ...campaign,
    screens: [...campaign.screens, screen],
    activeScreenId: screen.id,
  });
}
export function createScreen(
  c: Campaign,
  name: string,
  preset: ScreenPreset,
): Campaign {
  const tools = preset.tools.map(
    (t) => ({ ...newTool(t.kind), name: t.name }) as Tool,
  );
  const screen: Screen = {
    id: uid(),
    name,
    grid: { ...preset.grid },
    undo: [],
    redo: [],
    widgets: preset.widgets.map((w) => ({
      ...w,
      id: uid(),
      toolId: tools[preset.tools.findIndex((t) => t.id === w.toolId)].id,
    })),
  };
  return campaignSchema.parse({
    ...tools.reduce(addCampaignTool, c),
    screens: [...c.screens, screen],
    activeScreenId: screen.id,
  });
}
export function savePreset(
  c: Campaign,
  screenId: string,
  name: string,
): Campaign {
  const screen = c.screens.find((s) => s.id === screenId)!;
  if (screen.kind === "world")
    throw new Error("Layout presets are only available for dashboard tabs.");
  const preset: ScreenPreset = {
    id: uid(),
    name,
    grid: { ...screen.grid },
    widgets: structuredClone(screen.widgets),
    tools: c.tools
      .filter((t) => screen.widgets.some((w) => w.toolId === t.id))
      .map((t) => ({ id: t.id, kind: t.kind, name: t.name })),
  };
  return campaignSchema.parse({
    ...c,
    layoutPresets: [...c.layoutPresets, preset],
  });
}
export function widgetTitle(widget: Widget, tools: Tool[]) {
  return (
    widget.title ||
    tools.find((t) => t.id === widget.toolId)?.name ||
    {
      dice: "Dice roller",
      initiative: "Initiative tracker",
      note: "Notes",
      reference: "Reference",
      npc: "NPC generator",
      items: "Item library",
      table: "Random table",
      time: "Clock & timer",
      counter: "Counter",
      image: "Image card",
      checklist: "Checklist",
    }[widget.kind]
  );
}
