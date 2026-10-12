import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import {
  advance,
  appSchema,
  newApp,
  newRun,
  newTool,
  removeCombatant,
  type Combatant,
  type Run,
} from "./model";
import {
  legendaryState,
  changeCombatantHp,
  defeatCombatant,
  reviveCombatant,
  setCombatantHp,
  canAct,
} from "./legendary";
import {
  encounterDifficulty,
  difficultyLabel,
  numericLevel,
} from "./encounter-difficulty";
import { monsterPack } from "./starter-pack";
import { addMonsterToRun } from "./monsters";
import { type Entry } from "./content";
import { advanceCampaign, applyToolUpdate } from "./utilities";
import { copyCampaign } from "./campaigns";
import { migrateApp } from "./migrations";
import { Repository } from "./storage";
import { encodeBackup, decodeBackup } from "./backup";
import { parseExchange, exportRecords } from "./exchange";

const hero = (id: string, side: Combatant["side"] = "hero"): Combatant => ({
  id,
  name: id,
  side,
  hp: 10,
  maxHp: 10,
  initiative: null,
  conditions: "",
  notes: "",
});
const entry = (
  id: string,
  fields: Record<string, unknown> = {},
): Entry & { kind: "monster" } => ({
  id,
  target: "local::" + id,
  kind: "monster",
  title: id,
  body: "## Bloodied\n\nAt 5 HP, roar.\n\n## Last stand\n\nBoss is dying! 4 more damage and it dies.",
  tags: [],
  category: "",
  sources: [],
  related: [],
  fields: { hp: 10, level: "2", ...fields },
});
const boss = (id = "boss"): Combatant => ({
  ...hero(id, "enemy"),
  legendary: legendaryState(entry(id, { legendary: true }), 10),
});
const encounter = (monsters: Entry[], quantity = 1, heroLevel = 2): Entry => ({
  id: "enc",
  target: "local::enc",
  kind: "encounter",
  title: "Test",
  body: "",
  tags: [],
  category: "",
  sources: [],
  related: [],
  fields: {
    heroCount: 4,
    heroLevel,
    entries: monsters.map((m) => ({
      id: m.id,
      name: m.title,
      target: m.target,
      quantity,
      isPerHero: false,
      heroesPerMonster: 1,
    })),
  },
});

it("uses the GMG difficulty landmarks and preserves the gaps between them", () => {
  expect(
    [0.49, 0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.4, 1.5].map(difficultyLabel),
  ).toEqual([
    "Easy",
    "Easy–medium",
    "Medium",
    "Medium–hard",
    "Hard",
    "Deadly",
    "Deadly",
    "Deadly–very deadly",
    "Very deadly",
  ]);
  expect(numericLevel("1/3")).toBeCloseTo(1 / 3);
  for (const level of ["solo 2", "1/0", "—", "0", "-1"])
    expect(numericLevel(level)).toBeNull();
});
it("rates resolved quantities and fractional levels against the actual level sum", () => {
  const mob = entry("mob", { level: "1/2" });
  const draft = encounter([mob], 12);
  expect(encounterDifficulty(draft, [mob], 4)).toMatchObject({
    partyBudget: 8,
    monsterBudget: 6,
    label: "Medium",
  });
  draft.fields.entries = [
    {
      id: "scaled",
      name: "mob",
      target: mob.target,
      quantity: 3,
      isPerHero: true,
      heroesPerMonster: 2,
    },
  ];
  expect(encounterDifficulty(draft, [mob], 5, 1.8)).toMatchObject({
    partyBudget: 9,
    monsterBudget: 4,
  });
});
it("rates a legendary team once against average hero level, never as two ordinary monsters", () => {
  const team = entry("team", {
    legendary: true,
    members: [
      { name: "A", hp: 10 },
      { name: "B", hp: 10 },
    ],
  });
  const draft = encounter([team], 10);
  expect(encounterDifficulty(draft, [team], 4)).toMatchObject({
    label: "Hard solo",
    monsterBudget: 2,
    ratio: 1,
  });
  expect(encounterDifficulty(draft, [team], 10, 3).label).toBe("Easier solo");
  expect(encounterDifficulty(draft, [team], 2, 1).label).toBe("Harder solo");
});
it("does not give misleading difficulty labels for hazards, missing levels, minions or mixed solos", () => {
  for (const monster of [
    entry("trap", { hazard: true }),
    entry("unknown", { level: "special" }),
    entry("incomplete", { incomplete: true }),
    entry("minions", { minion: true }),
  ])
    expect(encounterDifficulty(encounter([monster]), [monster], 4).label).toBe(
      "Unrated",
    );
  const ordinary = entry("guard"),
    minion = entry("minion", { minion: true }),
    solo = entry("solo", { legendary: true });
  const withMinions = encounterDifficulty(
    encounter([ordinary, minion], 4),
    [ordinary, minion],
    4,
  );
  expect(withMinions).toMatchObject({
    label: "Hard",
    minions: 4,
    monsterBudget: 8,
  });
  expect(withMinions.notes.join(" ")).toContain("1/hero slightly harder");
  expect(
    encounterDifficulty(encounter([ordinary, solo]), [ordinary, solo], 4).label,
  ).toBe("Unrated");
  expect(
    encounterDifficulty(encounter([ordinary]), [ordinary], 4, 0).label,
  ).toBe("Unrated");
});
it("reads the bundled legendary declarations and retains unusual phase text without inventing a pool", () => {
  const pudge = monsterPack.records.find(
    (r) => r.title === "Pudge the Blunderer",
  )!;
  expect(legendaryState(pudge, 75)).toMatchObject({
    lastStandMaxHp: 20,
    bloodiedAt: 37,
  });
  const titan = monsterPack.records.find(
    (r) => r.title === "Titan of the Deep Woods",
  )!;
  expect(legendaryState(titan, 240)).toMatchObject({
    lastStandMaxHp: null,
    lastStandText: expect.stringContaining("minions/hero"),
  });
  expect(
    legendaryState(
      entry("scaled", { lastStandHpPerHero: 3, hpPerHero: 10 }),
      40,
      4,
    ),
  ).toMatchObject({ lastStandMaxHp: 12, bloodiedAt: 20 });
});
it("transitions through Bloodied and Last Stand, applies subsequent damage and preserves phase on healing", () => {
  let c = setCombatantHp(boss(), 5);
  expect(c.legendary?.phase).toBe("bloodied");
  c = changeCombatantHp(c, 1);
  expect(c.legendary?.phase).toBe("bloodied");
  c = setCombatantHp(c, 0);
  expect(c.legendary).toMatchObject({ phase: "lastStand", lastStandHp: 4 });
  expect(canAct(c)).toBe(true);
  c = changeCombatantHp(c, -3);
  expect(c.legendary?.lastStandHp).toBe(1);
  c = changeCombatantHp(c, -1);
  expect(c.legendary?.phase).toBe("defeated");
  expect(canAct(c)).toBe(false);
});
it("keeps an unknown Last Stand active until the GM resolves it", () => {
  const c = setCombatantHp(
    { ...boss(), legendary: legendaryState(undefined, 10) },
    0,
  );
  expect(canAct(c)).toBe(true);
  expect(changeCombatantHp(c, -1)).toEqual(c);
  expect(
    canAct({ ...c, legendary: { ...c.legendary!, phase: "defeated" } }),
  ).toBe(false);
});
it("inserts one solo action after each hero, excludes followers and gives no extra ordinary boss turn", () => {
  let run: Run = {
    ...newRun(),
    combatants: [
      hero("A"),
      boss(),
      hero("ally", "ally"),
      hero("B"),
      hero("minion", "enemy"),
    ],
  };
  const steps = [];
  for (let i = 0; i < 10; i++) {
    run = advance(run);
    steps.push([run.activeId, run.round, !!run.legendaryTurn]);
  }
  expect(steps).toEqual([
    ["A", 1, false],
    ["boss", 1, true],
    ["ally", 1, false],
    ["B", 1, false],
    ["boss", 1, true],
    ["minion", 1, false],
    ["A", 2, false],
    ["boss", 2, true],
    ["ally", 2, false],
    ["B", 2, false],
  ]);
});
it("a legendary team shares one action and distinct solo instances each get an action", () => {
  const team = entry("pair", {
    legendary: true,
    members: [
      { name: "Left", hp: 10 },
      { name: "Right", hp: 10 },
    ],
  });
  let run = addMonsterToRun(
    { ...newRun(), combatants: [hero("A"), hero("B")] },
    team,
  );
  run = advance(advance(run));
  expect(run.legendaryTurn?.groups).toHaveLength(1);
  const right = run.combatants.find((c) => c.name === "Right")!;
  run = { ...run, activeId: right.id };
  expect(advance(run).activeId).toBe("B");
  const solos: Run = {
    ...newRun(),
    combatants: [hero("A"), boss("one"), boss("two")],
  };
  let next = advance(advance(solos));
  expect(next.activeId).toBe("one");
  next = advance(next);
  expect(next.activeId).toBe("two");
  expect(advance(next)).toMatchObject({
    activeId: "A",
    round: 2,
    legendaryTurn: undefined,
  });
});
it("Last Stand is eligible after the final hero and wraps the round only after the solo action", () => {
  let run: Run = {
    ...newRun(),
    combatants: [hero("A"), setCombatantHp(boss(), 0)],
  };
  run = advance(advance(run));
  expect(run).toMatchObject({ activeId: "boss", round: 1 });
  expect(advance({ ...run, status: "paused" })).toEqual({
    ...run,
    status: "paused",
  });
  expect(advance(run)).toMatchObject({ activeId: "A", round: 2 });
});
it("removing a pending actor preserves the next group's action and pause state", () => {
  let run: Run = {
    ...newRun(),
    combatants: [hero("A"), boss("one"), boss("two")],
  };
  run = advance(advance(run));
  run = removeCombatant(run, "one");
  expect(run.activeId).toBe("two");
  run = removeCombatant({ ...run, status: "paused" }, "two");
  expect(run).toMatchObject({ activeId: "A", round: 2, status: "paused" });
});
it("linked counters tick on all completed turns and rounds, with undo including pending legendary actions", () => {
  let campaign = newApp().campaigns[0];
  const tracker = campaign.tools.find((t) => t.kind === "initiative")!;
  if (tracker.kind !== "initiative") throw new Error("fixture");
  tracker.run = { ...newRun(), combatants: [hero("A"), boss()] };
  const counter = newTool("counter"),
    rounds = newTool("counter");
  if (counter.kind !== "counter" || rounds.kind !== "counter")
    throw new Error("fixture");
  counter.link = {
    trackerId: tracker.id,
    event: "turn",
    direction: "increment",
    paused: false,
  };
  rounds.link = { ...counter.link, event: "round" };
  campaign.tools.push(counter, rounds);
  campaign = advanceCampaign(campaign, tracker.id);
  campaign = advanceCampaign(campaign, tracker.id);
  expect(campaign.tools.find((t) => t.id === counter.id)).toMatchObject({
    value: 1,
  });
  campaign = advanceCampaign(campaign, tracker.id);
  expect(campaign.tools.find((t) => t.id === counter.id)).toMatchObject({
    value: 2,
  });
  expect(campaign.tools.find((t) => t.id === rounds.id)).toMatchObject({
    value: 1,
  });
  campaign = applyToolUpdate(campaign, tracker.id, (t) =>
    t.kind === "initiative"
      ? { ...t, run: t.history[0], history: t.history.slice(1) }
      : t,
  );
  expect(campaign.tools.find((t) => t.id === rounds.id)).toMatchObject({
    value: 0,
  });
  expect(campaign.tools.find((t) => t.id === tracker.id)).toMatchObject({
    run: { activeId: "boss", legendaryTurn: expect.any(Object) },
  });
});
it("campaign copies and complete backups preserve phase pools and remap queued team identities", async () => {
  const app = newApp(),
    c = app.campaigns[0];
  const tracker = c.tools.find((t) => t.kind === "initiative")!;
  if (tracker.kind !== "initiative") throw new Error("fixture");
  const team = entry("team", {
    legendary: true,
    members: [
      { name: "L", hp: 10 },
      { name: "R", hp: 10 },
    ],
  });
  tracker.run = advance(
    advance(
      addMonsterToRun(
        { ...newRun(), combatants: [hero("A"), hero("B")] },
        team,
      ),
    ),
  );
  tracker.run.combatants[2] = setCombatantHp(tracker.run.combatants[2], 0);
  const copied = copyCampaign(c),
    copiedTracker = copied.tools.find((t) => t.kind === "initiative")!;
  if (copiedTracker.kind !== "initiative") throw new Error("fixture");
  expect(copiedTracker.run.legendaryTurn?.groups[0]).not.toBe(
    tracker.run.legendaryTurn?.groups[0],
  );
  expect(copiedTracker.run.combatants[2].legendary?.groupId).toBe(
    copiedTracker.run.legendaryTurn?.groups[0],
  );
  expect(copiedTracker.run.combatants[2].legendary?.phase).toBe("lastStand");
  const restored = await decodeBackup(
    await encodeBackup({ campaign: c, assets: [], packs: app.packs }),
  );
  expect(
    restored.campaign.tools.find((t) => t.kind === "initiative"),
  ).toMatchObject({ run: JSON.parse(JSON.stringify(tracker.run)) });
  expect(
    appSchema.parse({
      ...app,
      activeCampaignId: copied.id,
      campaigns: [copied],
    }).version,
  ).toBe(16);
});
it("schema 12 upgrades preserve HP, active turn, undo and original recovery without guessing spent Last Stand HP", async () => {
  const old = { ...newApp(), version: 12 };
  const tracker = old.campaigns[0].tools.find((t) => t.kind === "initiative")!;
  if (tracker.kind !== "initiative") throw new Error("fixture");
  const monster = entry("legacy", { legendary: true });
  tracker.run = {
    ...newRun(),
    activeId: "legacy",
    status: "paused",
    combatants: [
      {
        ...hero("legacy", "enemy"),
        hp: 0,
        monster: { target: monster.target, record: monster },
      },
    ],
  };
  tracker.history = [
    { ...tracker.run, combatants: [{ ...tracker.run.combatants[0], hp: 4 }] },
  ];
  old.campaigns[0].packRefs = [];
  const before = structuredClone(old);
  const migrated = migrateApp(old);
  const current = migrated.campaigns[0].tools.find(
    (t) => t.kind === "initiative",
  )!;
  if (current.kind !== "initiative") throw new Error("fixture");
  expect(current.run).toMatchObject({
    activeId: "legacy",
    status: "paused",
    combatants: [
      { hp: 0, legendary: { phase: "lastStand", lastStandHp: null } },
    ],
  });
  expect(current.history[0].combatants[0].legendary?.phase).toBe("bloodied");
  expect(old).toEqual(before);
  const dbName = "legendary-test-" + crypto.randomUUID();
  const seed = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 3);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("state");
      request.result.createObjectStore("assets");
      request.result.createObjectStore("recovery");
      request.result.createObjectStore("packs");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const tx = seed.transaction(["state", "packs"], "readwrite");
  tx.objectStore("state").put({ ...old, packs: [] }, "app");
  for (const pack of old.packs)
    tx.objectStore("packs").put(pack, pack.id + "@" + pack.version);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  seed.close();
  const repo = await Repository.open(dbName);
  try {
    expect((await repo.load()).version).toBe(16);
    expect((await repo.recoveryPoints())[0].data).toMatchObject({
      version: 12,
    });
    await repo.load();
    expect(await repo.recoveryPoints()).toHaveLength(1);
  } finally {
    repo.close();
    indexedDB.deleteDatabase(dbName);
  }
});

it("Nexus phase declarations and per-member pools survive canonical import and full record exchange", () => {
  const original = {
    data: [
      {
        type: "monsters",
        id: "pools",
        attributes: {
          name: "Pool twins",
          abilities: [],
          actions: [],
          level: 2,
          legendary: true,
          subtype: "team",
          bloodiedAt: 3,
          bloodied: { description: "At 3 HP, rage." },
          lastStand: "Resolve the final attack.",
          lastStandHp: 8,
          members: [
            {
              name: "A",
              hp: 10,
              lastStandHpPerHero: 3,
              abilities: [],
              actions: [],
            },
            { name: "B", hp: 12, lastStandHp: 5, abilities: [], actions: [] },
          ],
        },
      },
    ],
  };
  const record = parseExchange(JSON.stringify(original)).records[0];
  const e: Entry = { ...record, target: "local::" + record.id };
  const run = addMonsterToRun(newRun(), e, 4);
  expect(run.combatants[0].legendary).toMatchObject({
    bloodiedAt: 3,
    lastStandMaxHp: 12,
  });
  expect(run.combatants[1].legendary).toMatchObject({
    bloodiedAt: 3,
    lastStandMaxHp: 5,
  });
  const exported = exportRecords([record], "slate").value;
  const imported = parseExchange(JSON.stringify(exported)).records[0];
  expect(imported.fields).toEqual(JSON.parse(JSON.stringify(record.fields)));
});
it("a non-legendary team is unrated rather than guessing individual member levels", () => {
  const team = entry("ambiguous", {
    members: [
      { name: "A", hp: 10 },
      { name: "B", hp: 10 },
    ],
  });
  expect(encounterDifficulty(encounter([team]), [team], 4)).toMatchObject({
    label: "Unrated",
    ratio: null,
  });
});

it("declaring death resolves known and unknown Last Stand and removes future turns without deleting the combatant", () => {
  for (const c of [
    hero("ordinary", "enemy"),
    boss(),
    setCombatantHp(boss(), 0),
    {
      ...boss(),
      legendary: legendaryState(undefined, 10),
    },
  ]) {
    const dead = defeatCombatant(c);
    expect(dead.hp).toBe(0);
    expect(canAct(dead)).toBe(false);
    if (dead.legendary) {
      expect(dead.legendary.phase).toBe("defeated");
      expect(dead.legendary.lastStandHp).toBe(
        c.legendary?.lastStandHp === null ? null : 0,
      );
    }
    const run = advance({
      ...newRun(),
      combatants: [hero("Mira"), dead, hero("Rook")],
      activeId: "Mira",
      status: "active",
    });
    expect(run.activeId).toBe("Rook");
    expect(run.legendaryTurn).toBeUndefined();
    expect(run.combatants).toContainEqual(dead);
    expect(c.hp).toBe(c.legendary?.phase === "lastStand" ? 0 : 10);
  }
});

it("reviving restores 1 HP and future turns, preserving combatant data and resetting Last Stand", () => {
  for (const original of [
    hero("ordinary", "enemy"),
    boss(),
    { ...boss(), legendary: legendaryState(undefined, 10) },
    { ...boss(), legendary: { ...boss().legendary!, bloodiedAt: 0 } },
  ]) {
    const dead = defeatCombatant(original);
    const revived = reviveCombatant(dead);
    expect(revived).toMatchObject({
      id: original.id,
      name: original.name,
      hp: 1,
      maxHp: original.maxHp,
    });
    expect(canAct(revived)).toBe(true);
    expect(dead.hp).toBe(0);
    expect(canAct(dead)).toBe(false);
    if (revived.legendary) {
      expect(revived.legendary).toEqual({
        ...original.legendary,
        phase: original.legendary!.bloodiedAt >= 1 ? "bloodied" : "normal",
        lastStandHp: original.legendary!.lastStandMaxHp,
      });
      expect(changeCombatantHp(revived, -1).legendary).toMatchObject({
        phase: "lastStand",
        lastStandHp: original.legendary!.lastStandMaxHp,
      });
    }
    const run = advance({
      ...newRun(),
      combatants: [hero("Mira"), revived, hero("Rook")],
      activeId: "Mira",
      status: "active",
    });
    expect(run.activeId).toBe(revived.id);
    expect(!!run.legendaryTurn).toBe(!!revived.legendary);
  }
});
