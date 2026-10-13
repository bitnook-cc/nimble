import { z } from "zod";
import {
  nexusDocumentSchema,
  parseExchange,
  type ImportPreview,
} from "./exchange";
import type { Entry } from "./content";
import { creditNexusRecords } from "./nexus-attribution";

const MAX_BYTES = 8 * 1024 * 1024;
const types = ["monsters", "items", "encounters", "collections"] as const;
type Resource = z.infer<typeof nexusDocumentSchema>["included"][number];
const key = (r: Pick<Resource, "type" | "id">) => `${r.type}/${r.id}`;
const includes: Record<string, string> = {
  monsters: "families,creator",
  items: "creator",
  encounters: "monsters,creator",
  collections: "monsters,items,creator",
  families: "creator",
  users: "",
};
const linkSchema = z.object({
  type: z.string(),
  id: z.string().regex(/^[a-zA-Z0-9_.-]{1,100}$/),
});
function relationships(resource: Resource, name: string, type: string) {
  const value = resource.relationships?.[name];
  if (!value) return [];
  const { data } = z
    .object({
      data: z.union([linkSchema, z.array(linkSchema).max(1000), z.null()]),
    })
    .parse(value);
  const links = data === null ? [] : Array.isArray(data) ? data : [data];
  if (links.some((link) => link.type !== type))
    throw new Error("Nexus returned an unexpected dependency type.");
  return links;
}

export function nexusLink(input: string) {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Paste a public Nimble Nexus content link.");
  }
  if (
    url.protocol !== "https:" ||
    !["nimble.nexus", "nimble.monster"].includes(url.hostname) ||
    url.port ||
    url.username ||
    url.password
  )
    throw new Error("Use an HTTPS link from nimble.nexus.");
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "api") parts.shift();
  if (parts[0] === "m") parts[0] = "monsters";
  const type = parts[0];
  if (parts.length !== 2 || !types.some((t) => t === type))
    throw new Error(
      "Use a monster, item, encounter or collection link, rather than a search page.",
    );
  let slug: string;
  try {
    slug = decodeURIComponent(parts[1]);
  } catch {
    throw new Error("This Nexus link has an invalid identifier.");
  }
  if (!/^[a-zA-Z0-9_.-]{1,200}$/.test(slug))
    throw new Error("This Nexus link has an invalid identifier.");
  // Nexus page slugs end in the canonical 26-character identifier.
  const id = /(?:^|-)([a-zA-Z0-9]{26})$/.exec(slug)?.[1] ?? slug;
  return { type, id, url: `https://nimble.nexus/${type}/${id}` };
}

export async function fetchNexusImport(
  input: string,
  all: Entry[] = [],
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<ImportPreview> {
  const link = nexusLink(input);
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(
    () => controller.abort(new Error("Nexus import timed out. Try again.")),
    60000,
  );
  const resources = new Map<string, Resource>();
  const visited = new Set<string>();
  let bytes = 0,
    requests = 0;
  async function get(type: string, id: string) {
    if (++requests > 256)
      throw new Error(
        "This Nexus import has too many dependencies. Import a smaller collection.",
      );
    controller.signal.throwIfAborted();
    const url = new URL(
      `https://nimble.nexus/api/${type}/${encodeURIComponent(id)}`,
    );
    if (includes[type]) url.searchParams.set("include", includes[type]);
    const response = await fetcher(url.toString(), {
      headers: { Accept: "application/vnd.api+json" },
      credentials: "omit",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(
        [401, 403, 404].includes(response.status)
          ? "A Nexus entry is missing or private. Nothing has been imported."
          : `Nexus could not be reached (${response.status}). Try again.`,
      );
    if (!response.headers.get("content-type")?.includes("json"))
      throw new Error("Nexus did not return a JSON document.");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Nexus returned an empty response.");
    const chunks: Uint8Array[] = [];
    try {
      while (true) {
        const { value, done } = await reader.read();
        controller.signal.throwIfAborted();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_BYTES)
          throw new Error(
            "Nexus import exceeds 8 MiB, including dependencies.",
          );
        chunks.push(value);
      }
    } catch (error) {
      await reader.cancel();
      throw error;
    } finally {
      reader.releaseLock();
    }
    const decoder = new TextDecoder();
    const text =
      chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join("") +
      decoder.decode();
    const document = nexusDocumentSchema.parse(JSON.parse(text));
    const primary = Array.isArray(document.data)
      ? document.data
      : [document.data];
    if (
      primary.length !== 1 ||
      primary[0].type !== type ||
      primary[0].id !== id
    )
      throw new Error("Nexus returned an unexpected content document.");
    for (const resource of [...document.included, ...primary]) {
      const old = resources.get(key(resource));
      // Authoritative primary records replace the encounter's mini-statblocks.
      if (!old || primary.includes(resource))
        resources.set(key(resource), resource);
      if (resources.size > 1000)
        throw new Error("This Nexus import contains too many records.");
    }
    return primary[0];
  }
  try {
    const root = await get(link.type, link.id);
    while (true) {
      let resource = [...resources.values()].find((r) => !visited.has(key(r)));
      if (!resource) break;
      visited.add(key(resource));
      if (
        resource.type === "monsters" &&
        !(
          "abilities" in resource.attributes && "actions" in resource.attributes
        )
      )
        resource = await get(resource.type, resource.id);
      const dependencies = [
        ...(["encounters", "collections"].includes(resource.type)
          ? relationships(resource, "monsters", "monsters")
          : []),
        ...(resource.type === "collections"
          ? relationships(resource, "items", "items")
          : []),
        ...(resource.type === "monsters"
          ? relationships(resource, "families", "families")
          : []),
        ...(resource.type !== "users"
          ? relationships(resource, "creator", "users")
          : []),
      ];
      for (const dependency of dependencies)
        if (!resources.has(key(dependency)))
          await get(dependency.type, dependency.id);
    }
    const preview = parseExchange(
      JSON.stringify({
        data: resources.get(key(root)),
        included: [...resources.values()].filter((r) => key(r) !== key(root)),
      }),
      all,
    );
    if (preview.records.some((r) => r.fields.incomplete))
      throw new Error(
        "Nexus did not supply all required statblocks or family abilities. Nothing has been imported.",
      );
    for (const record of preview.records) {
      const exchange = record.fields.exchange as { resource?: Resource };
      if (!exchange.resource) continue;
      const authorLink = relationships(
        exchange.resource,
        "creator",
        "users",
      )[0];
      const author = authorLink ? resources.get(key(authorLink)) : undefined;
      const attribution =
        author?.attributes.displayName ?? author?.attributes.username;
      record.fields.nexus = {
        url: `https://nimble.nexus/${exchange.resource.type}/${exchange.resource.id}`,
        importedAt: new Date().toISOString(),
        ...(typeof attribution === "string" ? { creator: attribution } : {}),
      };
      if (typeof attribution === "string")
        record.sources.push({
          book: `Nimble Nexus · ${attribution}`.slice(0, 160),
        });
    }
    return {
      ...preview,
      records: creditNexusRecords(preview.records),
      name:
        typeof root.attributes.name === "string"
          ? root.attributes.name
          : "Nexus content",
      sourceUrl: link.url,
    };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
