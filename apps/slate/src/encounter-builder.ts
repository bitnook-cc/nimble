import {
  encounterFieldsSchema,
  type EncounterFields,
} from "./encounter-schema";
import { recordSchema, type ContentRecord } from "./content-schema";
import { type Entry } from "./content";
import { inspectEncounter } from "./encounters";
import { uid } from "./model";

export function saveEncounterDefinition(
  initial: ContentRecord | undefined,
  draft: { title: string; body: string; fields: EncounterFields },
  all: Entry[],
): ContentRecord {
  if (initial && initial.kind !== "encounter")
    throw new Error("Choose an encounter.");
  const fields = encounterFieldsSchema.parse(draft.fields);
  const candidate = recordSchema.parse({
    ...initial,
    id: initial?.id ?? uid(),
    kind: "encounter",
    title: draft.title,
    body: draft.body,
    tags: initial?.tags ?? [],
    category: initial?.category ?? "Campaign encounters",
    sources: initial?.sources ?? [],
    related: initial?.related ?? [],
    fields: {
      ...structuredClone(initial?.fields ?? {}),
      ...structuredClone(fields),
    },
  });
  // Dependency notes describe the current composition, rather than stale import metadata.
  const rows = inspectEncounter(
    { ...candidate, target: `local::${candidate.id}` },
    all,
    fields.heroCount,
  );
  candidate.fields.missing = rows.filter((r) => r.missing).map((r) => r.target);
  return candidate;
}

export function duplicateEncounter(entry: Entry): ContentRecord {
  if (entry.kind !== "encounter") throw new Error("Choose an encounter.");
  const fields = encounterFieldsSchema.parse(entry.fields);
  return recordSchema.parse({
    ...structuredClone(entry),
    id: uid(),
    title: `${entry.title.slice(0, 153)} (copy)`,
    origin: entry.target,
    related: entry.related.map((r) =>
      entry.pack && !r.includes("::")
        ? `${entry.pack.id}@${entry.pack.version}::${r}`
        : r,
    ),
    fields: {
      ...structuredClone(entry.fields),
      ...structuredClone(fields),
      entries: fields.entries.map((r) => ({ ...r, id: uid() })),
    },
  });
}
