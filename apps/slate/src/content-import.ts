import { digest } from "./backup";
import { parseExchange, exportRecords, type ImportPreview } from "./exchange";
import {
  parsePack,
  packKey,
  packTarget,
  packSchema,
  recordSchema,
  mergePacks,
  type ContentPack,
  type ContentRecord,
} from "./content-schema";
import type { Entry } from "./content";
import type { AppData } from "./model";
import {
  creditNexusRecords,
  nexusCredit,
  nexusPlatform,
  isNexusSource,
} from "./nexus-attribution";
import { mapDocumentTargets } from "./document-markdown";

export async function prepareContentImport(
  text: string,
  all: Entry[] = [],
): Promise<ImportPreview> {
  if (new TextEncoder().encode(text).length > 8 * 1024 * 1024)
    throw new Error("Import exceeds 8 MiB.");
  const raw: unknown = JSON.parse(text);
  if (
    !raw ||
    typeof raw !== "object" ||
    !("format" in raw) ||
    raw.format !== "slate-content"
  ) {
    const preview = parseExchange(text, all);
    return preview.format === "Nexus JSON:API"
      ? { ...preview, records: creditNexusRecords(preview.records) }
      : preview;
  }
  const pack = parsePack(text);
  const ids = new Map(
    await Promise.all(
      pack.records.map(
        async (record) =>
          [
            record.id,
            "pack-" +
              (await digest(
                new TextEncoder().encode(packTarget(pack, record.id)),
              )),
          ] as const,
      ),
    ),
  );
  const target = (value: string) => {
    const [base, anchor] = value.split("#");
    const id = base.startsWith(packKey(pack) + "::")
      ? base.slice(packKey(pack).length + 2)
      : base;
    return ids.has(id)
      ? `local::${ids.get(id)}${anchor ? "#" + anchor : ""}`
      : value;
  };
  const body = (value: string) =>
    mapDocumentTargets(value, target, packTarget(pack, "document"));
  const fields = (value: unknown, field = ""): unknown => {
    if (typeof value === "string")
      return body(
        ["target", "tableId"].includes(field) ||
          value.startsWith(packKey(pack) + "::")
          ? target(value)
          : value,
      );
    if (Array.isArray(value)) return value.map((v) => fields(v, field));
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [
          k,
          k === "exchange" ? v : fields(v, k),
        ]),
      );
    return value;
  };
  const records = pack.records.map((record) => {
    const referenced = JSON.stringify(record);
    const assets = Object.fromEntries(
      Object.entries(pack.assets).filter(([key]) => referenced.includes(key)),
    );
    const aliases = pack.terms
      .filter((term) => term.target.split("#")[0] === record.id)
      .flatMap((term) => [term.term, ...term.aliases]);
    return recordSchema.parse({
      ...record,
      id: ids.get(record.id)!,
      origin: packTarget(pack, record.id),
      body: body(record.body),
      related: record.related.map(target),
      tags: [
        ...new Set([
          ...record.tags,
          ...aliases.map((alias) => alias.slice(0, 100)),
        ]),
      ].slice(0, 80),
      fields: {
        ...(fields(record.fields) as ContentRecord["fields"]),
      },
      importedFrom: record.importedFrom
        ? {
            ...record.importedFrom,
            assets: { ...record.importedFrom.assets, ...assets },
          }
        : { name: pack.name, source: pack.source, assets },
    });
  });
  const campaignError =
    new TextEncoder().encode(JSON.stringify(records)).length > 8 * 1024 * 1024
      ? "Campaign copies would exceed 8 MiB. Choose Content pack instead."
      : undefined;
  return {
    records,
    warnings: [],
    format: "Slate content pack",
    name: pack.name,
    pack,
    campaignError,
  };
}

export function contentImportPack(
  preview: ImportPreview,
  name: string,
  all: Entry[] = [],
) {
  if (preview.pack) return { value: preview.pack, warnings: [] as string[] };
  const fromNexus =
    isNexusSource(preview.sourceUrl) ||
    preview.records.some(
      (record) =>
        (record.fields.exchange as { format?: string } | undefined)?.format ===
          "nexus" ||
        !!(record.fields.nexus as { platform?: unknown } | undefined)
          ?.platform ||
        isNexusSource(record.importedFrom?.source.url),
    );
  const exported = exportRecords(preview.records, "pack", all, name.trim());
  const value = packSchema.parse({
    ...(exported.value as ContentPack),
    source: {
      revision: "1",
      ...(preview.sourceUrl || fromNexus
        ? { url: preview.sourceUrl ?? nexusPlatform.url }
        : {}),
      license:
        (fromNexus ? nexusCredit + " " : "") +
        "Imported content. Original attribution and source information are retained in each record.",
    },
  });
  return { value, warnings: exported.warnings };
}

export function installContentImportPack(
  data: AppData,
  campaignId: string,
  pack: ContentPack,
): AppData {
  if (!data.campaigns.some((c) => c.id === campaignId && !c.archivedAt))
    throw new Error("This campaign is no longer available.");
  return {
    ...data,
    packs: mergePacks(data.packs, [pack]),
    campaigns: data.campaigns.map((c) =>
      c.id === campaignId
        ? { ...c, packRefs: [...new Set([...c.packRefs, packKey(pack)])] }
        : c,
    ),
  };
}
