import {
  documentReferences,
  type RelationshipReference,
} from "./document-markdown";

const PARSER_VERSION = 2;
type CachedDocument = { source: string; hash: string; errors: string[] };
export type CachedRelationship = RelationshipReference & {
  key: string;
  campaign: string;
  targetDocument: string;
};
type Bundle = {
  key: string;
  campaign: string;
  source: string;
  references: CachedRelationship[];
  targetKeys: string[];
  tagKeys: string[];
};
type Source = { target: string; body: string };
const request = <T>(value: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error);
  });
const complete = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = tx.onerror = () =>
      reject(tx.error ?? new Error("Relationship cache transaction failed."));
  });
async function fingerprint(body: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(PARSER_VERSION + "\n" + body),
  );
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
export class RelationshipCache {
  private queue: Promise<unknown> = Promise.resolve();
  private database?: Promise<IDBDatabase>;
  private versions = new Map<string, number>();
  private hashes = new Map<string, { body: string; hash: string }>();
  constructor(private name = "nimble-slate-relationships") {}
  private open() {
    return (this.database ??= new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open(this.name, 2);
      opening.onupgradeneeded = () => {
        // Only disposable derived stores are replaced; campaign data is elsewhere.
        for (const name of [...opening.result.objectStoreNames])
          opening.result.deleteObjectStore(name);
        opening.result.createObjectStore("documents", { keyPath: "key" });
        const relationships = opening.result.createObjectStore(
          "relationships",
          { keyPath: "key" },
        );
        relationships.createIndex("campaign", "campaign");
        relationships.createIndex("source", ["campaign", "source"]);
        relationships.createIndex("target", "targetKeys", { multiEntry: true });
        relationships.createIndex("tags", "tagKeys", { multiEntry: true });
      };
      opening.onsuccess = () => {
        opening.result.onversionchange = () => {
          opening.result.close();
          this.database = undefined;
        };
        resolve(opening.result);
      };
      opening.onerror = () => {
        this.database = undefined;
        reject(opening.error);
      };
      opening.onblocked = () => {
        this.database = undefined;
        reject(
          new Error(
            "Close other Slate tabs and rebuild the relationship cache.",
          ),
        );
      };
    }));
  }
  sync(campaign: string, sources: Source[], rebuild = false) {
    const version = (this.versions.get(campaign) ?? 0) + 1;
    this.versions.set(campaign, version);
    const task = this.queue
      .catch(() => {})
      .then(() => this.synchronize(campaign, sources, rebuild, version));
    this.queue = task;
    return task;
  }
  private async synchronize(
    campaign: string,
    sources: Source[],
    rebuild: boolean,
    version: number,
  ) {
    const cancelled = () => this.versions.get(campaign) !== version;
    const empty = () => ({
      relationships: [] as CachedRelationship[],
      errors: [] as { source: string; errors: string[] }[],
    });
    if (cancelled()) return empty();
    const db = await this.open();
    const read = db.transaction(["documents", "relationships"]),
      readDone = complete(read);
    const [manifest, oldBundles] = await Promise.all([
      request(read.objectStore("documents").get(campaign)) as Promise<
        { documents: CachedDocument[] } | undefined
      >,
      request(
        read.objectStore("relationships").index("campaign").getAll(campaign),
      ) as Promise<Bundle[]>,
    ]);
    await readDone;
    const oldDocuments = Array.isArray(manifest?.documents)
      ? manifest.documents
      : [];
    const previous = new Map(
      oldDocuments.map((document) => [document.source, document]),
    );
    const sourceIds = new Set(sources.map((source) => source.target));
    const changed = new Set(
      oldDocuments
        .filter((document) => !sourceIds.has(document.source))
        .map((document) => document.source),
    );
    // Batch WebCrypto work too: serial awaits are expensive in native WebViews.
    const digests = await Promise.all(
      sources.map(async (source) => {
        const cached = this.hashes.get(source.target);
        const hash =
          cached?.body === source.body
            ? cached.hash
            : await fingerprint(source.body);
        this.hashes.set(source.target, { body: source.body, hash });
        return hash;
      }),
    );
    if (cancelled()) return empty();
    const documents: CachedDocument[] = [],
      bundles: Bundle[] = [];
    for (const [i, source] of sources.entries()) {
      const hash = digests[i];
      if (!rebuild && previous.get(source.target)?.hash === hash) continue;
      changed.add(source.target);
      const parsed = documentReferences(source.body, source.target);
      documents.push({ source: source.target, hash, errors: parsed.errors });
      const references = parsed.references.map((ref, index) => ({
        ...ref,
        key: JSON.stringify([campaign, source.target, index]),
        campaign,
        targetDocument: ref.target.split("#")[0],
      }));
      if (references.length)
        bundles.push({
          key: JSON.stringify([campaign, source.target]),
          campaign,
          source: source.target,
          references,
          targetKeys: [
            ...new Set(
              references.map((ref) =>
                JSON.stringify([campaign, ref.targetDocument]),
              ),
            ),
          ],
          tagKeys: [
            ...new Set(
              references.flatMap((ref) =>
                ref.tags.map((tag) => JSON.stringify([campaign, tag])),
              ),
            ),
          ],
        });
    }
    if (this.hashes.size > 10000) this.hashes.clear();
    if (cancelled()) return empty();
    const nextDocuments = [
      ...oldDocuments.filter((row) => !changed.has(row.source)),
      ...documents,
    ];
    if (changed.size || rebuild) {
      const tx = db.transaction(["documents", "relationships"], "readwrite"),
        done = complete(tx);
      try {
        for (const row of oldBundles)
          if (rebuild || changed.has(row.source))
            tx.objectStore("relationships").delete(row.key);
        tx.objectStore("documents").put({
          key: campaign,
          documents: nextDocuments,
        });
        for (const row of bundles) tx.objectStore("relationships").put(row);
      } catch (error) {
        tx.abort();
        await done.catch(() => {});
        throw error;
      }
      await done;
    }
    return {
      relationships: await this.query(campaign),
      errors: nextDocuments
        .filter((row) => row.errors.length)
        .map((row) => ({ source: row.source, errors: row.errors })),
    };
  }
  async query(
    campaign: string,
    filter: { source?: string; target?: string; tag?: string } = {},
  ) {
    const db = await this.open(),
      tx = db.transaction("relationships"),
      done = complete(tx);
    const store = tx.objectStore("relationships");
    const index = filter.source
      ? "source"
      : filter.target
        ? "target"
        : filter.tag
          ? "tags"
          : "campaign";
    const key = filter.source
      ? [campaign, filter.source]
      : filter.target
        ? JSON.stringify([campaign, filter.target])
        : filter.tag
          ? JSON.stringify([campaign, filter.tag])
          : campaign;
    const bundles = (await request(store.index(index).getAll(key))) as Bundle[];
    await done;
    if (bundles.some((bundle) => !Array.isArray(bundle.references)))
      throw new Error(
        "The relationship cache is invalid. Rebuild it from Markdown.",
      );
    const rows = bundles.flatMap((bundle) => bundle.references);
    if (
      rows.some(
        (row) =>
          typeof row.source !== "string" ||
          typeof row.target !== "string" ||
          typeof row.targetDocument !== "string" ||
          typeof row.label !== "string" ||
          !Array.isArray(row.tags) ||
          row.tags.some((tag) => typeof tag !== "string") ||
          !["header", "inline"].includes(row.origin) ||
          !Number.isInteger(row.start) ||
          !Number.isInteger(row.end),
      )
    )
      throw new Error(
        "The relationship cache is invalid. Rebuild it from Markdown.",
      );
    return rows.filter(
      (row) =>
        (!filter.source || row.source === filter.source) &&
        (!filter.target || row.targetDocument === filter.target) &&
        (!filter.tag || row.tags.includes(filter.tag)),
    );
  }
  clear(campaign?: string) {
    for (const [id, version] of this.versions)
      if (!campaign || id === campaign) this.versions.set(id, version + 1);
    this.hashes.clear();
    const task = this.queue
      .catch(() => {})
      .then(async () => {
        const db = await this.open();
        let keys: IDBValidKey[] = [];
        if (campaign) {
          const read = db.transaction("relationships"),
            done = complete(read);
          keys = await request(
            read
              .objectStore("relationships")
              .index("campaign")
              .getAllKeys(campaign),
          );
          await done;
        }
        const tx = db.transaction(["documents", "relationships"], "readwrite"),
          done = complete(tx);
        if (campaign) {
          tx.objectStore("documents").delete(campaign);
          for (const key of keys) tx.objectStore("relationships").delete(key);
        } else {
          tx.objectStore("documents").clear();
          tx.objectStore("relationships").clear();
        }
        await done;
      });
    this.queue = task;
    return task;
  }
  async close() {
    if (this.database) (await this.database).close();
    this.database = undefined;
  }
}
export const relationshipCache = new RelationshipCache();
