import { Capacitor } from "@capacitor/core";
import { appSchema, newApp, uid, type AppData } from "./model";
import { migrateApp } from "./migrations";
import { mergePacks, packKey } from "./content-schema";
import { digest, validateBundle, type StoredAsset } from "./backup";
import {
  ConflictError,
  Repository,
  freshResetData,
  type CommitOptions,
  type Recovery,
  type StorageBackend,
} from "./storage";
import { toBase64, fromBase64 } from "./native-files";

// Attachments live in SQLite, deduplicated by content hash. State and recovery
// points refer to immutable bytes; one SQL transaction commits every reference.
type AssetRef = {
  campaignId: string;
  id: string;
  hash: string;
  mime: string;
  size: number;
};
type Point = Omit<Recovery, "assets"> & { assets: AssetRef[] };
type Document = { data: unknown; assets: AssetRef[]; recovery: Point[] };
export interface NativeDatabase {
  query(
    sql: string,
    values?: unknown[],
  ): Promise<{ values?: Record<string, unknown>[] }>;
  run(sql: string, values?: unknown[], transaction?: boolean): Promise<unknown>;
  execute(sql: string, transaction?: boolean): Promise<unknown>;
  beginTransaction(): Promise<unknown>;
  commitTransaction(): Promise<unknown>;
  rollbackTransaction(): Promise<unknown>;
}
const key = (asset: Pick<AssetRef, "campaignId" | "id">) =>
  JSON.stringify([asset.campaignId, asset.id]);
export class NativeRepository implements StorageBackend {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private db: NativeDatabase,
    private legacy?: StorageBackend | (() => Promise<StorageBackend>),
  ) {}
  async initialize() {
    await this.db.execute(
      "CREATE TABLE IF NOT EXISTS slate_state (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS slate_blobs (hash TEXT PRIMARY KEY, bytes TEXT NOT NULL);",
      false,
    );
    return this;
  }
  private transaction<T>(action: () => Promise<T>): Promise<T> {
    const result = this.queue
      .catch(() => {})
      .then(async () => {
        await this.db.beginTransaction();
        try {
          const value = await action();
          await this.db.commitTransaction();
          return value;
        } catch (error) {
          try {
            await this.db.rollbackTransaction();
          } catch {
            /* Preserve the original failure. */
          }
          throw error;
        }
      });
    this.queue = result;
    return result;
  }
  private async document(): Promise<Document | undefined> {
    const result = await this.db.query(
      "SELECT payload FROM slate_state WHERE id=1",
    );
    return result.values?.length
      ? (JSON.parse(String(result.values[0].payload)) as Document)
      : undefined;
  }
  private async write(document: Document) {
    await this.db.run(
      "INSERT INTO slate_state(id,payload) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
      [JSON.stringify(document)],
      false,
    );
  }
  private async encode(assets: StoredAsset[]): Promise<AssetRef[]> {
    const refs: AssetRef[] = [];
    for (const asset of assets) {
      const bytes = new Uint8Array(await asset.blob.arrayBuffer());
      const hash = await digest(bytes);
      await this.db.run(
        "INSERT OR IGNORE INTO slate_blobs(hash,bytes) VALUES(?,?)",
        [hash, toBase64(bytes)],
        false,
      );
      refs.push({
        campaignId: asset.campaignId,
        id: asset.id,
        hash,
        mime: asset.blob.type,
        size: bytes.length,
      });
    }
    return refs;
  }
  private async decode(
    refs: AssetRef[],
    verify = true,
  ): Promise<StoredAsset[]> {
    const assets: StoredAsset[] = [];
    for (const ref of refs) {
      const result = await this.db.query(
        "SELECT bytes FROM slate_blobs WHERE hash=?",
        [ref.hash],
      );
      if (!result.values?.length)
        throw new Error(
          "A native attachment is missing. Export recovery data before making changes.",
        );
      const bytes = fromBase64(String(result.values[0].bytes));
      if (
        verify &&
        (bytes.length !== ref.size || (await digest(bytes)) !== ref.hash)
      )
        throw new Error("A native attachment checksum failed.");
      assets.push({
        campaignId: ref.campaignId,
        id: ref.id,
        blob: new Blob([bytes], { type: ref.mime }),
      });
    }
    return assets;
  }
  private checkpoint(document: Document, reason: string) {
    document.recovery = [
      {
        id: uid(),
        at: new Date().toISOString(),
        reason,
        data: document.data,
        assets: document.assets,
      },
      ...document.recovery,
    ].slice(0, 5);
  }
  private assert(data: AppData, refs: AssetRef[]) {
    if (new Set(refs.map(key)).size !== refs.length)
      throw new Error("Duplicate native attachments.");
    for (const campaign of data.campaigns)
      for (const meta of campaign.assets) {
        const ref = refs.find(
          (a) => a.campaignId === campaign.id && a.id === meta.id,
        );
        if (!ref || ref.size !== meta.size || ref.hash !== meta.sha256)
          throw new Error(`Missing or damaged attachment: ${meta.name}`);
      }
    if (
      refs.some(
        (a) =>
          !data.campaigns.some(
            (c) => c.id === a.campaignId && c.assets.some((m) => m.id === a.id),
          ),
      )
    )
      throw new Error("Unexpected native attachments.");
  }
  load() {
    return this.transaction(async () => {
      let document = await this.document();
      if (!document) {
        // Never overwrite the WebView database. An invalid legacy workspace
        // stops migration rather than silently starting a blank campaign.
        const legacy =
          typeof this.legacy === "function" ? await this.legacy() : this.legacy;
        const original = await legacy?.raw();
        const data =
          original?.data === undefined ? newApp() : migrateApp(original.data);
        const assets = original?.assets ?? [];
        for (const campaign of data.campaigns)
          await validateBundle({
            campaign,
            packs: data.packs.filter((p) =>
              campaign.packRefs.includes(packKey(p)),
            ),
            assets: assets.filter((a) => a.campaignId === campaign.id),
          });
        const recovery: Point[] = [];
        for (const point of ((await legacy?.recoveryPoints()) ?? []).slice(
          0,
          4,
        ))
          recovery.push({ ...point, assets: await this.encode(point.assets) });
        document = { data, assets: await this.encode(assets), recovery };
        if (original?.data !== undefined)
          document.recovery.unshift({
            id: uid(),
            at: new Date().toISOString(),
            reason: "Before moving WebView data to native storage",
            data: original.data,
            assets: document.assets,
          });
        await this.write(document);
      }
      const data = migrateApp(document.data);
      this.assert(data, document.assets);
      await this.decode(document.assets);
      if ((document.data as AppData).version !== data.version) {
        this.checkpoint(document, "Before native storage upgrade");
        data.revision++;
        document.data = data;
        await this.write(document);
      }
      return data;
    });
  }
  reset() {
    return this.transaction(async () => {
      let previousRevision: unknown;
      try {
        previousRevision = (
          (await this.document())?.data as { revision?: unknown } | undefined
        )?.revision;
      } catch {
        // A broken JSON envelope must not prevent an explicitly requested reset.
      }
      const data = freshResetData(previousRevision);
      await this.db.run("DELETE FROM slate_blobs", [], false);
      await this.write({ data, assets: [], recovery: [] });
      return data;
    });
  }
  save(data: AppData, expectedRevision: number, options: CommitOptions = {}) {
    const checked = appSchema.parse(data);
    return this.transaction(async () => {
      const document = await this.document();
      const previous = appSchema.safeParse(document?.data);
      if (
        !document ||
        !previous.success ||
        previous.data.revision !== expectedRevision
      )
        throw new ConflictError();
      mergePacks(previous.data.packs, checked.packs);
      const incoming = await this.encode(options.assets ?? []);
      const needed = (a: AssetRef) =>
        checked.campaigns.some(
          (c) => c.id === a.campaignId && c.assets.some((m) => m.id === a.id),
        );
      const next = [
        ...(options.replaceAssets
          ? []
          : document.assets.filter(
              (a) => needed(a) && !incoming.some((b) => key(a) === key(b)),
            )),
        ...incoming,
      ];
      this.assert(checked, next);
      if (options.checkpoint) this.checkpoint(document, options.checkpoint);
      if (options.purgeRecoveryCampaignId)
        document.recovery = document.recovery.filter(
          (p) =>
            !(p.data as AppData)?.campaigns?.some(
              (c) => c.id === options.purgeRecoveryCampaignId,
            ),
        );
      document.data = { ...checked, revision: expectedRevision + 1 };
      document.assets = next;
      await this.write(document);
      // Cleanup is in the same transaction. Recovery attachments remain alive.
      const live = new Set(
        [...next, ...document.recovery.flatMap((p) => p.assets)].map(
          (a) => a.hash,
        ),
      );
      for (const row of (await this.db.query("SELECT hash FROM slate_blobs"))
        .values ?? [])
        if (!live.has(String(row.hash)))
          await this.db.run(
            "DELETE FROM slate_blobs WHERE hash=?",
            [row.hash],
            false,
          );
      return expectedRevision + 1;
    });
  }
  raw() {
    return this.transaction(async () => {
      try {
        const document = await this.document();
        if (!document && this.legacy) {
          const legacy =
            typeof this.legacy === "function"
              ? await this.legacy()
              : this.legacy;
          return legacy.raw();
        }
        const data = document?.data;
        return {
          data,
          assets: await this.decode(document?.assets ?? [], false),
          packs: (data as AppData | undefined)?.packs ?? [],
        };
      } catch (error) {
        // A damaged envelope or base64 field must still be exportable verbatim.
        const state = await this.db.query(
          "SELECT payload FROM slate_state WHERE id=1",
        );
        if (!state.values?.length) throw error;
        const blobs = await this.db.query("SELECT hash,bytes FROM slate_blobs");
        return {
          data: {
            format: "slate-native-raw",
            version: 1,
            payload: state.values?.[0]?.payload ?? null,
            blobs: blobs.values ?? [],
          },
          assets: [],
          packs: [],
        };
      }
    });
  }
  async bundle(campaignId: string, expectedRevision: number) {
    const raw = await this.raw();
    const data = appSchema.parse(raw.data);
    if (data.revision !== expectedRevision) throw new ConflictError();
    const campaign = data.campaigns.find((c) => c.id === campaignId);
    if (!campaign) throw new Error("Campaign not found.");
    return {
      campaign,
      packs: data.packs.filter((p) => campaign.packRefs.includes(packKey(p))),
      assets: raw.assets.filter((a) => a.campaignId === campaignId),
    };
  }
  asset(campaignId: string, id: string) {
    return this.transaction(async () => {
      const ref = (await this.document())?.assets.find(
        (a) => a.campaignId === campaignId && a.id === id,
      );
      return ref ? (await this.decode([ref]))[0].blob : undefined;
    });
  }
  recoveryPoints() {
    return this.transaction(async () => {
      const points: Recovery[] = [];
      for (const point of (await this.document())?.recovery ?? [])
        points.push({ ...point, assets: await this.decode(point.assets) });
      return points.sort((a, b) => b.at.localeCompare(a.at));
    });
  }
}
let sqlite: import("@capacitor-community/sqlite").SQLiteConnection | undefined;
async function nativeConnection() {
  const { CapacitorSQLite, SQLiteConnection } =
    await import("@capacitor-community/sqlite");
  sqlite ??= new SQLiteConnection(CapacitorSQLite);
  return (await sqlite.isConnection("slate", false)).result
    ? sqlite.retrieveConnection("slate", false)
    : sqlite.createConnection("slate", false, "no-encryption", 1, false);
}
export async function openStorage(): Promise<StorageBackend> {
  if (!Capacitor.isNativePlatform()) return Repository.open();
  const connection = await nativeConnection();
  await connection.open();
  // SQLite retains the database in app-private storage across app upgrades.
  await connection.execute("PRAGMA synchronous=FULL;", false);
  return new NativeRepository(connection, () => Repository.open()).initialize();
}
export async function resetStorage(): Promise<StorageBackend> {
  if (!Capacitor.isNativePlatform()) return Repository.recreate();
  const connection = await nativeConnection();
  await connection.delete();
  await connection.open();
  await connection.execute("PRAGMA synchronous=FULL;", false);
  // Do not re-import legacy WebView data after a confirmed fresh start.
  return new NativeRepository(connection).initialize();
}
