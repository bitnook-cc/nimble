import { describe, expect, it } from "vitest";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import {
  advance,
  newApp,
  newRun,
  newTool,
  changeRun,
  type Combatant,
  type Run,
} from "./model";
import { legendaryState } from "./legendary";
import {
  nimbleOrder,
  prepareClassicInitiative,
  setInitiativeMode,
  sortInitiative,
} from "./initiative";
import { migrateApp, migrateCampaign } from "./migrations";
import { advanceCampaign, applyToolUpdate } from "./utilities";
import { copyCampaign } from "./campaigns";
import { encodeBackup, decodeBackup } from "./backup";

const creature = (
  id: string,
  side: Combatant["side"] = "hero",
  initiative: number | null = null,
): Combatant => ({
  id,
  name: id,
  side,
  initiative,
  hp: 10,
  maxHp: 10,
  conditions: "",
  notes: "",
});
const boss = (): Combatant => ({
  ...creature("boss", "enemy", 30),
  legendary: legendaryState(undefined, 10),
});

describe("Initiative modes", () => {
  it("defaults new trackers to Nimble and groups heroes before monsters without sorting by rolls", () => {
    const combatants = [
      creature("goblin", "enemy", 40),
      creature("Mira", "hero", 1),
      creature("guard", "enemy", 20),
      creature("Rook", "hero", 15),
    ];
    expect(newRun().mode).toBe("nimble");
    expect(nimbleOrder(combatants).map((c) => c.id)).toEqual([
      "Mira",
      "Rook",
      "goblin",
      "guard",
    ]);
    let run = { ...newRun(), combatants };
    const turns = [];
    for (let i = 0; i < 5; i++) {
      run = advance(run);
      turns.push([run.activeId, run.round]);
    }
    expect(turns).toEqual([
      ["Mira", 1],
      ["Rook", 1],
      ["goblin", 1],
      ["guard", 1],
      ["Mira", 2],
    ]);
    expect(combatants[0].id).toBe("goblin");
  });

  it("Nimble legendary monsters alternate with heroes, without extra turns for allies or ordinary monster turns", () => {
    let run = {
      ...newRun(),
      combatants: [
        boss(),
        creature("minion", "enemy"),
        creature("Mira"),
        creature("Rook"),
        creature("follower", "ally"),
      ],
    };
    const turns = [];
    for (let i = 0; i < 7; i++) {
      run = advance(run);
      turns.push([run.activeId, run.round, !!run.legendaryTurn]);
    }
    expect(turns).toEqual([
      ["Mira", 1, false],
      ["boss", 1, true],
      ["Rook", 1, false],
      ["boss", 1, true],
      ["follower", 1, false],
      ["minion", 1, false],
      ["Mira", 2, false],
    ]);
  });

  it("classic sorts descending with stable ties, supports zero and negative numbers and leaves unset entries last", () => {
    const list = [
      creature("unset"),
      creature("zero", "hero", 0),
      creature("tieA", "enemy", 12),
      creature("negative", "enemy", -5),
      creature("tieB", "hero", 12),
    ];
    expect(sortInitiative(list).map((c) => c.id)).toEqual([
      "tieA",
      "tieB",
      "zero",
      "negative",
      "unset",
    ]);
  });

  it("classic gives every living combatant including legendary monsters exactly one normal turn each round", () => {
    let run = prepareClassicInitiative(
      {
        ...newRun("classic"),
        combatants: [
          creature("Mira"),
          boss(),
          creature("Rook"),
          creature("guard", "enemy"),
          { ...creature("dead"), hp: 0 },
        ],
      },
      { Mira: 12, boss: 20, Rook: 12, guard: -2 },
    );
    const turns = [];
    for (let i = 0; i < 5; i++) {
      run = advance(run);
      turns.push([run.activeId, run.round, !!run.legendaryTurn]);
    }
    expect(turns).toEqual([
      ["boss", 1, false],
      ["Mira", 1, false],
      ["Rook", 1, false],
      ["guard", 1, false],
      ["boss", 2, false],
    ]);
  });

  it("rejects missing or invalid initiative without changing the run", () => {
    const run = { ...newRun("classic"), combatants: [creature("Mira")] };
    const invalidScores: Record<string, number>[] = [
      {},
      { Mira: NaN },
      { Mira: Infinity },
    ];
    for (const scores of invalidScores) {
      expect(() => prepareClassicInitiative(run, scores)).toThrow(
        "Enter initiative for Mira",
      );
    }
    expect(run.combatants[0].initiative).toBeNull();
  });

  it("changing mode resets timing without losing combatants or HP, and undo restores pending legendary actions", () => {
    let tool = newTool("initiative");
    if (tool.kind !== "initiative") throw Error();
    const before = advance(
      advance({ ...newRun(), combatants: [creature("Mira"), boss()] }),
    );
    tool = { ...tool, run: before };
    const changed = changeRun(tool, setInitiativeMode(before, "classic"));
    expect(changed.run).toMatchObject({
      mode: "classic",
      status: "ready",
      activeId: null,
      round: 1,
    });
    expect(changed.run.legendaryTurn).toBeUndefined();
    expect(changed.run.combatants.find((c) => c.id === "boss")?.hp).toBe(10);
    expect(changed.history[0]).toEqual(before);
    expect(setInitiativeMode(before, "nimble")).toBe(before);
  });

  it("rolling initiative creates a single undo step and keeps linked counter history aligned", () => {
    let campaign = newApp().campaigns[0];
    const tracker = campaign.tools.find((t) => t.kind === "initiative")!;
    if (tracker.kind !== "initiative") throw Error();
    tracker.run = {
      ...newRun("classic"),
      combatants: [creature("Mira"), boss()],
    };
    const counter = newTool("counter");
    if (counter.kind !== "counter") throw Error();
    counter.value = 5;
    counter.link = {
      trackerId: tracker.id,
      event: "turn",
      direction: "increment",
      paused: false,
    };
    campaign.tools.push(counter);
    campaign = advanceCampaign(campaign, tracker.id, (r) =>
      prepareClassicInitiative(r, { Mira: 15, boss: 20 }),
    );
    const started = campaign.tools.find((t) => t.id === tracker.id)!;
    if (started.kind !== "initiative") throw Error();
    expect(started.history).toHaveLength(1);
    expect(started.run.activeId).toBe("boss");
    campaign = advanceCampaign(campaign, tracker.id);
    expect(campaign.tools.find((t) => t.id === counter.id)).toMatchObject({
      value: 6,
    });
    for (let i = 0; i < 2; i++)
      campaign = applyToolUpdate(campaign, tracker.id, (t) =>
        t.kind === "initiative"
          ? { ...t, run: t.history[0], history: t.history.slice(1) }
          : t,
      );
    expect(campaign.tools.find((t) => t.id === counter.id)).toMatchObject({
      value: 5,
    });
    expect(campaign.tools.find((t) => t.id === tracker.id)).toMatchObject({
      run: tracker.run,
    });
  });

  it("migrates old live combats and each undo snapshot without advancing or losing their order", () => {
    const campaign = newApp().campaigns[0];
    const tracker = campaign.tools.find((t) => t.kind === "initiative")!;
    if (tracker.kind !== "initiative") throw Error();
    const withoutMode = (run: Run) => {
      const old: Partial<Run> = { ...run };
      delete old.mode;
      return old;
    };
    const old = {
      ...campaign,
      tools: campaign.tools.map((t) =>
        t.kind === "initiative"
          ? {
              ...tracker,
              run: withoutMode({
                ...newRun(),
                status: "paused",
                activeId: "enemy",
                round: 4,
                combatants: [creature("enemy", "enemy"), creature("Mira")],
              }),
              history: [
                withoutMode({
                  ...newRun(),
                  status: "active",
                  activeId: "boss",
                  combatants: [boss(), creature("Mira")],
                }),
                withoutMode(newRun()),
              ],
            }
          : t,
      ),
    };
    const restored = migrateCampaign(old, 16).tools[0];
    if (restored.kind !== "initiative") throw Error();
    expect(restored.run).toMatchObject({
      mode: "classic",
      status: "paused",
      activeId: "enemy",
      round: 4,
    });
    expect(restored.run.combatants.map((c) => c.id)).toEqual(["enemy", "Mira"]);
    expect(restored.history.map((r) => r.mode)).toEqual(["nimble", "nimble"]);
    expect(
      migrateApp({
        ...newApp(),
        version: 16,
        activeCampaignId: old.id,
        campaigns: [old],
      }).version,
    ).toBe(18);
  });

  it("persists modes in portable campaigns and continues accepting version-16 ZIP manifests", async () => {
    const data = newApp();
    const campaign = data.campaigns[0];
    const tracker = campaign.tools.find((t) => t.kind === "initiative")!;
    if (tracker.kind !== "initiative") throw Error();
    tracker.run = newRun("classic");
    expect(
      copyCampaign(campaign).tools.find((t) => t.kind === "initiative"),
    ).toMatchObject({ run: { mode: "classic" } });
    const zip = await encodeBackup({ campaign, packs: data.packs, assets: [] });
    const files = unzipSync(zip);
    const manifest = JSON.parse(strFromU8(files["manifest.json"]));
    files["manifest.json"] = strToU8(
      JSON.stringify({ ...manifest, schemaVersion: 16 }),
    );
    expect(
      (await decodeBackup(zipSync(files))).campaign.tools.find(
        (t) => t.kind === "initiative",
      ),
    ).toMatchObject({ run: { mode: "classic" } });
  });
});
