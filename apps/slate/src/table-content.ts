import {
  tableDefinitionSchema,
  tableToolSchema,
  type TableDefinition,
} from "./utility-schema";
import { rollTable } from "./utilities";
import { z } from "zod";
import { type Entry, resolveEntry } from "./content";
import {
  type ContentRecord,
  recordSchema,
  remapReferences,
} from "./content-schema";

const referenceTablesSchema = z
  .array(
    z.object({
      title: z.string().max(160),
      columns: z
        .array(
          z.object({
            id: z.string().min(1).max(160),
            name: z.string().max(160),
          }),
        )
        .min(1)
        .max(30),
      rows: z
        .array(z.object({ cells: z.record(z.string(), z.string().max(10000)) }))
        .max(200),
    }),
  )
  .min(1)
  .max(30);

export function referenceTableDefinition(
  entry: Pick<Entry, "kind" | "fields"> | undefined,
): TableDefinition | null {
  if (entry?.kind !== "table" || entry.fields.definition !== undefined)
    return null;
  const parsed = referenceTablesSchema.safeParse(entry.fields.subtables);
  if (!parsed.success) return null;
  const rows = parsed.data.flatMap((section, sectionIndex) => {
    const nameColumn =
      section.columns.find((column) => column.id === "item") ??
      section.columns[0];
    return section.rows.flatMap((row, rowIndex) => {
      if (!Object.values(row.cells).some((cell) => cell.trim())) return [];
      const name =
        row.cells[nameColumn.id]?.trim() || `${section.title} ${rowIndex + 1}`;
      const body = [
        section.title ? `**Category:** ${section.title}` : "",
        name.length > 160 ? name : "",
        ...section.columns
          .filter(
            (column) =>
              column.id !== nameColumn.id && row.cells[column.id]?.trim(),
          )
          .map((column) => `**${column.name}:** ${row.cells[column.id]}`),
      ]
        .filter(Boolean)
        .join("\n\n");
      return [
        {
          id: `reference-${sectionIndex + 1}-${rowIndex + 1}`,
          name: name.slice(0, 160),
          body,
          weight: 1,
          from: 1,
          to: 1,
        },
      ];
    });
  });
  const definition = tableDefinitionSchema.safeParse({
    mode: "list",
    formula: "1d6",
    rows,
  });
  return definition.success ? definition.data : null;
}

export function makeRandomTableCopy(entry: Entry): ContentRecord {
  const definition = referenceTableDefinition(entry);
  if (!definition)
    throw new Error(
      "This reference table has no structured rows to convert. Create a random table and add its entries manually.",
    );
  return recordSchema.parse({
    id: crypto.randomUUID(),
    kind: "table",
    title: `${entry.title.slice(0, 150)} (random)`,
    body:
      typeof entry.fields.description === "string"
        ? entry.fields.description
        : "",
    tags: entry.tags,
    category: "Campaign content",
    sources: entry.sources,
    origin: entry.target,
    related: entry.related.map((target) =>
      entry.pack && !target.includes("::")
        ? `${entry.pack.id}@${entry.pack.version}::${target}`
        : target,
    ),
    fields: { ...entry.fields, definition },
  });
}

export function tableDefinition(
  entry: Pick<Entry, "kind" | "fields"> | undefined,
) {
  if (entry?.kind !== "table") return null;
  const parsed = tableDefinitionSchema.safeParse(entry.fields.definition);
  return parsed.success ? parsed.data : null;
}

export function mapTableLinks(
  definition: TableDefinition,
  remap: (target: string) => string,
) {
  return {
    ...definition,
    rows: definition.rows.map((row) => ({
      ...row,
      ...(row.tableId ? { tableId: remap(row.tableId) } : {}),
    })),
  };
}

export function rollContentTable(
  entry: Entry,
  all: Entry[],
  manualId?: string,
  sample?: (formula: string) => number,
) {
  const tables = all
    .filter((record) => tableDefinition(record))
    .map((record) => {
      const definition = mapTableLinks(tableDefinition(record)!, (target) =>
        target.includes("::")
          ? target
          : record.pack
            ? `${record.pack.id}@${record.pack.version}::${target}`
            : `local::${target}`,
      );
      // Keep nested snapshots renderable even when the next table uses another pack.
      return tableToolSchema.parse({
        id: record.target,
        kind: "table",
        name: record.title.slice(0, 80),
        definition,
        history: [],
      });
    });
  const root = tables.find((table) => table.id === entry.target);
  if (!root || !resolveEntry(all, entry.target))
    throw new Error("Choose a rollable random table.");
  return rollTable(root, tables, manualId, sample);
}

// Upgrade embedded definitions without changing widget IDs, linked tables or results.
export function migrateTableContent(raw: unknown): unknown {
  if (
    !raw ||
    typeof raw !== "object" ||
    !("tools" in raw) ||
    !Array.isArray(raw.tools)
  )
    return raw;
  const campaign = raw as {
    tools: Record<string, unknown>[];
    content?: ContentRecord[];
  };
  const content = [...(campaign.content ?? [])];
  const legacy = campaign.tools.filter(
    (tool) => tool.kind === "table" && "definition" in tool,
  );
  const targets = new Map<string, string>();
  for (const tool of legacy) {
    let id = `table-${String(tool.id).replace(/[^a-zA-Z0-9_./-]/g, "-")}`;
    while (
      content.some((record) => record.id === id) ||
      [...targets.values()].includes(`local::${id}`)
    )
      id += "-copy";
    targets.set(String(tool.id), `local::${id}`);
  }
  for (const tool of legacy) {
    const previous = tableToolSchema.parse(tool);
    content.push({
      id: targets.get(previous.id)!.slice(7),
      kind: "table",
      title: previous.name,
      body: "",
      tags: [],
      category: "Campaign content",
      sources: [],
      related: [],
      fields: {
        definition: mapTableLinks(
          previous.definition,
          (id) => targets.get(id) ?? id,
        ),
      },
    });
  }
  return {
    ...raw,
    content,
    tools: campaign.tools.map((tool) => {
      if (!targets.has(String(tool.id))) return tool;
      const { definition: _definition, ...rest } = tool;
      void _definition;
      return { ...rest, target: targets.get(String(tool.id)) };
    }),
  };
}

export function remapTableContent(
  record: ContentRecord,
  targetRemap: (target: string) => string,
  idRemap: (id: string) => string,
) {
  const definition = tableDefinition(record);
  return definition
    ? {
        ...record,
        fields: {
          ...record.fields,
          definition: {
            ...mapTableLinks(definition, targetRemap),
            rows: mapTableLinks(definition, targetRemap).rows.map((row) => ({
              ...row,
              body: remapReferences(row.body, idRemap),
            })),
          },
        },
      }
    : record;
}
