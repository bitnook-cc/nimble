import { describe, expect, it } from "vitest";
import {
  advance,
  appSchema,
  canPlace,
  changeRun,
  findSpace,
  newApp,
  newRun,
  newTool,
  removeCombatant,
  type Combatant,
} from "./model";

const creature = (id: string, hp = 10): Combatant => ({
  id,
  name: id,
  hp,
  maxHp: 10,
  initiative: null,
  side: "hero",
  conditions: "",
  notes: "",
});
describe("cell grid", () => {
  it("creates a single campaign with non-overlapping spans", () => {
    const app = newApp();
    expect(appSchema.parse(app).campaigns).toHaveLength(1);
    expect(app.campaigns[0].screens[0].widgets.map((w) => w.w)).toEqual([6, 4]);
  });
  it("rejects overlap, fractional placement and out-of-bounds spans", () => {
    const c = newApp().campaigns[0].screens[0];
    expect(canPlace(c, { x: 7, y: 1, w: 3, h: 4 })).toBe(false);
    expect(canPlace(c, { x: 0, y: 7, w: 4, h: 4 })).toBe(false);
    expect(canPlace(c, { x: 0.5, y: 6, w: 1, h: 1 })).toBe(false);
    expect(canPlace(c, { x: 0, y: 0, w: 5, h: 5 }, c.widgets[0].id)).toBe(true);
  });
  it("finds available cells without moving other widgets", () => {
    const c = newApp().campaigns[0].screens[0];
    expect(findSpace(c, { w: 3, h: 2 })).toEqual({ x: 0, y: 5, w: 3, h: 2 });
    expect(findSpace(c, { w: 3, h: 4 })).toBeNull();
  });
  it("keeps tool state after removing its placement", () => {
    const app = newApp();
    app.campaigns[0].screens[0].widgets = [];
    expect(appSchema.parse(app).campaigns[0].tools).toHaveLength(2);
  });
  it("rejects corrupt references and overlapping persisted widgets", () => {
    const app = newApp();
    app.campaigns[0].screens[0].widgets[1].x = 0;
    expect(appSchema.safeParse(app).success).toBe(false);
    app.campaigns[0].screens[0].widgets[1].x = 8;
    app.campaigns[0].screens[0].widgets[1].toolId = "missing";
    expect(appSchema.safeParse(app).success).toBe(false);
  });
});
describe("manual initiative", () => {
  it("starts at the first living combatant and advances round on wrap only", () => {
    let run = {
      ...newRun(),
      combatants: [creature("fallen", 0), creature("a"), creature("b")],
    };
    run = advance(run);
    expect(run.activeId).toBe("a");
    expect(run.round).toBe(1);
    run = advance(run);
    expect(run.activeId).toBe("b");
    expect(run.round).toBe(1);
    run = advance(run);
    expect(run.activeId).toBe("a");
    expect(run.round).toBe(2);
  });
  it("does not advance paused or finished combat", () => {
    const run = { ...newRun(), combatants: [creature("a")] };
    expect(advance({ ...run, status: "paused" }).round).toBe(1);
    expect(advance({ ...run, status: "finished" }).activeId).toBeNull();
  });
  it("moves past a defeated current combatant without resetting the round", () => {
    const run = {
      ...newRun(),
      status: "active" as const,
      activeId: "a",
      combatants: [creature("a", 0), creature("b")],
    };
    expect(advance(run).activeId).toBe("b");
    expect(advance(run).round).toBe(1);
  });
  it("removes the last active combatant and wraps to the next round", () => {
    const run = {
      ...newRun(),
      status: "active" as const,
      activeId: "b",
      combatants: [creature("a"), creature("b")],
    };
    const next = removeCombatant(run, "b");
    expect(next.activeId).toBe("a");
    expect(next.round).toBe(2);
    expect(removeCombatant(next, "a").activeId).toBeNull();
  });
  it("preserves undo snapshots independently of later changes", () => {
    const tool = newTool("initiative");
    if (tool.kind !== "initiative") throw new Error("Wrong tool");
    const next = changeRun(tool, { ...tool.run, combatants: [creature("a")] });
    expect(next.history[0].combatants).toHaveLength(0);
    expect(next.run.combatants).toHaveLength(1);
  });
});
