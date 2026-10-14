import {
  generateNpcs,
  nameStyleSchema,
  npcAttributeKinds,
  npcAttributeLabels,
  type RandomSource,
  type GeneratorDefinition,
} from "@nimble/generators";
import { uid, type NpcEntry, type NpcTool } from "./model";
import { newNote, type Note } from "./notes";

export function generateNpcResults(
  tool: NpcTool,
  count = 1,
  random?: RandomSource,
  definition?: GeneratorDefinition,
): NpcTool {
  const generated = generateNpcs(count, tool.options, random, definition).map(
    (npc) => ({
      ...npc,
      id: uid(),
      at: new Date().toISOString(),
    }),
  );
  return {
    ...tool,
    current: generated[0],
    history: [...generated, ...tool.history].slice(0, 20),
  };
}
export function replaceNpcResult(tool: NpcTool, entry: NpcEntry): NpcTool {
  return {
    ...tool,
    current: entry,
    history: tool.history.map((npc) => (npc.id === entry.id ? entry : npc)),
  };
}
export function saveNpcResult(tool: NpcTool): NpcTool {
  if (!tool.current) return tool;
  const rest = tool.saved.filter((npc) => npc.id !== tool.current!.id);
  if (rest.length >= 100)
    throw new Error(
      "This tool already has 100 saved NPCs. Remove one before saving another.",
    );
  return { ...tool, saved: [structuredClone(tool.current), ...rest] };
}
export function npcNote(npc: NpcEntry): Note {
  return {
    ...newNote(npc.name),
    body: [
      `# ${npc.name}`,
      "",
      ...npcAttributeKinds.map(
        (kind) => `**${npcAttributeLabels[kind]}:** ${npc.attributes[kind]}\n`,
      ),
    ].join("\n"),
    tags: [
      "npc",
      nameStyleSchema.safeParse(npc.style).success
        ? npc.style
        : "custom-generator",
    ],
  };
}
