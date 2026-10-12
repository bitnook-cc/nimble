// Data-only rendering shared by the offline bundle converter and Nexus import.
export const officialKind = {
  classes: "class",
  subclasses: "subclass",
  ancestries: "ancestry",
  backgrounds: "background",
  "random-tables": "table",
} as const;
export const officialLabel = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\bHp\b/g, "HP");

export function renderOfficialAttributes(value: unknown, depth = 2): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value))
    return (
      value
        .map((item) =>
          typeof item === "object"
            ? renderOfficialAttributes(item, depth)
            : `- ${item}`,
        )
        .join("\n\n") || "None"
    );
  const attributes = value as Record<string, unknown>;
  const heading =
    attributes.name ??
    (attributes.level !== undefined ? `Level ${attributes.level}` : "");
  return [
    heading ? `${"#".repeat(Math.min(depth, 6))} ${heading}` : "",
    attributes.description ?? "",
    ...Object.entries(attributes)
      .filter(
        ([key]) =>
          ![
            "id",
            "name",
            "description",
            "level",
            "legacyName",
            "legacyTitle",
          ].includes(key),
      )
      .map(([key, item]) =>
        typeof item === "object"
          ? `${"#".repeat(Math.min(depth + (heading ? 1 : 0), 6))} ${officialLabel(key)}\n\n${renderOfficialAttributes(item, depth + (heading ? 2 : 1))}`
          : `**${officialLabel(key)}:** ${item}`,
      ),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function renderOfficialTable(
  attributes: Record<string, unknown>,
): string {
  if (!Array.isArray(attributes.subtables))
    throw new Error("Reference table has no subtables.");
  const cell = (text: unknown) =>
    String(text ?? "")
      .replaceAll("|", "\\|")
      .replaceAll("\n", " ");
  return [
    attributes.description,
    ...attributes.subtables.map(
      (table: {
        title: string;
        columns: { id: string; name: string }[];
        rows: { cells: Record<string, string> }[];
      }) =>
        [
          `## ${table.title}`,
          `| ${table.columns.map((column) => cell(column.name)).join(" | ")} |`,
          `| ${table.columns.map(() => "---").join(" | ")} |`,
          ...table.rows.map(
            (row) =>
              `| ${table.columns.map((column) => cell(row.cells[column.id])).join(" | ")} |`,
          ),
        ].join("\n"),
    ),
  ]
    .filter(Boolean)
    .join("\n\n");
}
