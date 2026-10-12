"use client";

import { campaigns } from "@nimble/shared";
import { createDefaultByKind, createDefaultMonster } from "@nimble/shared/monsters/defaults";
import { anyMonsterSchema } from "@nimble/shared/monsters/schemas";
import { AnyMonster } from "@nimble/shared/monsters/types";
import { GuidedBuilder } from "@nimble/ui/guided-builder";
import { LegendaryGuidedBuilder } from "@nimble/ui/legendary-guided-builder";
import { MonsterForm } from "@nimble/ui/monster-form";

import { useState } from "react";

import { Button } from "../ui/button";
import { CampaignProps, Field, Panel, formValues, inputClass, number, string, uid } from "./shared";

const blankMonster = (): AnyMonster => createDefaultMonster({ name: "New enemy" });
const blankEncounter = (): campaigns.Encounter => ({
  id: uid(),
  name: "",
  objective: "",
  environment: "",
  rewards: "",
  gmNotes: "",
  monsters: [],
});

export function Encounters({ view, command, busy }: CampaignProps) {
  const [monster, setMonster] = useState<AnyMonster | null>(null);
  const [plan, setPlan] = useState<campaigns.Encounter | null>(null);
  const [guided, setGuided] = useState(true);
  const [error, setError] = useState("");
  const active = view.state.runs.find((r) => r.status === "active");
  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-md border border-destructive p-3 text-sm">
          {error}
        </p>
      )}
      {active ? (
        <Panel title={`${active.name} · Round ${active.round}`}>
          <p className="whitespace-pre-wrap text-sm">{active.objective}</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{active.environment}</p>
          {view.isGM && (
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy}
                onClick={() => void command({ type: "round", runId: active.id })}
              >
                Next round
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  if (window.confirm("Finish this encounter and save it to history?"))
                    void command({ type: "finish", runId: active.id });
                }}
              >
                Finish encounter
              </Button>
              <p className="w-full text-xs text-muted-foreground">
                Actions used reset each round. Enemy HP, conditions, and phases are saved
                independently from your encounter plan.
              </p>
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {active.combatants.map((c) => (
              <Combatant
                key={c.id}
                c={c}
                runId={active.id}
                isGM={view.isGM}
                command={command}
                busy={busy}
              />
            ))}
          </div>
          {!active.combatants.length && (
            <p className="text-sm text-muted-foreground">
              Your GM has not revealed any enemies yet.
            </p>
          )}
        </Panel>
      ) : (
        <Panel title="Encounter table">
          <p className="text-sm text-muted-foreground">
            {view.isGM
              ? "Build an encounter below, then start it when the party is ready. Enemies remain hidden until you reveal them."
              : "Your GM will start and reveal encounters here."}
          </p>
        </Panel>
      )}
      {view.isGM && (
        <>
          <Panel title="Encounter plans">
            <Button onClick={() => setPlan(blankEncounter())}>New encounter</Button>
            <div className="grid gap-4 md:grid-cols-2">
              {view.state.encounters.map((e) => (
                <div key={e.id} className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold">{e.name}</h3>
                  <p className="text-sm">
                    {e.monsters.reduce((n, m) => n + m.count, 0)} enemies ·{" "}
                    {e.monsters
                      .map(
                        (m) =>
                          `${m.count} × ${view.state.monsters.find((t) => t.id === m.monsterId)?.name || "Missing monster"} (wave ${m.wave})`,
                      )
                      .join(", ")}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{e.objective}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setPlan(structuredClone(e))}>
                      Edit plan
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(`Delete ${e.name}?`))
                          void command({ type: "delete", collection: "encounters", id: e.id });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={async (event) => {
                      const d = formValues(event);
                      await command({
                        type: "start",
                        encounterId: e.id,
                        sessionId: string(d, "session") || null,
                      });
                    }}
                  >
                    <select
                      className={inputClass}
                      aria-label={`Session for ${e.name}`}
                      name="session"
                    >
                      <option value="">Standalone encounter</option>
                      {view.state.sessions
                        .filter((s) => s.status !== "completed")
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                    </select>
                    <Button disabled={busy || !!active || !e.monsters.length}>Start</Button>
                  </form>
                </div>
              ))}
            </div>
          </Panel>
          {plan && (
            <Panel title="Encounter builder">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await command({ type: "encounter", entry: plan })) setPlan(null);
                }}
              >
                <Field label="Encounter name">
                  <input
                    className={inputClass}
                    value={plan.name}
                    maxLength={120}
                    required
                    onChange={(e) => setPlan({ ...plan, name: e.target.value })}
                  />
                </Field>
                {(["objective", "environment", "rewards", "gmNotes"] as const).map((key) => (
                  <Field
                    key={key}
                    label={
                      {
                        objective: "Objective (shown when started)",
                        environment: "Environment (shown when started)",
                        rewards: "Planned rewards (GM only)",
                        gmNotes: "Private GM notes",
                      }[key]
                    }
                  >
                    <textarea
                      className={inputClass}
                      value={plan[key]}
                      maxLength={10000}
                      onChange={(e) => setPlan({ ...plan, [key]: e.target.value })}
                    />
                  </Field>
                ))}
                <p className="text-sm text-muted-foreground">
                  Enemy counts and levels are shown for planning. This builder does not estimate
                  encounter difficulty.
                </p>
                {plan.monsters.map((m, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[1fr_90px_90px_auto]">
                    <Field label="Monster">
                      <select
                        required
                        className={inputClass}
                        value={m.monsterId}
                        onChange={(e) =>
                          setPlan({
                            ...plan,
                            monsters: plan.monsters.map((v, n) =>
                              n === i ? { ...v, monsterId: e.target.value } : v,
                            ),
                          })
                        }
                      >
                        {view.state.monsters.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} · level {t.level}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Count">
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        max="30"
                        value={m.count}
                        onChange={(e) =>
                          setPlan({
                            ...plan,
                            monsters: plan.monsters.map((v, n) =>
                              n === i ? { ...v, count: Number(e.target.value) } : v,
                            ),
                          })
                        }
                      />
                    </Field>
                    <Field label="Wave">
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        max="20"
                        value={m.wave}
                        onChange={(e) =>
                          setPlan({
                            ...plan,
                            monsters: plan.monsters.map((v, n) =>
                              n === i ? { ...v, wave: Number(e.target.value) } : v,
                            ),
                          })
                        }
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setPlan({ ...plan, monsters: plan.monsters.filter((_, n) => n !== i) })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!view.state.monsters.length || plan.monsters.length >= 30}
                    onClick={() =>
                      setPlan({
                        ...plan,
                        monsters: [
                          ...plan.monsters,
                          { monsterId: view.state.monsters[0].id, count: 1, wave: 1 },
                        ],
                      })
                    }
                  >
                    Add enemy group
                  </Button>
                  <Button disabled={busy}>Save encounter</Button>
                  <Button type="button" variant="ghost" onClick={() => setPlan(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Panel>
          )}
          <Panel title="Campaign monster library">
            <p className="text-sm text-muted-foreground">
              Shared among this campaign&apos;s GMs. This is the same monster editor used in Portal;
              you can also import a Campaign JSON export from Portal.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setMonster(blankMonster())}>Create monster</Button>
              <Field label="Import Campaign JSON">
                <input
                  type="file"
                  accept=".json,application/json"
                  className="text-sm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      if (file.size > 256000)
                        throw new Error("Choose a monster file smaller than 256 KB.");
                      const data = JSON.parse(await file.text());
                      const result = anyMonsterSchema.safeParse(data.monster || data);
                      if (!result.success)
                        throw new Error("This file is not a valid Portal monster export.");
                      setMonster({ ...result.data, id: uid() });
                      setError("");
                    } catch (error) {
                      setError((error as Error).message);
                    }
                    e.target.value = "";
                  }}
                />
              </Field>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {view.state.monsters.map((m) => (
                <div className="rounded-lg border p-3 space-y-2" key={m.id}>
                  <h3 className="font-semibold">{m.name}</h3>
                  <p className="text-sm">
                    Level {m.level} · {m.kind} · {m.hitPoints} HP
                  </p>
                  <Button variant="outline" onClick={() => setMonster(structuredClone(m))}>
                    Edit monster
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`Delete ${m.name}?`))
                        void command({ type: "delete", collection: "monsters", id: m.id });
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </Panel>
          {monster && (
            <Panel title="Monster editor">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setGuided(!guided)}>
                  {guided ? "Use detailed form" : "Use guided builder"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setMonster({
                      ...createDefaultByKind(
                        monster.kind === "standard" ? "legendary" : "standard",
                      ),
                      id: monster.id,
                      name: monster.name,
                      type: monster.type,
                      notes: monster.notes,
                      passives: monster.passives,
                      actions: monster.actions,
                      timestamps: monster.timestamps,
                    })
                  }
                >
                  {monster.kind === "standard" ? "Make legendary" : "Make standard"}
                </Button>
              </div>
              {guided ? (
                monster.kind === "legendary" ? (
                  <LegendaryGuidedBuilder
                    key={monster.id}
                    monster={monster}
                    onChange={setMonster}
                  />
                ) : (
                  <GuidedBuilder key={monster.id} monster={monster} onChange={setMonster} />
                )
              ) : (
                <MonsterForm monster={monster} onChange={setMonster} />
              )}
              <div className="flex gap-2">
                <Button
                  disabled={busy}
                  onClick={async () => {
                    const result = anyMonsterSchema.safeParse({
                      ...monster,
                      timestamps: { ...monster.timestamps, updatedAt: new Date().toISOString() },
                    });
                    if (!result.success) {
                      setError(
                        result.error.issues
                          .map((i) => `${i.path.join(" ")}: ${i.message}`)
                          .join("; "),
                      );
                      return;
                    }
                    if (await command({ type: "monster", entry: result.data })) {
                      setMonster(null);
                      setError("");
                    }
                  }}
                >
                  Save monster
                </Button>
                <Button variant="outline" onClick={() => setMonster(null)}>
                  Cancel
                </Button>
              </div>
            </Panel>
          )}
        </>
      )}
      {!!view.state.runs.filter((r) => r.status === "completed").length && (
        <Panel title="Encounter history">
          {view.state.runs
            .filter((r) => r.status === "completed")
            .slice()
            .reverse()
            .map((r) => (
              <details key={r.id} className="border-b pb-3">
                <summary className="cursor-pointer font-medium">
                  {r.name} · {r.round} rounds
                </summary>
                <p className="text-sm mt-2">
                  {r.combatants
                    .map((c) => `${c.name}: ${c.hp} HP${c.conditions ? ` (${c.conditions})` : ""}`)
                    .join(" · ")}
                </p>
              </details>
            ))}
        </Panel>
      )}
    </div>
  );
}
function Combatant({
  c,
  runId,
  isGM,
  command,
  busy,
}: {
  c: Omit<campaigns.Combatant, "monster"> & { monster?: campaigns.Combatant["monster"] };
  runId: string;
  isGM: boolean;
  command: CampaignProps["command"];
  busy: boolean;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="font-semibold">
        {c.name} {isGM && !c.revealed ? "· Hidden" : ""}
      </h3>
      <p className="text-sm">
        Wave {c.wave} · {c.monster?.kind} · {c.hp} HP ·{" "}
        {c.phase === "normal" ? "Normal" : c.phase === "bloodied" ? "Bloodied" : "Last stand"}
      </p>
      <p className="text-sm">
        {c.conditions || "No conditions"} · {c.actions} actions used
      </p>
      {isGM && (
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (e) => {
            const d = formValues(e);
            await command({
              type: "combatant",
              runId,
              combatantId: c.id,
              hp: number(d, "hp"),
              actions: number(d, "actions"),
              conditions: string(d, "conditions"),
              revealed: d.has("revealed"),
              phase: string(d, "phase") as campaigns.Combatant["phase"],
            });
          }}
        >
          <Field label="HP">
            <input
              className={inputClass}
              name="hp"
              type="number"
              min="0"
              max="100000"
              defaultValue={c.hp}
              required
            />
          </Field>
          <Field label="Actions used">
            <input
              className={inputClass}
              name="actions"
              type="number"
              min="0"
              max="20"
              defaultValue={c.actions}
              required
            />
          </Field>
          <Field label="Conditions">
            <input
              className={inputClass}
              name="conditions"
              maxLength={500}
              defaultValue={c.conditions}
            />
          </Field>
          <Field label="Phase">
            <select className={inputClass} name="phase" defaultValue={c.phase}>
              <option value="normal">Normal</option>
              {c.monster?.kind === "legendary" && (
                <>
                  <option value="bloodied">Bloodied</option>
                  <option value="lastStand">Last stand</option>
                </>
              )}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="revealed" defaultChecked={c.revealed} />
            Visible to party
          </label>
          <Button disabled={busy}>Update enemy</Button>
        </form>
      )}
      {isGM && c.monster && (
        <details>
          <summary className="cursor-pointer text-sm font-medium">Stat block</summary>
          <div className="mt-2 space-y-2 text-sm">
            <p>
              Armor {c.monster.armor} · Speed {c.monster.speed} · Max HP {c.monster.hitPoints}
            </p>
            {[...c.monster.passives, ...c.monster.actions].map((a, i) => (
              <p key={i}>
                <strong>{a.name}.</strong> {a.description}
                {"diceFormula" in a && a.diceFormula ? ` (${a.diceFormula})` : ""}
              </p>
            ))}
            {c.monster?.kind === "legendary" && (
              <>
                <p>
                  <strong>Bloodied:</strong> {c.monster.bloodied?.description}
                </p>
                <p>
                  <strong>Last stand ({c.monster.lastStandHp || "—"} HP):</strong>{" "}
                  {c.monster.lastStand?.description}
                </p>
                {[
                  ...(c.phase === "bloodied"
                    ? c.monster.bloodied?.actions || []
                    : c.phase === "lastStand"
                      ? c.monster.lastStand?.actions || []
                      : []),
                ].map((a, i) => (
                  <p key={i}>
                    <strong>{a.name}.</strong> {a.description}
                  </p>
                ))}
              </>
            )}
            <p className="whitespace-pre-wrap">{c.monster.notes}</p>
          </div>
        </details>
      )}
    </div>
  );
}
