import data from "./content/nexus-core.json";
import {
  packSchema,
  packKey,
  packTarget,
  type ContentRecord,
} from "./content-schema";
export const starterPack = packSchema.parse(data);
import { mapReferenceLinks } from "./references";

import monsters from "./content/nexus-monsters.json";
export const monsterPack = packSchema.parse(monsters);

// Original bundles remain available for rebuilding and migrating saved content.
const identities = {
  core: { id: "nimble-core-rules", version: starterPack.version },
  gmg: { id: "nimble-gmg", version: starterPack.version },
  heroes: { id: "nimble-heroes", version: starterPack.version },
};
type Book = keyof typeof identities;
function bookFor(record: ContentRecord): Book {
  if (
    record.kind === "monster" ||
    record.sources.some((s) => /GMG|Supplementary/.test(s.book))
  )
    return "gmg";
  if (record.sources.some((s) => /Heroes|Hexbinder/.test(s.book)))
    return "heroes";
  return "core";
}
const records = [...starterPack.records, ...monsterPack.records];
const destinations = new Map(
  records.map((record) => [record.id, identities[bookFor(record)]]),
);
export const legacyOfficialKeys = [starterPack, monsterPack].flatMap((pack) =>
  ["40527955eb7c6f4a242d508586580401f9e0431c", pack.version].map((version) =>
    packKey({ id: pack.id, version }),
  ),
);
export function remapOfficialReference(text: string) {
  text = mapReferenceLinks(text, (target) => {
    const separator = target.indexOf("::");
    if (!legacyOfficialKeys.includes(target.slice(0, separator))) return target;
    const id = target.slice(separator + 2);
    const destination = destinations.get(id.split("#")[0]);
    return destination ? packTarget(destination, id) : target;
  });
  // Match whole targets so IDs which are prefixes of other IDs stay distinct.
  for (const previousKey of legacyOfficialKeys) {
    const escape = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const remap = (id: string) => {
      const destination = destinations.get(id.split("#")[0]);
      return destination
        ? packTarget(destination, id)
        : `${previousKey}::${id}`;
    };
    text = text.replace(
      new RegExp(
        `${escape(previousKey)}::([a-zA-Z0-9_./-]+(?:#[a-zA-Z0-9_-]+)?)`,
        "g",
      ),
      (_, id: string) => remap(id),
    );
    text = text.replace(
      new RegExp(
        `${escape(encodeURIComponent(previousKey + "::"))}((?:[a-zA-Z0-9_.~-]|%[0-9A-Fa-f]{2})+)`,
        "g",
      ),
      (_, encoded: string) => {
        try {
          return encodeURIComponent(remap(decodeURIComponent(encoded)));
        } catch {
          return encodeURIComponent(previousKey + "::") + encoded;
        }
      },
    );
  }
  return text;
}
export const officialPacks = (Object.keys(identities) as Book[]).map((book) => {
  const identity = identities[book];
  return packSchema.parse({
    ...starterPack,
    ...identity,
    name: {
      core: "Nimble · Core Rules",
      gmg: "Nimble · GMG",
      heroes: "Nimble · Heroes",
    }[book],
    records: records
      .filter((record) => bookFor(record) === book)
      .map((record) => ({
        ...JSON.parse(JSON.stringify(record), (_, value) =>
          typeof value === "string" ? remapOfficialReference(value) : value,
        ),
        related: record.related.map((link) => {
          const destination = destinations.get(link.split("#")[0]);
          return destination && destination.id !== identity.id
            ? packTarget(destination, link)
            : link;
        }),
      })),
    terms: [...starterPack.terms, ...monsterPack.terms].filter(
      (term) => destinations.get(term.target.split("#")[0])?.id === identity.id,
    ),
    assets: book === "core" ? starterPack.assets : {},
  });
});
export const [coreRulesPack, gmgPack, heroesPack] = officialPacks;
export function officialReplacements(previousKey: string) {
  if (!legacyOfficialKeys.includes(previousKey)) return [];
  return previousKey.startsWith(`${monsterPack.id}@`)
    ? [gmgPack]
    : officialPacks;
}
