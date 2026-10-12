import { packKey, mergePacks, type ContentPack } from "./content-schema";
import { appSchema, SCHEMA_VERSION, newApp, uid, type AppData } from "./model";
import { migrateApp } from "./migrations";
import { copyCampaign } from "./campaigns";
import {
  validateBundle,
  type CampaignBundle,
  type StoredAsset,
} from "./backup";

export class ConflictError extends Error {
  constructor() {
    super(
      "This campaign was changed in another tab. Export your unsaved copy, then reload to use the latest saved version.",
    );
  }
}
export type Recovery = {
  id: string;
  at: string;
  reason: string;
  data: unknown;
  assets: StoredAsset[];
};
export type CommitOptions = {
  assets?: StoredAsset[];
  checkpoint?: string;
  replaceAssets?: boolean;
  purgeRecoveryCampaignId?: string;
};
type PersistedAsset = Omit<StoredAsset, "blob"> & {
  blob: Blob | { bytes: ArrayBuffer; type: string };
};
type PersistedRecovery = Omit<Recovery, "assets"> & {
  assets: PersistedAsset[];
};
function decodeAsset(asset: PersistedAsset): StoredAsset {
  return {
    ...asset,
    // Retain support for attachments saved by earlier releases.
    blob:
      asset.blob instanceof Blob
        ? asset.blob
        : new Blob([asset.blob.bytes], { type: asset.blob.type }),
  };
}
async function encodeAsset(asset: StoredAsset): Promise<PersistedAsset> {
  return {
    ...asset,
    blob: { bytes: await asset.blob.arrayBuffer(), type: asset.blob.type },
  };
}
function assertAssets(data: AppData, assets: StoredAsset[]) {
  for (const c of data.campaigns)
    for (const a of c.assets) {
      const stored = assets.find(
        (item) => item.campaignId === c.id && item.id === a.id,
      );
      if (
        !stored ||
        !(stored.blob instanceof Blob) ||
        stored.blob.size !== a.size
      )
        throw new Error(`Missing attachment: ${a.name}`);
    }
}
function addCheckpoint(
  tx: IDBTransaction,
  reason: string,
  data: unknown,
  assets: PersistedAsset[],
) {
  const store = tx.objectStore("recovery");
  const point: PersistedRecovery = {
    id: uid(),
    at: new Date().toISOString(),
    reason,
    data,
    assets,
  };
  store.add(point, point.id);
  const request = store.getAll();
  request.onsuccess = () => {
    const entries = (request.result as Recovery[])
      .filter((entry) => entry.id !== point.id)
      .sort((a, b) => b.at.localeCompare(a.at));
    for (const entry of entries.slice(4)) store.delete(entry.id);
  };
}
export class Repository {
  constructor(private database: IDBDatabase) {}
  static open(name = "nimble-slate"): Promise<Repository> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 3);
      request.onupgradeneeded = () => {
        for (const store of ["state", "assets", "recovery", "packs"])
          if (!request.result.objectStoreNames.contains(store))
            request.result.createObjectStore(store);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(new Error("Close other Slate tabs to finish opening storage."));
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(new Repository(request.result));
      };
    });
  }
  load(): Promise<AppData> {
    return new Promise((resolve, reject) => {
      const tx = this.database.transaction(
        ["state", "assets", "recovery", "packs"],
        "readwrite",
      );
      const store = tx.objectStore("state");
      const raw = store.get("app");
      const assets = tx.objectStore("assets").getAll();
      const packs = tx.objectStore("packs").getAll();
      let result: AppData;
      let failure: unknown;
      packs.onsuccess = () => {
        try {
          const hydrated = [
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            SCHEMA_VERSION,
          ].includes(raw.result?.version)
            ? { ...raw.result, packs: packs.result }
            : raw.result;
          result = raw.result === undefined ? newApp() : migrateApp(hydrated);
          assertAssets(
            result,
            (assets.result as PersistedAsset[]).map(decodeAsset),
          );
          if (raw.result === undefined)
            store.add({ ...result, packs: [] }, "app");
          else if (raw.result.version !== result.version) {
            addCheckpoint(
              tx,
              "Before storage upgrade",
              hydrated,
              assets.result,
            );
            result.revision++;
            store.put({ ...result, packs: [] }, "app");
          }
          if (
            raw.result === undefined ||
            raw.result.version !== result.version
          ) {
            // The checkpoint retains predecessor packs. Replace the active
            // store atomically so retired versions do not consume pack slots.
            tx.objectStore("packs").clear();
            for (const pack of result.packs)
              tx.objectStore("packs").put(pack, packKey(pack));
          }
        } catch (e) {
          failure = e;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = tx.onerror = () =>
        reject(failure ?? tx.error ?? new Error("Unable to load saved data."));
    });
  }
  save(
    data: AppData,
    expectedRevision: number,
    options: CommitOptions = {},
  ): Promise<number> {
    const checked = appSchema.parse(data);
    // Convert before opening the transaction; awaiting file reads inside an
    // IndexedDB transaction can make it inactive. Bytes work on WebKit too.
    return Promise.all((options.assets ?? []).map(encodeAsset)).then(
      (encoded) =>
        new Promise<number>((resolve, reject) => {
          const tx = this.database.transaction(
            ["state", "assets", "recovery", "packs"],
            "readwrite",
          );
          const state = tx.objectStore("state");
          const assetStore = tx.objectStore("assets");
          const raw = state.get("app");
          const stored = assetStore.getAll();
          const packs = tx.objectStore("packs").getAll();
          let failure: unknown;
          packs.onsuccess = () => {
            try {
              if (
                raw.result?.revision !== expectedRevision ||
                raw.result?.version !== SCHEMA_VERSION
              )
                throw new ConflictError();
              const incoming = options.assets ?? [];
              const needed = (a: StoredAsset) =>
                checked.campaigns.some(
                  (c) =>
                    c.id === a.campaignId &&
                    c.assets.some((meta) => meta.id === a.id),
                );
              const retained = options.replaceAssets
                ? []
                : (stored.result as PersistedAsset[])
                    .map(decodeAsset)
                    .filter(
                      (a) =>
                        needed(a) &&
                        !incoming.some(
                          (b) => b.campaignId === a.campaignId && b.id === a.id,
                        ),
                    );
              const nextAssets = [...retained, ...incoming];
              if (
                incoming.some((a) => !needed(a)) ||
                new Set(
                  nextAssets.map((a) => JSON.stringify([a.campaignId, a.id])),
                ).size !== nextAssets.length
              )
                throw new Error("Unexpected or duplicate attachments.");
              assertAssets(checked, nextAssets);
              if (options.checkpoint)
                addCheckpoint(
                  tx,
                  options.checkpoint,
                  { ...raw.result, packs: packs.result },
                  stored.result,
                );
              if (options.purgeRecoveryCampaignId) {
                const recovery = tx.objectStore("recovery");
                const points = recovery.getAll();
                points.onsuccess = () => {
                  for (const point of points.result as Recovery[]) {
                    const rawData = point.data as {
                      campaigns?: { id: string }[];
                    };
                    if (
                      rawData.campaigns?.some(
                        (c) => c.id === options.purgeRecoveryCampaignId,
                      )
                    )
                      recovery.delete(point.id);
                  }
                };
              }
              for (const a of stored.result as StoredAsset[])
                if (options.replaceAssets || !needed(a))
                  assetStore.delete([a.campaignId, a.id]);
              for (const a of encoded) assetStore.put(a, [a.campaignId, a.id]);
              const previous = packs.result as ContentPack[];
              mergePacks(previous, checked.packs);
              for (const p of checked.packs)
                if (!previous.some((old) => packKey(old) === packKey(p)))
                  tx.objectStore("packs").put(p, packKey(p));
              for (const p of previous)
                if (!checked.packs.some((next) => packKey(next) === packKey(p)))
                  tx.objectStore("packs").delete(packKey(p));
              state.put(
                { ...checked, packs: [], revision: expectedRevision + 1 },
                "app",
              );
            } catch (e) {
              failure = e;
              tx.abort();
            }
          };
          tx.oncomplete = () => resolve(expectedRevision + 1);
          tx.onabort = tx.onerror = () =>
            reject(failure ?? tx.error ?? new Error("Unable to save."));
        }),
    );
  }
  asset(campaignId: string, id: string): Promise<Blob | undefined> {
    return new Promise((resolve, reject) => {
      const tx = this.database.transaction("assets", "readonly");
      const request = tx.objectStore("assets").get([campaignId, id]);
      tx.oncomplete = () =>
        resolve(request.result ? decodeAsset(request.result).blob : undefined);
      tx.onabort = tx.onerror = () =>
        reject(tx.error ?? new Error("Unable to read the local image."));
    });
  }
  raw(): Promise<{
    data: unknown;
    assets: StoredAsset[];
    packs: ContentPack[];
  }> {
    return new Promise((resolve, reject) => {
      const tx = this.database.transaction(
        ["state", "assets", "packs"],
        "readonly",
      );
      const data = tx.objectStore("state").get("app");
      const assets = tx.objectStore("assets").getAll();
      const packs = tx.objectStore("packs").getAll();
      tx.oncomplete = () =>
        resolve({
          data: [
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            SCHEMA_VERSION,
          ].includes(data.result?.version)
            ? { ...data.result, packs: packs.result }
            : data.result,
          assets: (assets.result as PersistedAsset[]).map(decodeAsset),
          packs: packs.result,
        });
      tx.onabort = tx.onerror = () =>
        reject(tx.error ?? new Error("Unable to read stored data."));
    });
  }
  async bundle(
    campaignId: string,
    expectedRevision: number,
  ): Promise<CampaignBundle> {
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
  recoveryPoints(): Promise<Recovery[]> {
    return new Promise((resolve, reject) => {
      const tx = this.database.transaction("recovery");
      const request = tx.objectStore("recovery").getAll();
      tx.oncomplete = () =>
        resolve(
          (request.result as PersistedRecovery[])
            .map((point) => ({
              ...point,
              assets: point.assets.map(decodeAsset),
            }))
            .sort((a, b) => b.at.localeCompare(a.at)),
        );
      tx.onabort = tx.onerror = () => reject(tx.error);
    });
  }
  close() {
    this.database.close();
  }
}

// A native durable adapter must satisfy the same transactional contract.
export type StorageBackend = Pick<
  Repository,
  "load" | "save" | "raw" | "bundle" | "recoveryPoints" | "asset"
>;
type Snapshot = {
  data: AppData | null;
  status: "loading" | "saved" | "saving" | "error";
  error: string;
  conflict: boolean;
  busy: boolean;
};
export class AppStore {
  private snapshot: Snapshot = {
    data: null,
    status: "loading",
    error: "",
    conflict: false,
    busy: false,
  };
  private listeners = new Set<() => void>();
  private repository?: StorageBackend;
  private revision = 0;
  private generation = 0;
  private flushing?: Promise<void>;
  private initializing?: Promise<void>;
  constructor(
    private openRepository: () => Promise<StorageBackend> = () =>
      import("./native-storage").then(({ openStorage }) => openStorage()),
  ) {}
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.snapshot;
  private emit(next: Snapshot) {
    this.snapshot = next;
    this.listeners.forEach((fn) => fn());
  }
  init() {
    return (this.initializing ??= this.initialize());
  }
  private async initialize() {
    try {
      this.repository = await this.openRepository();
      const data = await this.repository.load();
      this.revision = data.revision;
      this.emit({
        data,
        status: "saved",
        error: "",
        conflict: false,
        busy: false,
      });
    } catch (e) {
      this.emit({
        ...this.snapshot,
        status: "error",
        error: `Cannot open local data. ${String(e)}`,
      });
    }
  }
  update(transform: (data: AppData) => AppData) {
    if (!this.snapshot.data || this.snapshot.conflict || this.snapshot.busy)
      return;
    const data = appSchema.parse(transform(this.snapshot.data));
    this.generation++;
    this.emit({
      ...this.snapshot,
      data,
      status: "saving",
      error: "",
      conflict: false,
    });
    void this.flush();
  }
  retry = () => {
    if (!this.snapshot.conflict) void this.flush();
  };
  private flush() {
    return (this.flushing ??= this.persist().finally(() => {
      this.flushing = undefined;
    }));
  }
  private async persist() {
    if (
      !this.repository ||
      !this.snapshot.data ||
      this.snapshot.status === "saved"
    )
      return;
    try {
      let captured: number;
      do {
        captured = this.generation;
        this.revision = await this.repository.save(
          this.snapshot.data!,
          this.revision,
        );
      } while (captured !== this.generation);
      this.emit({
        ...this.snapshot,
        data: { ...this.snapshot.data!, revision: this.revision },
        status: "saved",
        error: "",
      });
    } catch (e) {
      this.emit({
        ...this.snapshot,
        status: "error",
        error: `Changes are not saved. ${String(e)}`,
        conflict: e instanceof ConflictError,
      });
    }
  }
  private async exclusive<T>(
    fn: (repo: StorageBackend, data: AppData) => Promise<T>,
  ): Promise<T> {
    if (this.snapshot.busy || !this.repository || !this.snapshot.data)
      throw new Error("Storage is not ready.");
    this.emit({ ...this.snapshot, busy: true });
    try {
      await this.flush();
      if (this.snapshot.status !== "saved" || this.snapshot.conflict)
        throw new Error("Save or recover your pending changes first.");
      return await fn(this.repository, this.snapshot.data!);
    } catch (e) {
      if (e instanceof ConflictError)
        this.emit({
          ...this.snapshot,
          status: "error",
          conflict: true,
          error: e.message,
        });
      throw e;
    } finally {
      this.emit({ ...this.snapshot, busy: false });
    }
  }
  private async commit(
    repo: StorageBackend,
    data: AppData,
    options?: CommitOptions,
  ) {
    this.revision = await repo.save(data, this.revision, options);
    this.emit({
      ...this.snapshot,
      data: { ...data, revision: this.revision },
      status: "saved",
      error: "",
      conflict: false,
    });
  }
  change(transform: (data: AppData) => AppData, options?: CommitOptions) {
    return this.exclusive((repo, data) =>
      this.commit(repo, transform(data), options),
    );
  }
  async asset(campaignId: string, id: string) {
    await this.init();
    if (!this.repository) throw new Error("Local storage is unavailable.");
    return this.repository.asset(campaignId, id);
  }
  bundle(id: string) {
    return this.exclusive((repo) => repo.bundle(id, this.revision));
  }
  duplicate(id: string) {
    return this.exclusive(async (repo, data) => {
      const original = await repo.bundle(id, this.revision);
      await validateBundle(original);
      const campaign = copyCampaign(original.campaign);
      const assets = original.assets.map((a) => ({
        ...a,
        campaignId: campaign.id,
        id: campaign.assets[
          original.campaign.assets.findIndex((meta) => meta.id === a.id)
        ].id,
      }));
      await this.commit(
        repo,
        {
          ...data,
          campaigns: [...data.campaigns, campaign],
          activeCampaignId: campaign.id,
        },
        { assets },
      );
    });
  }
  restore(bundle: CampaignBundle, mode: "copy" | "original") {
    return this.exclusive(async (repo, data) => {
      await validateBundle(bundle);
      const campaign =
        mode === "copy"
          ? copyCampaign(bundle.campaign)
          : structuredClone(bundle.campaign);
      campaign.archivedAt = null;
      const assets = bundle.assets.map((a) => ({
        ...a,
        campaignId: campaign.id,
        id: campaign.assets[
          bundle.campaign.assets.findIndex((meta) => meta.id === a.id)
        ].id,
      }));
      const exists = data.campaigns.some((c) => c.id === campaign.id);
      await this.commit(
        repo,
        {
          ...data,
          packs: mergePacks(data.packs, bundle.packs ?? []),
          campaigns: [
            ...data.campaigns.filter((c) => c.id !== campaign.id),
            campaign,
          ],
          activeCampaignId: campaign.id,
        },
        {
          assets,
          checkpoint: exists
            ? `Before replacing ${data.campaigns.find((c) => c.id === campaign.id)!.name}`
            : undefined,
        },
      );
    });
  }
  recoveryPoints() {
    if (!this.repository)
      return Promise.reject(new Error("Storage is not open."));
    return this.repository.recoveryPoints();
  }
  recover(id: string) {
    return this.exclusive(async (repo) => {
      const point = (await repo.recoveryPoints()).find((p) => p.id === id);
      if (!point) throw new Error("Recovery point is no longer available.");
      const data = migrateApp(point.data);
      for (const campaign of data.campaigns)
        await validateBundle({
          campaign,
          packs: data.packs.filter((p) =>
            campaign.packRefs.includes(packKey(p)),
          ),
          assets: point.assets.filter((a) => a.campaignId === campaign.id),
        });
      await this.commit(repo, data, {
        assets: point.assets,
        replaceAssets: true,
        checkpoint: "Before restoring a recovery point",
      });
    });
  }
  async raw() {
    if (!this.repository) throw new Error("Storage could not be opened.");
    return this.repository.raw();
  }
}
export const appStore = new AppStore();
