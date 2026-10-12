import "fake-indexeddb/auto";
import { widgetCommands } from "./commands";
import { zipSync, strToU8 } from "fflate";
import { expect, it } from "vitest";
import {
  newApp,
  newCampaign,
  newTool,
  newRun,
  appSchema,
  changeRun,
  type InitiativeTool,
  type Campaign,
  type Tool,
} from "./model";
import {
  utilityKinds,
  utilitySchema,
  tableDefinitionSchema,
  defaultTableDefinition,
  tableToolSchema,
  timerStateSchema,
  stopwatchStateSchema,
} from "./utility-schema";
import {
  weightedOutcome,
  rollTable,
  parseTableImport,
  elapsed,
  remaining,
  toggleStopwatch,
  toggleTimer,
  counterValue,
  clockText,
  advanceCampaign,
  applyToolUpdate,
} from "./utilities";
import { copyCampaign } from "./campaigns";
import { encodeBackup, decodeBackup, digest } from "./backup";
import { Repository } from "./storage";
import { migrateCampaign, migrateApp } from "./migrations";

const tool = <K extends Tool["kind"]>(kind: K) =>
  newTool(kind) as Extract<Tool, { kind: K }>;
const legacyTable = () =>
  tableToolSchema.parse({
    ...newTool("table"),
    definition: { ...defaultTableDefinition(), mode: "weighted" },
  });
const tracker = (c: Campaign) =>
  c.tools.find((t) => t.kind === "initiative") as InitiativeTool;
function combatCampaign() {
  const c = newCampaign("Travel"),
    t = tracker(c);
  t.run = {
    ...newRun(),
    combatants: [
      {
        id: "hero",
        name: "Hero",
        side: "hero",
        initiative: null,
        hp: 5,
        maxHp: 5,
        conditions: "",
        notes: "",
      },
      {
        id: "enemy",
        name: "Enemy",
        side: "enemy",
        initiative: null,
        hp: 5,
        maxHp: 5,
        conditions: "",
        notes: "",
      },
    ],
  };
  return c;
}
it("creates five distinct, validated utilities with fresh state and IDs", () => {
  for (const kind of utilityKinds) {
    const a = newTool(kind),
      b = newTool(kind);
    expect(a.id).not.toBe(b.id);
    expect(utilitySchema.parse(a)).toEqual(a);
  }
  expect(
    utilitySchema.safeParse({ ...tool("counter"), max: 1, value: 2 }).success,
  ).toBe(false);
  expect(
    utilitySchema.safeParse({
      ...tool("time"),
      timer: { ...tool("time").timer, durationMs: Infinity },
    }).success,
  ).toBe(false);
  expect(
    utilitySchema.safeParse({ ...tool("counter"), value: -1 }).success,
  ).toBe(false);
});
it("rejects overlapping, incomplete, out-of-range or unbounded random table mappings", () => {
  const t = legacyTable();
  t.definition.mode = "ranges";
  expect(tableDefinitionSchema.parse(t.definition)).toEqual(t.definition);
  const bad = [
    { ...t.definition, formula: "1d6!" },
    {
      ...t.definition,
      rows: [{ ...t.definition.rows[0], from: 1, to: 4 }, t.definition.rows[1]],
    },
    {
      ...t.definition,
      rows: [{ ...t.definition.rows[0], to: 2 }, t.definition.rows[1]],
    },
    {
      ...t.definition,
      rows: [{ ...t.definition.rows[0], from: 0 }, t.definition.rows[1]],
    },
  ];
  for (const value of bad)
    expect(tableDefinitionSchema.safeParse(value).success).toBe(false);
  t.definition.formula = "2d6";
  t.definition.rows = [{ ...t.definition.rows[0], from: 2, to: 12 }];
  expect(tableDefinitionSchema.safeParse(t.definition).success).toBe(true);
});
it("rolls through the shared dice engine and retains independent result snapshots", () => {
  const t = legacyTable();
  const samples: string[] = [];
  const result = rollTable(t, [t], undefined, (f) => {
    samples.push(f);
    return 2;
  });
  expect(samples).toEqual(["1d100"]);
  expect(result.steps[0].name).toBe("Footsteps");
  t.definition.rows[1].body = "Changed";
  expect(result.steps[0].body).toBe("Someone approaches.");
  expect(rollTable(t, [t], t.definition.rows[0].id).steps[0]).toMatchObject({
    roll: null,
    name: "Quiet",
  });
  const single = {
    ...t,
    definition: { ...t.definition, rows: [t.definition.rows[0]] },
  };
  expect(rollTable(single, [single]).steps[0].roll).toBe(1);
  t.definition.mode = "ranges";
  expect(rollTable(t, [t], undefined, () => 6).steps[0].name).toBe("Footsteps");
  expect(rollTable(t, [t]).steps).toHaveLength(1);
});
it("rejects missing linked tables, cycles and deep recursion before mutating anything", () => {
  const a = legacyTable(),
    b = legacyTable();
  a.definition.rows[0].tableId = b.id;
  b.definition.rows[0].tableId = a.id;
  const before = structuredClone([a, b]);
  expect(() => rollTable(a, [a, b], undefined, () => 1)).toThrow(/cycle/);
  expect([a, b]).toEqual(before);
  expect(() => rollTable(a, [a], undefined, () => 1)).toThrow(/unavailable/);
  const chain = Array.from({ length: 9 }, () => legacyTable());
  chain
    .slice(0, -1)
    .forEach((t, i) => (t.definition.rows[0].tableId = chain[i + 1].id));
  expect(() => rollTable(chain[0], chain, undefined, () => 1)).toThrow(/eight/);
});
it("imports only validated, portable table definitions with no implicit mappings", () => {
  const t = legacyTable(),
    text = JSON.stringify({
      format: "slate-table",
      version: 1,
      name: t.name,
      definition: t.definition,
    });
  expect(parseTableImport(text).definition).toEqual(t.definition);
  for (const raw of [
    {
      format: "slate-table",
      version: 2,
      name: t.name,
      definition: t.definition,
    },
    { format: "slate-table", version: 1, name: "", definition: t.definition },
    {
      format: "slate-table",
      version: 1,
      name: t.name,
      definition: { ...t.definition, rows: [] },
    },
  ])
    expect(() => parseTableImport(JSON.stringify(raw))).toThrow();
  t.definition.rows[0].tableId = "other";
  expect(() =>
    parseTableImport(
      JSON.stringify({
        format: "slate-table",
        version: 1,
        name: t.name,
        definition: t.definition,
      }),
    ),
  ).toThrow(/links/);
  expect(() => parseTableImport(" ".repeat(4 * 1024 * 1024 + 1))).toThrow(
    /MiB/,
  );
});
it("reconciles stopwatch suspension, pause and backwards clock changes without tick writes", () => {
  let t = toggleStopwatch(tool("time").stopwatch, 1000);
  expect(elapsed(t, 11000)).toBe(10000);
  expect(elapsed(t, 0)).toBe(0);
  t = toggleStopwatch(t, 11000);
  expect(elapsed(t, 31000)).toBe(10000);
  t = toggleStopwatch(t, 31000);
  expect(elapsed(t, 41000)).toBe(20000);
  expect(stopwatchStateSchema.parse(JSON.parse(JSON.stringify(t)))).toEqual(t);
});
it("retains countdown deadlines, paused duration and expiry acknowledgement across reload", () => {
  let t = toggleTimer(tool("time").timer, 1000);
  expect(remaining(t, 11000)).toBe(290000);
  t = toggleTimer(t, 11000);
  expect(t.deadline).toBeNull();
  expect(remaining(t, 100000)).toBe(290000);
  t = toggleTimer(t, 100000);
  expect(t.deadline).toBe(390000);
  expect(remaining(t, 400000)).toBe(0);
  const restored = timerStateSchema.parse(
    JSON.parse(JSON.stringify({ ...t, acknowledged: true })),
  );
  expect(remaining(restored, 900000)).toBe(0);
  expect(restored.acknowledged).toBe(true);
});
it("clamps travel counters, preserves fractional steps and validates target bounds", () => {
  const t = { ...tool("counter"), step: 0.1, max: 1, target: 1 };
  let value = 0;
  for (let i = 0; i < 12; i++) value = counterValue(t, value + t.step);
  expect(value).toBe(1);
  expect(counterValue(t, -1)).toBe(0);
  expect(utilitySchema.safeParse({ ...t, value: 2 }).success).toBe(false);
  expect(utilitySchema.safeParse({ ...t, target: 2 }).success).toBe(false);
});
it("links only explicit turn/round events and undoes them atomically with combat", () => {
  let c = combatCampaign();
  const id = tracker(c).id;
  const turn = {
      ...tool("counter"),
      value: 3,
      link: {
        trackerId: id,
        event: "turn" as const,
        direction: "decrement" as const,
        paused: false,
      },
    },
    round = {
      ...tool("counter"),
      value: 3,
      link: {
        trackerId: id,
        event: "round" as const,
        direction: "decrement" as const,
        paused: false,
      },
    },
    manual = { ...tool("counter"), initial: 10, value: 10 },
    other = {
      ...tool("counter"),
      initial: 10,
      value: 10,
      link: {
        trackerId: "another",
        event: "turn" as const,
        direction: "decrement" as const,
        paused: false,
      },
    };
  c.tools.push(turn, round, manual, other);
  const count = (id: string) => {
    const t = c.tools.find((t) => t.id === id);
    if (t?.kind !== "counter") throw Error();
    return t.value;
  };
  c = advanceCampaign(c, id);
  expect(count(turn.id)).toBe(3);
  c = advanceCampaign(c, id);
  expect(count(turn.id)).toBe(2);
  expect(count(round.id)).toBe(3);
  c = advanceCampaign(c, id);
  expect(count(turn.id)).toBe(1);
  expect(count(round.id)).toBe(2);
  expect(count(manual.id)).toBe(10);
  expect(count(other.id)).toBe(10);
  c = applyToolUpdate(c, id, (t) => {
    if (t.kind !== "initiative") return t;
    return { ...t, run: t.history[0], history: t.history.slice(1) };
  });
  expect(count(turn.id)).toBe(2);
  expect(count(round.id)).toBe(3);
  expect(tracker(c).run.round).toBe(1);
  c = applyToolUpdate(c, id, (t) =>
    t.kind === "initiative" ? changeRun(t, { ...t.run, name: "Renamed" }) : t,
  );
  c = applyToolUpdate(c, id, (t) =>
    t.kind === "initiative"
      ? { ...t, run: t.history[0], history: t.history.slice(1) }
      : t,
  );
  expect(count(turn.id)).toBe(2);
});
it("does not replay linked steps after pause, reset, reload or history saturation", () => {
  let c = combatCampaign();
  const id = tracker(c).id;
  const countdown = {
    ...tool("counter"),
    value: 50,
    initial: 10,
    link: {
      trackerId: id,
      event: "turn" as const,
      direction: "decrement" as const,
      paused: false,
    },
  };
  c.tools.push(countdown);
  c = advanceCampaign(c, id);
  for (let i = 0; i < 35; i++) c = advanceCampaign(c, id);
  expect(tracker(c).history).toHaveLength(30);
  expect(tracker(c).utilityHistory).toHaveLength(30);
  const restored = migrateApp({
    ...newApp(),
    campaigns: [c],
    activeCampaignId: c.id,
  });
  expect(restored.campaigns[0]).toEqual(c);
  c = applyToolUpdate(c, countdown.id, (t) =>
    t.kind === "counter"
      ? {
          ...t,
          value: t.initial,
          epoch: t.epoch + 1,
          link: { ...t.link!, paused: true },
        }
      : t,
  );
  c = applyToolUpdate(c, id, (t) =>
    t.kind === "initiative"
      ? { ...t, run: t.history[0], history: t.history.slice(1) }
      : t,
  );
  expect(
    (c.tools.find((t) => t.id === countdown.id) as typeof countdown).value,
  ).toBe(10);
  c = advanceCampaign(c, id);
  expect(
    (c.tools.find((t) => t.id === countdown.id) as typeof countdown).value,
  ).toBe(10);
});
it("duplicates utility IDs, linked trackers/tables, reference prose, assets and combat undo mappings", () => {
  let c = combatCampaign();
  const id = tracker(c).id,
    a = legacyTable(),
    b = legacyTable(),
    image = tool("image"),
    list = tool("checklist"),
    note = tool("note");
  note.body = "Camp";
  a.definition.rows[0].tableId = b.id;
  a.definition.rows[0].body = "[Camp](slate:local%3A%3A" + note.id + ")";
  image.assetId = "asset";
  c.assets = [
    {
      id: "asset",
      name: "Map",
      mime: "image/png",
      size: 1,
      sha256: "a".repeat(64),
    },
  ];
  list.entries = [{ id: "entry", text: "Camp", checked: true, indent: 1 }];
  c = migrateCampaign({ ...c, tools: [...c.tools, a, b] }, 15);
  c.tools.push(image, list, note, {
    ...tool("counter"),
    initial: 10,
    value: 10,
    link: {
      trackerId: id,
      event: "turn",
      direction: "decrement" as const,
      paused: false,
    },
  });
  c = advanceCampaign(advanceCampaign(c, id), id);
  const copy = copyCampaign(c),
    copiedA = copy.tools.find(
      (t) => t.id !== a.id && t.name === a.name && t.kind === "table",
    ) as Extract<Tool, { kind: "table" }>;
  const copiedDefinition = tableDefinitionSchema.parse(
    copy.content.find((record) => `local::${record.id}` === copiedA.target)!
      .fields.definition,
  );
  expect(copiedDefinition.rows[0].tableId).not.toBe(`local::table-${b.id}`);
  expect(
    copy.content.some(
      (record) => `local::${record.id}` === copiedDefinition.rows[0].tableId,
    ),
  ).toBe(true);
  expect(copiedDefinition.rows[0].body).not.toContain(note.id);
  expect(
    (
      copy.tools.find((t) => t.kind === "image") as Extract<
        Tool,
        { kind: "image" }
      >
    ).assetId,
  ).toBe(copy.assets[0].id);
  const link = copy.tools.find((t) => t.kind === "counter")!;
  expect(link.kind === "counter" && link.link?.trackerId).toBe(
    tracker(copy).id,
  );
  expect(tracker(copy).utilityHistory?.[0][0].toolId).toBe(link.id);
});
it("round-trips all utility state and local image bytes through a campaign backup", async () => {
  const app = newApp(),
    campaign = app.campaigns[0];
  campaign.tools.push(...utilityKinds.map((k) => newTool(k)));
  const bytes = new Uint8Array([137, 80, 78, 71]),
    blob = new Blob([bytes], { type: "image/png" }),
    id = "map";
  campaign.assets = [
    {
      id,
      name: "Map",
      mime: "image/png",
      size: bytes.length,
      sha256: await digest(bytes),
    },
  ];
  const image = campaign.tools.find((t) => t.kind === "image")!;
  if (image.kind === "image") image.assetId = id;
  const restored = await decodeBackup(
    await encodeBackup({
      campaign,
      assets: [{ campaignId: campaign.id, id, blob }],
      packs: app.packs,
    }),
  );
  expect(restored.campaign).toEqual(campaign);
  expect(new Uint8Array(await restored.assets[0].blob.arrayBuffer())).toEqual(
    bytes,
  );
});
it("upgrades schema 9 with disabled packs intact and exactly one original recovery checkpoint", async () => {
  const prior = { ...newApp(), version: 9 };
  prior.campaigns[0].packRefs = [];
  const name = crypto.randomUUID(),
    db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open(name, 3);
      request.onupgradeneeded = () =>
        ["state", "packs", "assets", "recovery"].forEach((s) =>
          request.result.createObjectStore(s),
        );
      request.onsuccess = () => resolve(request.result);
    });
  await new Promise<void>((resolve) => {
    const tx = db.transaction(["state", "packs"], "readwrite");
    tx.objectStore("state").put({ ...prior, packs: [] }, "app");
    prior.packs.forEach((p) =>
      tx.objectStore("packs").put(p, p.id + "@" + p.version),
    );
    tx.oncomplete = () => resolve();
  });
  db.close();
  const repo = await Repository.open(name),
    upgraded = await repo.load();
  expect(upgraded.version).toBe(16);
  expect(upgraded.campaigns[0].packRefs).toEqual([]);
  expect((await repo.recoveryPoints())[0].data).toMatchObject({ version: 9 });
  expect((await repo.load()).revision).toBe(1);
  expect(await repo.recoveryPoints()).toHaveLength(1);
  expect(appSchema.parse(upgraded)).toEqual(upgraded);
  repo.close();
});

it("uses the real shared dice engine for arbitrary weighted totals and rejects biased overflow", () => {
  const t = legacyTable();
  t.definition.rows[0].weight = 3;
  t.definition.rows[1].weight = 4;
  expect(rollTable(t, [t]).steps[0].roll).toBeGreaterThanOrEqual(1);
  const sequence = [100, 2];
  expect(weightedOutcome(3, () => sequence.shift()!)).toBe(2);
  expect(() => weightedOutcome(3, () => 100)).toThrow(/Try rolling again/);
  expect(weightedOutcome(2000000, () => 1)).toBe(1);
});

it.each(["increment", "decrement"] as const)(
  "applies fractional %s on turns, clamps actual changes and preserves later manual edits on undo",
  (direction) => {
    let c = combatCampaign();
    const id = tracker(c).id;
    const counter = {
      ...tool("counter"),
      value: direction === "increment" ? 0.8 : 0.2,
      step: 0.5,
      max: 1,
      link: { trackerId: id, event: "turn" as const, direction, paused: false },
    };
    c.tools.push(counter);
    c = advanceCampaign(c, id);
    c = advanceCampaign(c, id);
    const get = () =>
      c.tools.find((t) => t.id === counter.id) as typeof counter;
    expect(get().value).toBe(direction === "increment" ? 1 : 0);
    expect(tracker(c).utilityHistory?.[0][0].delta).toBeCloseTo(
      direction === "increment" ? 0.2 : -0.2,
    );
    // A further advance at the bound records no change and undo must not invent one.
    c = advanceCampaign(c, id);
    expect(tracker(c).utilityHistory?.[0]).toEqual([]);
    const undo = () => {
      c = applyToolUpdate(c, id, (t) =>
        t.kind === "initiative"
          ? { ...t, run: t.history[0], history: t.history.slice(1) }
          : t,
      );
    };
    undo();
    expect(get().value).toBe(direction === "increment" ? 1 : 0);
    c = applyToolUpdate(c, counter.id, (t) =>
      t.kind === "counter" ? { ...t, value: 0.5 } : t,
    );
    undo();
    expect(get().value).toBe(direction === "increment" ? 0.3 : 0.7);
  },
);

it("increments on each round with one living combatant and ignores paused combat/linkage", () => {
  let c = combatCampaign();
  const id = tracker(c).id;
  tracker(c).run.combatants.pop();
  const counter = {
    ...tool("counter"),
    step: 2,
    link: {
      trackerId: id,
      event: "round" as const,
      direction: "increment" as const,
      paused: false,
    },
  };
  c.tools.push(counter);
  const get = () => c.tools.find((t) => t.id === counter.id) as typeof counter;
  c = advanceCampaign(c, id);
  expect(get().value).toBe(0);
  c = advanceCampaign(c, id);
  expect(get().value).toBe(2);
  c = applyToolUpdate(c, id, (t) =>
    t.kind === "initiative" ? changeRun(t, { ...t.run, status: "paused" }) : t,
  );
  c = advanceCampaign(c, id);
  expect(get().value).toBe(2);
  c = applyToolUpdate(c, id, (t) =>
    t.kind === "initiative" ? changeRun(t, { ...t.run, status: "active" }) : t,
  );
  c = applyToolUpdate(c, counter.id, (t) =>
    t.kind === "counter" && t.link
      ? { ...t, link: { ...t.link, paused: true } }
      : t,
  );
  c = advanceCampaign(c, id);
  expect(get().value).toBe(2);
});

function legacyCounterApp() {
  const app = newApp(),
    c = app.campaigns[0],
    id = tracker(c).id;
  const clock = {
    id: "clock",
    kind: "clock",
    name: "Alarm",
    segments: 6,
    filled: 4,
  };
  const countdown = {
    id: "countdown",
    kind: "countdown",
    name: "Spell duration",
    initial: 5,
    remaining: 3,
    epoch: 2,
    link: { trackerId: id, event: "round", paused: false },
  };
  const distance = {
    id: "distance",
    kind: "counter",
    name: "Travel",
    value: 2.5,
    unit: "miles",
    step: 0.5,
    min: 1,
    max: 10,
    target: 8,
  };
  const widget = {
    id: "clock-tile",
    toolId: "clock",
    kind: "clock",
    title: "",
    x: 0,
    y: 0,
    w: 2,
    h: 2,
  };
  const layout = { grid: c.screens[0].grid, widgets: [widget] };
  return {
    ...app,
    version: 10,
    campaigns: [
      {
        ...c,
        tools: [
          ...c.tools.map((t) =>
            t.kind === "initiative"
              ? {
                  ...t,
                  history: [t.run],
                  utilityHistory: [
                    [{ toolId: "countdown", epoch: 2, amount: 1 }],
                  ],
                }
              : t,
          ),
          clock,
          countdown,
          distance,
        ],
        screens: [
          {
            ...c.screens[0],
            widgets: [widget],
            undo: [layout],
            redo: [layout],
          },
        ],
        layoutPresets: [
          {
            ...layout,
            id: "preset",
            name: "Alarm",
            tools: [{ id: clock.id, kind: clock.kind, name: clock.name }],
          },
        ],
        packRefs: [],
      },
    ],
  };
}

it("migrates clocks, countdowns, travel values, placements, layout history, presets and combat undo without mutating originals", () => {
  const old = legacyCounterApp(),
    original = structuredClone(old);
  const app = migrateApp(old),
    c = app.campaigns[0];
  expect(old).toEqual(original);
  expect(app.version).toBe(16);
  expect(c.packRefs).toEqual([]);
  expect(c.tools.find((t) => t.id === "clock")).toMatchObject({
    kind: "counter",
    name: "Alarm",
    value: 4,
    initial: 0,
    max: 6,
    target: 6,
  });
  expect(c.tools.find((t) => t.id === "countdown")).toMatchObject({
    kind: "counter",
    value: 3,
    initial: 5,
    epoch: 2,
    target: 0,
    link: { direction: "decrement", event: "round" },
  });
  expect(c.tools.find((t) => t.id === "distance")).toMatchObject({
    kind: "counter",
    value: 2.5,
    initial: 1,
    step: 0.5,
    unit: "miles",
    min: 1,
    max: 10,
    target: 8,
    link: null,
  });
  expect(c.screens[0].widgets[0]).toMatchObject({
    ...original.campaigns[0].screens[0].widgets[0],
    kind: "counter",
  });
  expect(c.screens[0].undo[0].widgets[0].kind).toBe("counter");
  expect(c.screens[0].redo[0].widgets[0].kind).toBe("counter");
  expect(c.layoutPresets[0].widgets[0].kind).toBe("counter");
  expect(c.layoutPresets[0].tools[0].kind).toBe("counter");
  expect(tracker(c).utilityHistory?.[0]).toEqual([
    { toolId: "countdown", epoch: 2, delta: -1 },
  ]);
  const undone = applyToolUpdate(c, tracker(c).id, (t) =>
    t.kind === "initiative"
      ? { ...t, run: t.history[0], history: t.history.slice(1) }
      : t,
  );
  expect(undone.tools.find((t) => t.id === "countdown")).toMatchObject({
    value: 4,
  });
  expect(migrateApp(app)).toEqual(app);
});

it("rejects corrupt legacy counter values and invalid undo entries", () => {
  for (const invalid of [
    { id: "bad", kind: "clock", name: "Bad", segments: 6, filled: 7 },
    {
      id: "bad",
      kind: "countdown",
      name: "Bad",
      initial: 3,
      remaining: -1,
      epoch: 0,
      link: null,
    },
  ]) {
    const old = legacyCounterApp();
    old.campaigns[0].tools.push(invalid as never);
    expect(() => migrateApp(old)).toThrow();
  }
  const old = legacyCounterApp();
  const initiative = old.campaigns[0].tools.find(
    (t) => t.kind === "initiative",
  ) as unknown as { utilityHistory: { amount: number }[][] };
  initiative.utilityHistory[0][0].amount = -1;
  expect(() => migrateApp(old)).toThrow();
});

it("restores schema 10 campaign ZIP counters and undo after checking original checksums", async () => {
  const old = legacyCounterApp(),
    bytes = strToU8(JSON.stringify(old.campaigns[0])),
    packs = strToU8(JSON.stringify(old.packs));
  const zip = zipSync({
    "campaign.json": bytes,
    "packs.json": packs,
    "manifest.json": strToU8(
      JSON.stringify({
        format: "slate-campaign",
        version: 1,
        schemaVersion: 10,
        createdAt: new Date().toISOString(),
        campaignId: old.campaigns[0].id,
        campaignSha256: await digest(bytes),
        packsSha256: await digest(packs),
        assets: [],
      }),
    ),
  });
  const restored = await decodeBackup(zip);
  expect(restored.campaign).toEqual(migrateApp(old).campaigns[0]);
});

it("upgrades schema 10 counters once and keeps an intact original recovery checkpoint with hydrated packs", async () => {
  const old = legacyCounterApp(),
    name = crypto.randomUUID();
  const db = await new Promise<IDBDatabase>((resolve) => {
    const request = indexedDB.open(name, 3);
    request.onupgradeneeded = () =>
      ["state", "packs", "assets", "recovery"].forEach((s) =>
        request.result.createObjectStore(s),
      );
    request.onsuccess = () => resolve(request.result);
  });
  await new Promise<void>((resolve) => {
    const tx = db.transaction(["state", "packs"], "readwrite");
    tx.objectStore("state").put({ ...old, packs: [] }, "app");
    old.packs.forEach((p) =>
      tx.objectStore("packs").put(p, p.id + "@" + p.version),
    );
    tx.oncomplete = () => resolve();
  });
  db.close();
  const repo = await Repository.open(name),
    upgraded = await repo.load();
  expect(upgraded.version).toBe(16);
  expect(upgraded.packs).toEqual(old.packs);
  expect(
    upgraded.campaigns[0].tools.find((t) => t.id === "countdown"),
  ).toMatchObject({ value: 3, link: { direction: "decrement" } });
  const checkpoints = await repo.recoveryPoints();
  expect(checkpoints).toHaveLength(1);
  expect(checkpoints[0].data).toEqual(old);
  expect((await repo.load()).revision).toBe(upgraded.revision);
  expect(await repo.recoveryPoints()).toHaveLength(1);
  repo.close();
});

it("offers a single counter type and ranks its exact title ahead of encounter keywords", () => {
  const c = newCampaign("Tools");
  expect(utilityKinds).toHaveLength(5);
  expect(widgetCommands(c, "Counter")[0]).toMatchObject({
    title: "Counter",
    kind: "counter",
  });
  expect(widgetCommands(c, "Progress clock").map((c) => c.kind)).toEqual([
    "counter",
  ]);
  expect(widgetCommands(c, "Step countdown").map((c) => c.kind)).toEqual([
    "counter",
  ]);
});

function legacyTimeApp(version = 11) {
  const app = newApp(),
    c = app.campaigns[0],
    id = tracker(c).id;
  const stopwatch = {
    id: "watch",
    name: "Session time",
    kind: "stopwatch",
    elapsedMs: 1500,
    startedAt: 1000,
  };
  const timer = {
    id: "timer",
    name: "Break",
    kind: "timer",
    durationMs: 60000,
    remainingMs: 45000,
    deadline: 61000,
    acknowledged: true,
  };
  const widgets = [
    {
      id: "watch-tile",
      toolId: "watch",
      kind: "stopwatch",
      title: "",
      x: 0,
      y: 0,
      w: 3,
      h: 2,
    },
    {
      id: "timer-tile",
      toolId: "timer",
      kind: "timer",
      title: "",
      x: 3,
      y: 0,
      w: 3,
      h: 2,
    },
  ];
  const layout = { grid: c.screens[0].grid, widgets };
  const counter = {
    ...tool("counter"),
    value: 4,
    initial: 7,
    epoch: 3,
    step: 2,
    link: {
      trackerId: id,
      event: "turn" as const,
      direction: "increment" as const,
      paused: false,
    },
  };
  return {
    ...app,
    version,
    campaigns: [
      {
        ...c,
        packRefs: [],
        tools: [
          ...c.tools.map((t) =>
            t.kind === "initiative"
              ? {
                  ...t,
                  history: [t.run],
                  utilityHistory: [
                    [{ toolId: counter.id, epoch: counter.epoch, delta: 2 }],
                  ],
                }
              : t,
          ),
          stopwatch,
          timer,
          counter,
        ],
        screens: [{ ...c.screens[0], widgets, undo: [layout], redo: [layout] }],
        layoutPresets: [
          {
            ...layout,
            id: "time-preset",
            name: "Time tools",
            tools: [stopwatch, timer].map(({ id, name, kind }) => ({
              id,
              name,
              kind,
            })),
          },
        ],
      },
    ],
  };
}

it("migrates schema 11 time tools, placements, presets and history while leaving linked counters intact", () => {
  const old = legacyTimeApp(),
    original = structuredClone(old),
    app = migrateApp(old),
    c = app.campaigns[0];
  expect(old).toEqual(original);
  expect(app.version).toBe(16);
  expect(c.packRefs).toEqual([]);
  const watch = c.tools.find((t) => t.id === "watch") as Extract<
    Tool,
    { kind: "time" }
  >;
  const timer = c.tools.find((t) => t.id === "timer") as Extract<
    Tool,
    { kind: "time" }
  >;
  expect(watch).toMatchObject({
    kind: "time",
    name: "Session time",
    mode: "stopwatch",
    clockFormat: "24h",
    stopwatch: { elapsedMs: 1500, startedAt: 1000 },
  });
  expect(timer).toMatchObject({
    kind: "time",
    name: "Break",
    mode: "timer",
    timer: {
      durationMs: 60000,
      remainingMs: 45000,
      deadline: 61000,
      acknowledged: true,
    },
  });
  expect(elapsed(watch.stopwatch, 6000)).toBe(6500);
  expect(remaining(timer.timer, 6000)).toBe(55000);
  expect(c.screens[0].widgets.map((w) => w.kind)).toEqual(["time", "time"]);
  expect(c.screens[0].widgets.map((w) => w.id)).toEqual([
    "watch-tile",
    "timer-tile",
  ]);
  expect(c.screens[0].undo[0].widgets.map((w) => w.kind)).toEqual([
    "time",
    "time",
  ]);
  expect(c.screens[0].redo[0].widgets.map((w) => w.kind)).toEqual([
    "time",
    "time",
  ]);
  expect(c.layoutPresets[0].tools.map((t) => t.kind)).toEqual(["time", "time"]);
  const counter = c.tools.find((t) => t.kind === "counter")!;
  expect(counter).toEqual(
    old.campaigns[0].tools.find((t) => t.kind === "counter"),
  );
  expect(tracker(c).utilityHistory).toEqual(
    (
      old.campaigns[0].tools.find(
        (t) => t.kind === "initiative",
      ) as InitiativeTool
    ).utilityHistory,
  );
  const undone = applyToolUpdate(c, tracker(c).id, (t) =>
    t.kind === "initiative"
      ? { ...t, run: t.history[0], history: t.history.slice(1) }
      : t,
  );
  expect(undone.tools.find((t) => t.id === counter.id)).toMatchObject({
    value: 2,
  });
  expect(migrateApp(app)).toEqual(app);
});

it("rejects invalid legacy time state without modifying the original", () => {
  for (const invalid of [
    {
      id: "bad",
      name: "Bad",
      kind: "stopwatch",
      elapsedMs: -1,
      startedAt: null,
    },
    {
      id: "bad",
      name: "Bad",
      kind: "timer",
      durationMs: 0,
      remainingMs: 0,
      deadline: null,
      acknowledged: false,
    },
    {
      id: "bad",
      name: "Bad",
      kind: "timer",
      durationMs: 1000,
      remainingMs: 1000,
      deadline: -1,
      acknowledged: false,
    },
  ]) {
    const old = legacyTimeApp();
    old.campaigns[0].tools.push(invalid as never);
    const original = structuredClone(old);
    expect(() => migrateApp(old)).toThrow();
    expect(old).toEqual(original);
  }
});

it("round-trips both running time modes and clock preferences through backup and campaign duplication", async () => {
  const app = newApp(),
    campaign = app.campaigns[0],
    t = tool("time");
  t.mode = "clock";
  t.clockFormat = "12h";
  t.stopwatch = toggleStopwatch(t.stopwatch, 1000);
  t.timer = toggleTimer(t.timer, 1000);
  campaign.tools.push(t);
  const restored = await decodeBackup(
    await encodeBackup({ campaign, packs: app.packs, assets: [] }),
  );
  expect(restored.campaign).toEqual(campaign);
  const copy = copyCampaign(campaign),
    copied = copy.tools.find((t) => t.kind === "time")!;
  expect(copied.id).not.toBe(t.id);
  expect({ ...copied, id: t.id }).toEqual(t);
  expect(copied.kind === "time" && elapsed(copied.stopwatch, 11000)).toBe(
    10000,
  );
  expect(copied.kind === "time" && remaining(copied.timer, 11000)).toBe(290000);
});

it("restores schema 11 ZIP time tools and preserves linked counter undo", async () => {
  const old = legacyTimeApp(),
    bytes = strToU8(JSON.stringify(old.campaigns[0])),
    packs = strToU8(JSON.stringify(old.packs));
  const zip = zipSync({
    "campaign.json": bytes,
    "packs.json": packs,
    "manifest.json": strToU8(
      JSON.stringify({
        format: "slate-campaign",
        version: 1,
        schemaVersion: 11,
        createdAt: new Date().toISOString(),
        campaignId: old.campaigns[0].id,
        campaignSha256: await digest(bytes),
        packsSha256: await digest(packs),
        assets: [],
      }),
    ),
  });
  expect((await decodeBackup(zip)).campaign).toEqual(
    migrateApp(old).campaigns[0],
  );
});

it("upgrades stored schema 11 time tools once with their original packs and recovery state", async () => {
  const old = legacyTimeApp(),
    name = crypto.randomUUID();
  const db = await new Promise<IDBDatabase>((resolve) => {
    const request = indexedDB.open(name, 3);
    request.onupgradeneeded = () =>
      ["state", "packs", "assets", "recovery"].forEach((s) =>
        request.result.createObjectStore(s),
      );
    request.onsuccess = () => resolve(request.result);
  });
  await new Promise<void>((resolve) => {
    const tx = db.transaction(["state", "packs"], "readwrite");
    tx.objectStore("state").put({ ...old, packs: [] }, "app");
    old.packs.forEach((p) =>
      tx.objectStore("packs").put(p, p.id + "@" + p.version),
    );
    tx.oncomplete = () => resolve();
  });
  db.close();
  const repo = await Repository.open(name),
    upgraded = await repo.load();
  expect(upgraded.version).toBe(16);
  expect(upgraded.packs).toEqual(old.packs);
  expect(
    upgraded.campaigns[0].tools.find((t) => t.id === "watch"),
  ).toMatchObject({
    kind: "time",
    mode: "stopwatch",
    stopwatch: { startedAt: 1000 },
  });
  expect((await repo.recoveryPoints())[0].data).toEqual(old);
  expect((await repo.load()).revision).toBe(upgraded.revision);
  expect(await repo.recoveryPoints()).toHaveLength(1);
  repo.close();
});

it("formats local clocks with midnight and explicit 12/24-hour preferences", () => {
  const midnight = Date.UTC(2026, 9, 11, 0, 0, 0);
  expect(clockText(midnight, "24h", "en-GB", "UTC")).toBe("00:00:00");
  expect(clockText(midnight, "12h", "en-GB", "UTC")).toBe("12:00:00 am");
  expect(clockText(midnight, "24h", "en-GB", "Australia/Sydney")).toBe(
    "11:00:00",
  );
});
