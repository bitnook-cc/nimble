import "fake-indexeddb/auto";
import { IDBObjectStore } from "fake-indexeddb";
import { afterEach, describe, expect, it, vi } from "vitest";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { AppStore, Repository } from "./storage";
import { appSchema, newApp, newCampaign, legacyCampaignSchema } from "./model";
import { copyCampaign, selectAfterRemoval } from "./campaigns";
import { roll } from "./rolls";
import {
  decodeBackup,
  digest,
  encodeBackup,
  type CampaignBundle,
} from "./backup";

const connections: Repository[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  connections.splice(0).forEach((r) => r.close());
});
async function repository(name = crypto.randomUUID()) {
  const r = await Repository.open(name);
  connections.push(r);
  return r;
}
async function store() {
  const repo = await repository();
  const app = new AppStore(async () => repo);
  await app.init();
  return { app, repo };
}
function legacy() {
  const current = newApp();
  return {
    ...current,
    version: 1,
    campaigns: current.campaigns.map((c) =>
      legacyCampaignSchema.parse({
        id: c.id,
        name: c.name,
        grid: c.screens[0].grid,
        tools: c.tools,
        widgets: c.screens[0].widgets,
      }),
    ),
  };
}
async function seed(name: string, data: unknown) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("state");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    tx.objectStore("state").put(data, "app");
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
  });
  db.close();
}
async function fixture(): Promise<CampaignBundle> {
  const campaign = newCampaign("Lantern Coast");
  const t = campaign.tools.find((t) => t.kind === "initiative")!;
  if (t.kind !== "initiative") throw new Error("Missing tracker");
  const creature = {
    id: "hero-a",
    name: "Mira",
    side: "hero" as const,
    initiative: 18,
    hp: 7,
    maxHp: 20,
    conditions: "Dazed",
    notes: "Keep this note",
  };
  t.run = {
    ...t.run,
    round: 4,
    status: "paused",
    activeId: creature.id,
    combatants: [creature],
  };
  t.history = [{ ...t.run, round: 3, combatants: [{ ...creature, hp: 9 }] }];
  const dice = campaign.tools.find((t) => t.kind === "dice")!;
  if (dice.kind === "dice") {
    dice.presets.push({
      id: "preset-a",
      name: "Sword",
      formula: "1d8+2",
      options: dice.options,
    });
    dice.rolls.push(roll("1d8+2", dice.options));
  }
  const bytes = strToU8("a local handout, with accents: é");
  campaign.assets = [
    {
      id: "asset-a",
      name: "handout.txt",
      size: bytes.length,
      mime: "text/plain",
      sha256: await digest(bytes),
    },
  ];
  return {
    campaign,
    assets: [
      {
        id: "asset-a",
        campaignId: campaign.id,
        blob: new Blob([bytes], { type: "text/plain" }),
      },
    ],
  };
}

describe("versioned upgrades and campaign lifecycle", () => {
  it("migrates v1 without changing IDs, tools or layouts and saves an original recovery point", async () => {
    const name = crypto.randomUUID();
    const before = legacy();
    await seed(name, before);
    const repo = await repository(name);
    const after = await repo.load();
    expect(after.version).toBe(16);
    expect(after.revision).toBe(1);
    expect(after.campaigns[0].id).toBe(before.campaigns[0].id);
    expect(after.campaigns[0].screens[0]).toMatchObject({
      grid: before.campaigns[0].grid,
      widgets: before.campaigns[0].widgets,
    });
    expect(after.campaigns[0].tools).toMatchObject(before.campaigns[0].tools);
    expect((await repo.recoveryPoints())[0].data).toEqual(before);
    await repo.load();
    expect(await repo.recoveryPoints()).toHaveLength(1);
  });
  it("retains original data when a migration cannot validate or commit", async () => {
    const name = crypto.randomUUID();
    const before = legacy();
    await seed(name, before);
    const repo = await repository(name);
    const put = vi
      .spyOn(IDBObjectStore.prototype, "put")
      .mockImplementation(() => {
        throw new DOMException("No room", "QuotaExceededError");
      });
    await expect(repo.load()).rejects.toThrow("No room");
    put.mockRestore();
    expect((await repo.raw()).data).toEqual(before);
    expect(await repo.recoveryPoints()).toHaveLength(0);
    const badName = crypto.randomUUID();
    const bad = { ...legacy(), version: 999 };
    await seed(badName, bad);
    const badRepo = await repository(badName);
    await expect(badRepo.load()).rejects.toThrow("different version");
    expect((await badRepo.raw()).data).toEqual(bad);
    const brokenName = crypto.randomUUID();
    const broken = legacy();
    broken.campaigns[0].widgets[0].toolId = "absent";
    await seed(brokenName, broken);
    const brokenRepo = await repository(brokenName);
    await expect(brokenRepo.load()).rejects.toThrow();
    expect((await brokenRepo.raw()).data).toEqual(broken);
  });
  it("does not recreate a default campaign after archiving or deleting the last one", async () => {
    const repo = await repository();
    let data = await repo.load();
    const id = data.activeCampaignId!;
    data = selectAfterRemoval(
      data,
      data.campaigns.map((c) => ({
        ...c,
        archivedAt: new Date().toISOString(),
      })),
      id,
    );
    await repo.save(data, 0);
    expect((await repo.load()).activeCampaignId).toBeNull();
    await repo.save({ ...data, campaigns: [] }, 1);
    expect((await repo.load()).campaigns).toHaveLength(0);
  });
  it("duplicates all IDs while preserving links across combat history and leaving the source unchanged", async () => {
    const { campaign } = await fixture();
    const before = structuredClone(campaign);
    const copy = copyCampaign(campaign);
    expect(campaign).toEqual(before);
    expect(copy.id).not.toBe(campaign.id);
    expect(copy.screens[0].widgets[0].toolId).toBe(copy.tools[0].id);
    expect(copy.tools[0].id).not.toBe(campaign.tools[0].id);
    const t = copy.tools[0];
    if (t.kind !== "initiative") throw new Error("Missing tracker");
    expect(t.run.activeId).toBe(t.run.combatants[0].id);
    expect(t.history[0].activeId).toBe(t.run.activeId);
    expect(t.run.activeId).not.toBe("hero-a");
    expect(copy.assets[0].id).not.toBe("asset-a");
    expect(
      appSchema.parse({
        ...newApp(),
        activeCampaignId: copy.id,
        campaigns: [copy],
      }),
    ).toBeTruthy();
  });
});

describe("portable backups and atomic recovery", () => {
  it("round-trips campaign meaning and asset bytes, preserving original IDs into an empty installation", async () => {
    const original = await fixture();
    const restored = await decodeBackup(await encodeBackup(original));
    expect(restored.campaign).toEqual(original.campaign);
    expect(await restored.assets[0].blob.text()).toBe(
      await original.assets[0].blob.text(),
    );
    const { app, repo } = await store();
    await app.change((d) => ({
      ...d,
      campaigns: [],
      activeCampaignId: null,
      palette: "stone",
    }));
    await app.restore(restored, "original");
    const loaded = await repo.load();
    expect(loaded.campaigns).toEqual([original.campaign]);
    expect(loaded.palette).toBe("stone");
    const exported = await encodeBackup(await app.bundle(original.campaign.id));
    expect((await decodeBackup(exported)).campaign).toEqual(original.campaign);
  });
  it("copies backups by default without replacing matching IDs and includes duplicated attachments", async () => {
    const bundle = await fixture();
    const { app } = await store();
    await app.restore(bundle, "original");
    await app.restore(bundle, "copy");
    const data = app.getSnapshot().data!;
    expect(data.campaigns.find((c) => c.id === bundle.campaign.id)).toEqual(
      bundle.campaign,
    );
    const copy = await app.bundle(data.activeCampaignId!);
    expect(copy.campaign.id).not.toBe(bundle.campaign.id);
    expect(await copy.assets[0].blob.text()).toBe(
      await bundle.assets[0].blob.text(),
    );
    await app.duplicate(copy.campaign.id);
    const duplicated = await app.bundle(
      app.getSnapshot().data!.activeCampaignId!,
    );
    expect(duplicated.assets[0].id).not.toBe(copy.assets[0].id);
    expect(await duplicated.assets[0].blob.text()).toBe(
      await copy.assets[0].blob.text(),
    );
  });
  it("checkpoints replacement and restores previous content and assets", async () => {
    const bundle = await fixture();
    const { app, repo } = await store();
    await app.restore(bundle, "original");
    await app.change((d) => ({
      ...d,
      campaigns: d.campaigns.map((c) =>
        c.id === bundle.campaign.id ? { ...c, name: "Locally edited" } : c,
      ),
    }));
    const replacement = {
      campaign: { ...bundle.campaign, assets: [] },
      assets: [],
    };
    await app.restore(replacement, "original");
    expect((await app.bundle(bundle.campaign.id)).assets).toHaveLength(0);
    const point = (await app.recoveryPoints())[0];
    expect(point.reason).toContain("Locally edited");
    await app.recover(point.id);
    const recovered = await app.bundle(bundle.campaign.id);
    expect(recovered.campaign.name).toBe("Locally edited");
    expect(await recovered.assets[0].blob.text()).toBe(
      await bundle.assets[0].blob.text(),
    );
    expect(await repo.recoveryPoints()).toHaveLength(2);
  });
  it("rolls back all changes and the recovery point on a quota failure", async () => {
    const { app, repo } = await store();
    const bundle = await fixture();
    await app.restore(bundle, "original");
    const before = await repo.raw();
    const originalPut = IDBObjectStore.prototype.put;
    const spy = vi
      .spyOn(IDBObjectStore.prototype, "put")
      .mockImplementation(function (
        this: IDBObjectStore,
        ...args: Parameters<IDBObjectStore["put"]>
      ) {
        if (this.name === "state")
          throw new DOMException("Quota full", "QuotaExceededError");
        return originalPut.apply(this, args);
      });
    await expect(
      app.restore(
        {
          campaign: { ...bundle.campaign, assets: [], name: "Replacement" },
          assets: [],
        },
        "original",
      ),
    ).rejects.toThrow("Quota full");
    spy.mockRestore();
    const after = await repo.raw();
    expect(after.data).toEqual(before.data);
    expect(await after.assets[0].blob.text()).toBe(
      await before.assets[0].blob.text(),
    );
    expect(await repo.recoveryPoints()).toHaveLength(0);
    expect(app.getSnapshot().data).toEqual(before.data);
  });
  it("rejects missing or corrupt attachments and campaign checksums before changing storage", async () => {
    const original = await fixture();
    const good = await encodeBackup(original);
    for (const alter of [
      (files: Record<string, Uint8Array>) => {
        delete files["assets/0"];
      },
      (files: Record<string, Uint8Array>) => {
        files["assets/0"][0] ^= 1;
      },
      (files: Record<string, Uint8Array>) => {
        files["campaign.json"] = strToU8("{}");
      },
      (files: Record<string, Uint8Array>) => {
        const m = JSON.parse(strFromU8(files["manifest.json"]));
        m.schemaVersion = 99;
        files["manifest.json"] = strToU8(JSON.stringify(m));
      },
    ]) {
      const files = unzipSync(good);
      alter(files);
      await expect(decodeBackup(zipSync(files))).rejects.toThrow();
    }
    const { app, repo } = await store();
    const before = await repo.load();
    await expect(
      app.restore({ ...original, assets: [] }, "original"),
    ).rejects.toThrow("missing");
    expect(await repo.load()).toEqual(before);
  });
  it("rejects path traversal and excessive expansion without extracting entries", async () => {
    await expect(
      decodeBackup(zipSync({ "../outside": strToU8("x") })),
    ).rejects.toThrow("paths");
    const zip = zipSync({ "campaign.json": strToU8("{}") }, { level: 0 });
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    for (let i = 0; i < zip.length - 24; i++)
      if (view.getUint32(i, true) === 0x02014b50)
        view.setUint32(i + 24, 200 * 1024 * 1024, true);
    await expect(decodeBackup(zip)).rejects.toThrow("limits");
  });
  it("protects restore against another tab and purges deleted campaign attachments and recovery copies", async () => {
    const { app, repo } = await store();
    const bundle = await fixture();
    await app.restore(bundle, "original");
    await app.restore(bundle, "original");
    expect(await repo.recoveryPoints()).toHaveLength(1);
    await app.change(
      (d) =>
        selectAfterRemoval(
          d,
          d.campaigns.filter((c) => c.id !== bundle.campaign.id),
          bundle.campaign.id,
        ),
      { purgeRecoveryCampaignId: bundle.campaign.id },
    );
    expect((await repo.raw()).assets).toHaveLength(0);
    expect(await repo.recoveryPoints()).toHaveLength(0);
    const another = await repo.load();
    another.campaigns[0].name = "Changed elsewhere";
    await repo.save(another, another.revision);
    await expect(app.restore(bundle, "copy")).rejects.toThrow("another tab");
    expect(app.getSnapshot().conflict).toBe(true);
    expect((await repo.load()).campaigns[0].name).toBe("Changed elsewhere");
  });
  it("retains unsaved edits on save failure and writes them after retry", async () => {
    const { app, repo } = await store();
    const spy = vi
      .spyOn(repo, "save")
      .mockRejectedValueOnce(new Error("Quota full"));
    app.update((d) => ({
      ...d,
      campaigns: d.campaigns.map((c) => ({ ...c, name: "Unsaved draft" })),
    }));
    await vi.waitFor(() => expect(app.getSnapshot().status).toBe("error"));
    expect(app.getSnapshot().data!.campaigns[0].name).toBe("Unsaved draft");
    expect((await repo.load()).campaigns[0].name).toBe("My Campaign");
    spy.mockRestore();
    app.retry();
    await vi.waitFor(() => expect(app.getSnapshot().status).toBe("saved"));
    expect((await repo.load()).campaigns[0].name).toBe("Unsaved draft");
  });
});

it("retains five recovery points and always keeps the new point when timestamps tie", async () => {
  const { app, repo } = await store();
  const bundle = await fixture();
  await app.restore(bundle, "original");
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    for (let i = 0; i < 7; i++) {
      await app.change((d) => ({
        ...d,
        campaigns: d.campaigns.map((c) =>
          c.id === bundle.campaign.id ? { ...c, name: "Edit " + i } : c,
        ),
      }));
      await app.restore(bundle, "original");
    }
    const points = await repo.recoveryPoints();
    expect(points).toHaveLength(5);
    expect(points.some((p) => p.reason === "Before replacing Edit 6")).toBe(
      true,
    );
  } finally {
    vi.useRealTimers();
  }
});
