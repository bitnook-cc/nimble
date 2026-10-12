import { addMonsterToRun } from "./monsters";
import {
  monsterPack,
  starterPack,
  gmgPack,
  coreRulesPack,
  officialPacks,
} from "./starter-pack";
import { packKey, packTarget } from "./content-schema";
import { advance, newRun } from "./model";
import { setCombatantHp } from "./legendary";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NativeRepository, type NativeDatabase } from "./native-storage";
import { Repository, AppStore, ConflictError } from "./storage";
import { digest, encodeBackup, decodeBackup } from "./backup";
import { newApp, uid } from "./model";
import { indexedDB } from "fake-indexeddb";
import { defaultTableDefinition } from "./utility-schema";
import { newTool, SCHEMA_VERSION } from "./model";

it("moves schema 15 table definitions into native campaign content once and retains original recovery", async () => {
  const db = database(),
    repo = await new NativeRepository(db.driver).initialize();
  const app = await repo.load();
  const original = {
    ...app,
    version: 15,
    campaigns: app.campaigns.map((campaign) => ({
      ...campaign,
      tools: [
        ...campaign.tools,
        { ...newTool("table"), definition: defaultTableDefinition() },
      ],
    })),
  };
  db.sql
    .prepare("UPDATE slate_state SET payload=?")
    .run(JSON.stringify({ data: original, assets: [], recovery: [] }));
  const upgraded = await repo.load();
  expect(upgraded.version).toBe(SCHEMA_VERSION);
  expect(upgraded.campaigns[0].content[0].kind).toBe("table");
  const tool = upgraded.campaigns[0].tools.at(-1)!;
  expect(tool).not.toHaveProperty("definition");
  expect(tool.kind === "table" && tool.target).toBe(
    `local::${upgraded.campaigns[0].content[0].id}`,
  );
  expect((await repo.recoveryPoints())[0].data).toEqual(original);
  expect((await repo.load()).revision).toBe(upgraded.revision);
  expect(await repo.recoveryPoints()).toHaveLength(1);
});

it("upgrades the bundled native catalog once while retaining disabled packs and the original checkpoint", async () => {
  const db = database();
  const repo = await new NativeRepository(db.driver).initialize();
  const original = await repo.load();
  const oldPack = {
    ...starterPack,
    version: "40527955eb7c6f4a242d508586580401f9e0431c",
    records: [{ ...starterPack.records[0], related: [] }],
    terms: [],
    assets: {},
  };
  original.packs = [oldPack, monsterPack];
  original.campaigns[0].packRefs = [packKey(monsterPack)];
  original.campaigns[0].content.push({
    ...starterPack.records[0],
    id: "local-edit",
    body: "Keep my edits",
    origin: packTarget(oldPack, "rule/initiative"),
  });
  db.sql.prepare("UPDATE slate_state SET payload=?").run(
    JSON.stringify({
      data: { ...original, version: 13 },
      assets: [],
      recovery: [],
    }),
  );
  const upgraded = await repo.load();
  expect(upgraded.packs).toEqual(officialPacks);
  expect(upgraded.campaigns[0].packRefs).toEqual([packKey(gmgPack)]);
  expect(upgraded.campaigns[0].content[0]).toMatchObject({
    body: "Keep my edits",
    origin: packTarget(coreRulesPack, "rule/initiative"),
  });
  expect((await repo.recoveryPoints())[0].data).toMatchObject({
    version: 13,
    packs: [oldPack, monsterPack],
  });
  const reopened = await new NativeRepository(db.driver).initialize();
  expect(await reopened.load()).toEqual(upgraded);
  expect(await reopened.recoveryPoints()).toHaveLength(1);
});

function database(filename = ":memory:") {
  const sql = new DatabaseSync(filename);
  let fail = false;
  const driver: NativeDatabase = {
    query: async (statement, values = []) => ({
      values: sql
        .prepare(statement)
        .all(...(values as (string | number)[])) as Record<string, unknown>[],
    }),
    run: async (statement, values = []) => {
      if (fail && statement.startsWith("INSERT INTO slate_state"))
        throw new Error("disk full");
      return sql.prepare(statement).run(...(values as (string | number)[]));
    },
    execute: async (statement) => sql.exec(statement),
    beginTransaction: async () => sql.exec("BEGIN IMMEDIATE"),
    commitTransaction: async () => sql.exec("COMMIT"),
    rollbackTransaction: async () => sql.exec("ROLLBACK"),
  };
  return {
    sql,
    driver,
    fail: (value: boolean) => {
      fail = value;
    },
  };
}
async function image(data = newApp()) {
  const blob = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });
  const campaign = data.campaigns[0];
  const meta = {
    id: uid(),
    name: "map.png",
    mime: blob.type,
    size: blob.size,
    sha256: await digest(new Uint8Array(await blob.arrayBuffer())),
  };
  campaign.assets.push(meta);
  return { data, asset: { campaignId: campaign.id, id: meta.id, blob } };
}
describe("native SQLite storage", () => {
  it("reopens with party, tools and exact attachment bytes; portable ZIP restores", async () => {
    const db = database();
    const repo = await new NativeRepository(db.driver).initialize();
    const initial = await repo.load();
    const { data, asset } = await image(initial);
    data.campaigns[0].name = "Native game";
    const revision = await repo.save(data, 0, { assets: [asset] });
    const reopened = await new NativeRepository(db.driver).initialize();
    expect((await reopened.load()).campaigns[0].name).toBe("Native game");
    expect(
      new Uint8Array(
        await (await reopened.asset(asset.campaignId, asset.id))!.arrayBuffer(),
      ),
    ).toEqual(new Uint8Array([1, 2, 3, 4]));
    const backup = await decodeBackup(
      await encodeBackup(await reopened.bundle(asset.campaignId, revision)),
    );
    expect(backup.campaign).toEqual(data.campaigns[0]);
    expect(backup.assets[0].blob.size).toBe(4);
  });
  it("rolls back state, newly written blobs and recovery points when commit staging fails, then retries", async () => {
    const db = database(),
      repo = await new NativeRepository(db.driver).initialize();
    const before = await repo.load();
    const { data, asset } = await image(structuredClone(before));
    db.fail(true);
    await expect(
      repo.save(data, 0, { assets: [asset], checkpoint: "Before import" }),
    ).rejects.toThrow("disk full");
    db.fail(false);
    expect(await repo.load()).toEqual(before);
    expect(await repo.recoveryPoints()).toEqual([]);
    expect(
      db.sql.prepare("SELECT count(*) AS total FROM slate_blobs").get()!.total,
    ).toBe(0);
    expect(await repo.save(data, 0, { assets: [asset] })).toBe(1);
  });
  it("rejects stale writers and serializes simultaneous native writes", async () => {
    const db = database(),
      repo = await new NativeRepository(db.driver).initialize();
    const data = await repo.load();
    const outcomes = await Promise.allSettled([
      repo.save(data, 0),
      repo.save(data, 0),
    ]);
    expect(outcomes[0].status).toBe("fulfilled");
    expect(outcomes[1]).toMatchObject({
      status: "rejected",
      reason: expect.any(ConflictError),
    });
    expect((await repo.load()).revision).toBe(1);
  });
  it("retains checkpoint images after deletion and removes bytes after explicit recovery purge", async () => {
    const db = database(),
      repo = await new NativeRepository(db.driver).initialize();
    const { data, asset } = await image(await repo.load());
    await repo.save(data, 0, { assets: [asset] });
    data.campaigns[0].assets = [];
    await repo.save(data, 1, { checkpoint: "Before deleting image" });
    expect(await repo.asset(asset.campaignId, asset.id)).toBeUndefined();
    expect((await repo.recoveryPoints())[0].assets[0].blob.size).toBe(4);
    const store = new AppStore(async () => repo);
    await store.init();
    await store.recover((await repo.recoveryPoints())[0].id);
    expect((await repo.asset(asset.campaignId, asset.id))!.size).toBe(4);
    await store.change(
      (d) => ({
        ...d,
        campaigns: d.campaigns.map((c) => ({ ...c, assets: [] })),
      }),
      { purgeRecoveryCampaignId: asset.campaignId },
    );
    expect(
      db.sql.prepare("SELECT count(*) AS total FROM slate_blobs").get()!.total,
    ).toBe(0);
  });
  it("migrates WebView state, packs, attachments and checkpoints once without changing the source", async () => {
    Object.assign(globalThis, { indexedDB });
    const legacy = await Repository.open(uid());
    const { data, asset } = await image(await legacy.load());
    await legacy.save(data, 0, {
      assets: [asset],
      checkpoint: "Legacy checkpoint",
    });
    const before = await legacy.raw();
    const db = database(),
      repo = await new NativeRepository(db.driver, legacy).initialize();
    expect((await repo.load()).campaigns).toEqual(
      (before.data as typeof data).campaigns,
    );
    expect((await repo.recoveryPoints()).map((p) => p.reason)).toContain(
      "Legacy checkpoint",
    );
    expect((await repo.recoveryPoints())[0].reason).toBe(
      "Before moving WebView data to native storage",
    );
    await repo.load();
    expect(await repo.recoveryPoints()).toHaveLength(2);
    expect(await legacy.raw()).toEqual(before);
    legacy.close();
  });
  it("preserves corrupted native state and exposes original data instead of resetting", async () => {
    const db = database(),
      repo = await new NativeRepository(db.driver).initialize();
    await repo.load();
    const invalid = {
      data: { version: 999, revision: 0 },
      assets: [],
      recovery: [],
    };
    db.sql
      .prepare("UPDATE slate_state SET payload=?")
      .run(JSON.stringify(invalid));
    await expect(repo.load()).rejects.toThrow();
    expect((await repo.raw()).data).toEqual(invalid.data);
    expect(
      JSON.parse(
        String(
          db.sql.prepare("SELECT payload FROM slate_state").get()!.payload,
        ),
      ),
    ).toEqual(invalid);
  });
  it("rejects mismatched attachment checksums before marking saved", async () => {
    const db = database(),
      repo = await new NativeRepository(db.driver).initialize();
    const { data, asset } = await image(await repo.load());
    asset.blob = new Blob([new Uint8Array([4, 3, 2, 1])], {
      type: "image/png",
    });
    await expect(repo.save(data, 0, { assets: [asset] })).rejects.toThrow(
      "damaged attachment",
    );
    expect((await repo.load()).revision).toBe(0);
  });
});

it("persists in a real SQLite file across connection closure", async () => {
  const folder = mkdtempSync(join(tmpdir(), "slate-sqlite-")),
    filename = join(folder, "slate.db");
  let db = database(filename);
  try {
    let repo = await new NativeRepository(db.driver).initialize();
    const { data, asset } = await image(await repo.load());
    data.campaigns[0].name = "After restart";
    await repo.save(data, 0, { assets: [asset] });
    db.sql.close();
    db = database(filename);
    repo = await new NativeRepository(db.driver).initialize();
    expect((await repo.load()).campaigns[0].name).toBe("After restart");
    expect((await repo.asset(asset.campaignId, asset.id))!.size).toBe(4);
  } finally {
    db.sql.close();
    unlinkSync(filename);
    rmdirSync(folder);
  }
});
it("migrates schema 10 native counters with exactly one original recovery point", async () => {
  const db = database(),
    repo = await new NativeRepository(db.driver).initialize();
  const data = await repo.load();
  const original = {
    ...data,
    version: 10,
    campaigns: data.campaigns.map((c) => ({
      ...c,
      tools: [
        ...c.tools,
        {
          id: "duration",
          name: "Spell duration",
          kind: "countdown",
          initial: 5,
          remaining: 3,
          epoch: 2,
          link: {
            trackerId: c.tools.find((t) => t.kind === "initiative")!.id,
            event: "turn",
            paused: true,
          },
        },
      ],
    })),
  };

  db.sql
    .prepare("UPDATE slate_state SET payload=?")
    .run(JSON.stringify({ data: original, assets: [], recovery: [] }));
  const upgraded = await repo.load();
  expect(upgraded.revision).toBe(1);
  expect(upgraded.version).toBe(16);
  expect(
    upgraded.campaigns[0].tools.find((t) => t.id === "duration"),
  ).toMatchObject({
    kind: "counter",
    value: 3,
    initial: 5,
    epoch: 2,
    link: { event: "turn", direction: "decrement", paused: true },
  });
  expect((await repo.recoveryPoints())[0].data).toEqual(original);
  await repo.load();
  expect(await repo.recoveryPoints()).toHaveLength(1);
});
it("failed WebView migration leaves SQL empty and keeps the original exportable", async () => {
  const db = database();
  const original = { data: { version: 999 }, assets: [], packs: [] };
  const legacy = { raw: async () => original } as unknown as Repository;
  const repo = await new NativeRepository(db.driver, legacy).initialize();
  await expect(repo.load()).rejects.toThrow();
  expect(
    db.sql.prepare("SELECT count(*) AS total FROM slate_state").get()!.total,
  ).toBe(0);
  expect(await repo.raw()).toEqual(original);
});
it("detects corrupt attachment bytes on load but preserves them in raw recovery", async () => {
  const db = database(),
    repo = await new NativeRepository(db.driver).initialize();
  const { data, asset } = await image(await repo.load());
  await repo.save(data, 0, { assets: [asset] });
  db.sql.prepare("UPDATE slate_blobs SET bytes=?").run("BAQEBQ==");
  await expect(repo.load()).rejects.toThrow("checksum");
  expect(
    new Uint8Array(await (await repo.raw()).assets[0].blob.arrayBuffer()),
  ).toEqual(new Uint8Array([4, 4, 4, 5]));
});
it("a rejected commit rolls back the entire native save and permits a clean retry", async () => {
  const db = database(),
    repo = await new NativeRepository(db.driver).initialize();
  const original = await repo.load(),
    commit = db.driver.commitTransaction;
  db.driver.commitTransaction = async () => {
    throw new Error("Commit failed");
  };
  const { data, asset } = await image(structuredClone(original));
  await expect(
    repo.save(data, 0, { assets: [asset], checkpoint: "Before restore" }),
  ).rejects.toThrow("Commit failed");
  db.driver.commitTransaction = commit;
  expect(await repo.load()).toEqual(original);
  expect(await repo.recoveryPoints()).toEqual([]);
  expect(await repo.save(data, 0, { assets: [asset] })).toBe(1);
});

it("exports an unreadable native envelope and attachment rows verbatim for recovery", async () => {
  const db = database(),
    repo = await new NativeRepository(db.driver).initialize();
  const { data, asset } = await image(await repo.load());
  await repo.save(data, 0, { assets: [asset] });
  db.sql.prepare("UPDATE slate_state SET payload=?").run("{broken native JSON");
  await expect(repo.load()).rejects.toThrow();
  const raw = await repo.raw();
  expect(raw.data).toMatchObject({
    format: "slate-native-raw",
    payload: "{broken native JSON",
    blobs: [{ bytes: "AQIDBA==" }],
  });
  expect(raw.assets).toEqual([]);
});

it("upgrades native schema 11 stopwatch and timer state once without changing their timestamps", async () => {
  const db = database(),
    repo = await new NativeRepository(db.driver).initialize();
  const data = await repo.load();
  const original = {
    ...data,
    version: 11,
    campaigns: data.campaigns.map((c) => ({
      ...c,
      tools: [
        ...c.tools,
        {
          id: "watch",
          kind: "stopwatch",
          name: "Session",
          elapsedMs: 1000,
          startedAt: 1000,
        },
        {
          id: "timer",
          kind: "timer",
          name: "Break",
          durationMs: 60000,
          remainingMs: 45000,
          deadline: 61000,
          acknowledged: false,
        },
      ],
    })),
  };
  db.sql
    .prepare("UPDATE slate_state SET payload=?")
    .run(JSON.stringify({ data: original, assets: [], recovery: [] }));
  const upgraded = await repo.load();
  expect(upgraded.version).toBe(16);
  expect(
    upgraded.campaigns[0].tools.find((t) => t.id === "watch"),
  ).toMatchObject({
    kind: "time",
    mode: "stopwatch",
    stopwatch: { elapsedMs: 1000, startedAt: 1000 },
  });
  expect(
    upgraded.campaigns[0].tools.find((t) => t.id === "timer"),
  ).toMatchObject({
    kind: "time",
    mode: "timer",
    timer: { remainingMs: 45000, deadline: 61000, acknowledged: false },
  });
  expect((await repo.recoveryPoints())[0].data).toEqual(original);
  const reopened = await new NativeRepository(db.driver).initialize();
  expect(await reopened.load()).toEqual(upgraded);
  expect(await reopened.recoveryPoints()).toHaveLength(1);
  db.sql.close();
});

it("native schema 12 upgrades legendary snapshots once and persists the action queue with phase HP", async () => {
  const db = database(),
    repo = await new NativeRepository(db.driver).initialize();
  const initial = await repo.load();
  const tracker = initial.campaigns[0].tools.find(
    (t) => t.kind === "initiative",
  )!;
  if (tracker.kind !== "initiative") throw new Error("fixture");
  const pudge = monsterPack.records.find(
    (r) => r.title === "Pudge the Blunderer",
  )!;
  tracker.run = addMonsterToRun(newRun(), { ...pudge, target: "local::pudge" });
  tracker.run.combatants[0].hp = 0;
  tracker.run.combatants[0].legendary = undefined;
  db.sql.prepare("UPDATE slate_state SET payload=?").run(
    JSON.stringify({
      data: { ...initial, version: 12 },
      assets: [],
      recovery: [],
    }),
  );
  const upgraded = await repo.load();
  const current = upgraded.campaigns[0].tools.find(
    (t) => t.kind === "initiative",
  )!;
  if (current.kind !== "initiative") throw new Error("fixture");
  expect(current.run.combatants[0].legendary).toMatchObject({
    phase: "lastStand",
    lastStandHp: null,
  });
  expect((await repo.recoveryPoints())[0].data).toMatchObject({ version: 12 });
  await repo.load();
  expect(await repo.recoveryPoints()).toHaveLength(1);
  current.run.combatants[0] = {
    ...setCombatantHp(current.run.combatants[0], 0),
    legendary: { ...current.run.combatants[0].legendary!, lastStandHp: 7 },
  };
  current.run.combatants.unshift({
    id: "hero",
    name: "Hero",
    side: "hero",
    hp: 10,
    maxHp: 10,
    initiative: null,
    conditions: "",
    notes: "",
  });
  current.run = advance(advance(current.run));
  await repo.save(upgraded, upgraded.revision);
  const reopened = await new NativeRepository(db.driver).initialize();
  expect(
    (await reopened.load()).campaigns[0].tools.find(
      (t) => t.kind === "initiative",
    ),
  ).toMatchObject({
    run: {
      legendaryTurn: expect.any(Object),
      combatants: [
        expect.any(Object),
        { legendary: { phase: "lastStand", lastStandHp: 7 } },
      ],
    },
  });
});
