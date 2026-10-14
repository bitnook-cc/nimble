import { recordSchema, type ContentRecord } from "./content-schema";
import { uid, type Campaign, type Tool } from "./model";

export type Note = ContentRecord & { kind: "note" };

export function newNote(title = "Notes", id: string = uid()): Note {
  return recordSchema.parse({
    id,
    kind: "note",
    title,
    body: "",
    tags: [],
    category: "Campaign notes",
  }) as Note;
}

// Tool creation and its initial document must be saved in the same transaction.
export function addCampaignTool(campaign: Campaign, tool: Tool): Campaign {
  const existing =
    tool.kind === "note"
      ? campaign.content.find((record) => record.id === tool.noteId)
      : undefined;
  if (existing && existing.kind !== "note")
    throw new Error("This widget must reference a note.");
  return {
    ...campaign,
    content:
      tool.kind === "note" && !existing
        ? [...campaign.content, newNote(tool.name, tool.noteId)]
        : campaign.content,
    tools: [...campaign.tools, tool],
  };
}

export function updateNote(
  campaign: Campaign,
  id: string,
  change: (note: Note) => Note,
): Campaign {
  const current = campaign.content.find(
    (record) => record.id === id && record.kind === "note",
  );
  if (!current) throw new Error("This note is no longer available.");
  const next = recordSchema.parse(change(current as Note));
  if (next.id !== id || next.kind !== "note")
    throw new Error("A note's identity cannot change.");
  return {
    ...campaign,
    content: campaign.content.map((record) =>
      record.id === id ? next : record,
    ),
    tools: campaign.tools.map((tool) =>
      tool.kind === "note" && tool.noteId === id
        ? { ...tool, name: next.title.slice(0, 80) }
        : tool,
    ),
  };
}

// Keep the old note's ID so existing local:: links and section anchors survive.
export function migrateNoteContent(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const campaign = raw as Record<string, unknown>;
  if (!Array.isArray(campaign.tools)) return raw;
  const content = Array.isArray(campaign.content) ? [...campaign.content] : [];
  const tools = campaign.tools.map((tool: Record<string, unknown>) => {
    if (tool.kind !== "note") return tool;
    if (
      typeof tool.id !== "string" ||
      typeof tool.name !== "string" ||
      typeof tool.body !== "string" ||
      !Array.isArray(tool.tags)
    )
      throw new Error(
        "An existing note could not be read. The original data has been kept.",
      );
    if (content.some((record) => record.id === tool.id))
      throw new Error(
        "An existing note has a conflicting content ID. The original data has been kept.",
      );
    content.push(
      recordSchema.parse({
        ...newNote(tool.name, tool.id),
        body: tool.body,
        tags: tool.tags,
      }),
    );
    return { id: tool.id, kind: "note", name: tool.name, noteId: tool.id };
  });
  return { ...campaign, content, tools };
}
