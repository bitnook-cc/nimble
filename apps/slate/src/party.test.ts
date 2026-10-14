import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import {
  addPartyToRun,
  characterFromSidekick,
  partySchema,
  type PartyCharacter,
} from "./party";
import {
  advance,
  campaignSchema,
  changeRun,
  newApp,
  newCampaign,
  newRun,
  type Combatant,
  type InitiativeTool,
} from "./model";
import { copyCampaign } from "./campaigns";
import { migrateApp } from "./migrations";
import { decodeBackup, digest, encodeBackup } from "./backup";
import { packKey } from "./content-schema";
import { Repository } from "./storage";

const pc = (
  id = "mira",
  overrides: Partial<PartyCharacter> = {},
): PartyCharacter => ({
  id,
  name: "Mira",
  playerName: "Alex",
  level: 3,
  hp: 18,
  maxHp: 24,
  notes: "Carries the lantern",
  source: null,
  ...overrides,
});
const enemy = (id = "enemy"): Combatant => ({
  id,
  name: "Goblin",
  side: "enemy",
  hp: 6,
  maxHp: 10,
  initiative: 7,
  conditions: "Slowed",
  notes: "Flees at half HP",
});
const repos: Repository[] = [];
afterEach(() => repos.splice(0).forEach((repo) => repo.close()));

describe("party encounter snapshots", () => {
  it("adds missing heroes once without changing encounter state, order, or existing injuries", () => {
    const party = { characters: [pc(), pc("thorn", { name: "Thorn", hp: 0 })] };
    let run = advance({ ...newRun(), name: "The gate", combatants: [enemy()] });
    run = { ...run, round: 4, status: "paused" };
    const next = addPartyToRun(run, party);
    expect(next).toMatchObject({
      name: "The gate",
      round: 4,
      status: "paused",
      activeId: "enemy",
    });
    expect(next.combatants[0]).toEqual(run.combatants[0]);
    expect(next.combatants.slice(1)).toMatchObject([
      {
        partyCharacterId: "mira",
        name: "Mira",
        side: "hero",
        hp: 18,
        maxHp: 24,
        initiative: null,
        notes: "Carries the lantern",
        conditions: "",
      },
      { partyCharacterId: "thorn", hp: 0 },
    ]);
    expect(addPartyToRun(next, party)).toBe(next);
    const renamed = {
      characters: [pc("mira", { name: "Mira Ashwood", hp: 24 })],
    };
    const damaged = {
      ...next,
      combatants: next.combatants.map((c) =>
        c.partyCharacterId === "mira"
          ? { ...c, hp: 3, conditions: "Frightened" }
          : c,
      ),
    };
    expect(addPartyToRun(damaged, renamed)).toBe(damaged);
    expect(addPartyToRun(newRun(), renamed).combatants[0]).toMatchObject({
      name: "Mira Ashwood",
      hp: 24,
    });
    expect(run.combatants).toHaveLength(1);
  });
  it("keeps same-named PCs distinct and rejects a partial party when the encounter is full", () => {
    const party = { characters: [pc("a"), pc("b")] };
    expect(addPartyToRun(newRun(), party).combatants).toHaveLength(2);
    const run = {
      ...newRun(),
      combatants: Array.from({ length: 99 }, (_, i) => enemy(String(i))),
    };
    expect(() => addPartyToRun(run, party)).toThrow("not enough room");
    expect(run.combatants).toHaveLength(99);
    expect(
      addPartyToRun({ ...run, combatants: run.combatants.slice(1) }, party)
        .combatants,
    ).toHaveLength(100);
  });
  it("undoes a party addition in one step and copies roster/history links consistently", () => {
    const campaign = newCampaign("Table");
    campaign.party.characters = [pc()];
    const tracker = campaign.tools.find(
      (tool): tool is InitiativeTool => tool.kind === "initiative",
    )!;
    Object.assign(
      tracker,
      changeRun(tracker, addPartyToRun(tracker.run, campaign.party)),
    );
    Object.assign(
      tracker,
      changeRun(tracker, {
        ...tracker.run,
        combatants: tracker.run.combatants.map((c) => ({ ...c, hp: 2 })),
      }),
    );
    const copy = copyCampaign(campaign);
    const copied = copy.tools.find(
      (tool): tool is InitiativeTool => tool.kind === "initiative",
    )!;
    const copiedId = copy.party.characters[0].id;
    expect(copiedId).not.toBe("mira");
    expect(copied.run.combatants[0].partyCharacterId).toBe(copiedId);
    expect(copied.history[0].combatants[0].partyCharacterId).toBe(copiedId);
    expect(copied.history[1].combatants).toHaveLength(0);
    expect(copied.run.combatants[0].id).toBe(
      copied.history[0].combatants[0].id,
    );
    // Removing from the roster must not invalidate retained combat snapshots.
    campaign.party.characters = [];
    expect(campaignSchema.parse(campaign).tools).toEqual(campaign.tools);
  });
  it("rejects invalid HP and duplicate roster IDs while projecting full Sidekick records", () => {
    expect(partySchema.safeParse({ characters: [pc(), pc()] }).success).toBe(
      false,
    );
    expect(
      partySchema.safeParse({ characters: [pc("a", { hp: 25 })] }).success,
    ).toBe(false);
    const fullCharacter = {
      id: "sidekick-id",
      name: "Mira",
      level: 4,
      hitPoints: { current: 12, max: 30, temporary: 5 },
      abilities: [{ name: "Lantern light" }],
    };
    const result = characterFromSidekick(fullCharacter, "local-id", {
      campaignId: "remote-table",
      playerName: "Alex",
      lastSyncedAt: "2026-10-11T00:00:00Z",
    });
    expect(result).toMatchObject({
      id: "local-id",
      name: "Mira",
      hp: 12,
      maxHp: 30,
      level: 4,
      source: {
        provider: "sidekick",
        characterId: "sidekick-id",
        campaignId: "remote-table",
      },
    });
    const campaign = newCampaign("Connected later");
    campaign.party.characters = [result];
    const copied = copyCampaign(campaign).party.characters[0];
    expect(copied.id).not.toBe(result.id);
    expect(copied.source).toEqual(result.source);
  });
});

it("migrates genuine schema 5 storage and ZIPs, retaining packs and a usable recovery point", async () => {
  const app = newApp();
  const { party, ...oldCampaign } = app.campaigns[0];
  void party;
  const old = { ...app, version: 5, campaigns: [oldCampaign] };
  expect(migrateApp(old).campaigns[0].party.characters).toEqual([]);
  const name = crypto.randomUUID();
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, 3);
    request.onupgradeneeded = () => {
      for (const store of ["state", "assets", "recovery", "packs"])
        request.result.createObjectStore(store);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["state", "packs"], "readwrite");
    tx.objectStore("state").put({ ...old, packs: [] }, "app");
    for (const pack of app.packs)
      tx.objectStore("packs").put(pack, packKey(pack));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  const repo = await Repository.open(name);
  repos.push(repo);
  const migrated = await repo.load();
  expect(migrated).toMatchObject({ version: 18, revision: 1 });
  expect(migrated.campaigns).toEqual(app.campaigns);
  expect(migrated.packs).toEqual(app.packs);
  const points = await repo.recoveryPoints();
  expect(points).toHaveLength(1);
  expect(migrateApp(points[0].data).campaigns).toEqual(app.campaigns);
  migrated.campaigns[0].party.characters = [pc()];
  await repo.save(migrated, migrated.revision);
  const loaded = await repo.load();
  const bytes = await encodeBackup(
    await repo.bundle(oldCampaign.id, loaded.revision),
  );
  expect((await decodeBackup(bytes)).campaign.party.characters).toEqual([pc()]);
  const files = unzipSync(bytes);
  files["campaign.json"] = strToU8(JSON.stringify(oldCampaign));
  const manifest = JSON.parse(strFromU8(files["manifest.json"]));
  manifest.schemaVersion = 5;
  manifest.campaignSha256 = await digest(files["campaign.json"]);
  files["manifest.json"] = strToU8(JSON.stringify(manifest));
  expect((await decodeBackup(zipSync(files))).campaign).toEqual(
    app.campaigns[0],
  );
});
