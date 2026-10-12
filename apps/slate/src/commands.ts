import type { Campaign, Widget } from "./model";
import { widgetTypes } from "./widgets";

export type WidgetCommand = {
  id: string;
  title: string;
  description: string;
  kind: Widget["kind"];
  toolId?: string;
  search: string;
};
const kinds: Widget["kind"][] = [
  "dice",
  "initiative",
  "npc",
  "note",
  "reference",
  "items",
  "table",
  "time",
  "counter",
  "image",
  "checklist",
];
const normalise = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function widgetCommands(
  campaign: Campaign,
  query = "",
): WidgetCommand[] {
  const commands = kinds.flatMap((kind) => {
    const metadata = widgetTypes[kind];
    const tools = campaign.tools.filter((tool) => tool.kind === kind);
    if (!tools.length)
      return [
        {
          id: `new:${kind}`,
          title: metadata.title,
          kind,
          description: "New campaign tool · " + metadata.description,
          search: `${metadata.title} ${metadata.description} ${metadata.keywords}`,
        },
      ];
    return tools.map((tool) => ({
      id: tool.id,
      title: tool.name,
      kind,
      toolId: tool.id,
      description: `${metadata.title} · ${tool.kind === "initiative" ? tool.run.name : "Saved in this campaign"}`,
      search: `${tool.name} ${metadata.title} ${metadata.description} ${metadata.keywords} ${tool.kind === "initiative" ? tool.run.name : ""}`,
    }));
  });
  const words = normalise(query).trim().split(/\s+/).filter(Boolean);
  const term = normalise(query).trim();
  return commands
    .filter((command) =>
      words.every((word) => normalise(command.search).includes(word)),
    )
    .sort(
      (a, b) =>
        Number(normalise(b.title) === term) -
        Number(normalise(a.title) === term),
    );
}
