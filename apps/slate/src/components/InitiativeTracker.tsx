import {
  canAct,
  changeCombatantHp,
  defeatCombatant,
  reviveCombatant,
  legendaryGroup,
  legendaryState,
  legendaryStateSchema,
  setCombatantHp,
} from "../legendary";
import { Markdown } from "./Markdown";
import { EncounterLibrary } from "./EncounterLibrary";
import { useId, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowDownWideNarrow,
  Flag,
  Cross,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shield,
  Skull,
  Swords,
  Trash2,
  Users,
} from "lucide-react";
import {
  changeRun,
  newRun,
  removeCombatant,
  uid,
  type Combatant,
  type InitiativeTool,
  type Run,
} from "../model";
import { MonsterSearch } from "./MonsterSearch";
import { ReferenceBody, useContent } from "./ContentWorkspace";
import { addMonsterToRun } from "../monsters";
import { Modal } from "./Modal";
import { addPartyToRun, missingPartyCharacters, type Party } from "../party";

export function InitiativeTracker({
  tool,
  update,
  party,
  manageParty,
  onAdvance,
}: {
  party: Party;
  manageParty: () => void;
  onAdvance: () => void;
  tool: InitiativeTool;
  update: (fn: (tool: InitiativeTool) => InitiativeTool) => void;
}) {
  const instanceId = useId();
  const { all, open, rollFormula } = useContent();
  const [tab, setTab] = useState<"combatants" | "monsters">("combatants");
  const [viewing, setViewing] = useState<Combatant | null>(null);
  const [editing, setEditing] = useState<Combatant | "new" | null>(null);
  const [encounters, setEncounters] = useState(false);
  const [hazard, setHazard] = useState<
    NonNullable<Run["hazards"]>[number] | null
  >(null);
  const [confirm, setConfirm] = useState(false);
  const [formError, setFormError] = useState("");
  const [partyError, setPartyError] = useState("");
  const run = tool.run;
  const missingParty = missingPartyCharacters(run, party);
  const active = run.combatants.find((c) => c.id === run.activeId);
  const mutate = (fn: (run: Run) => Run) =>
    update((t) => changeRun(t, fn(t.run)));
  function hp(id: string, delta: number) {
    mutate((r) => ({
      ...r,
      combatants: r.combatants.map((c) =>
        c.id === id ? changeCombatantHp(c, delta) : c,
      ),
    }));
  }
  function move(id: string, offset: number) {
    mutate((r) => {
      const list = [...r.combatants];
      const index = list.findIndex((c) => c.id === id);
      const target = index + offset;
      if (target < 0 || target >= list.length) return r;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...r, combatants: list };
    });
  }
  return (
    <div className="initiative-tool">
      {encounters && (
        <EncounterLibrary
          occupied={!!run.combatants.length || !!run.hazards?.length}
          onClose={() => setEncounters(false)}
          start={(next) => update((t) => changeRun(t, next))}
        />
      )}
      {hazard && (
        <Modal
          title={hazard.record.title + " hazard"}
          onClose={() => setHazard(null)}
          wide
        >
          <ReferenceBody entry={{ ...hazard.record, target: hazard.target }} />
        </Modal>
      )}
      <div className="encounter-heading">
        <div>
          <label className="sr-only" htmlFor={`encounter-${instanceId}`}>
            Encounter name
          </label>
          <input
            id={`encounter-${instanceId}`}
            className="title-input"
            maxLength={100}
            value={run.name}
            onChange={(e) => {
              const name = e.target.value;
              update((t) => ({ ...t, run: { ...t.run, name } }));
            }}
          />
          <p>
            {run.combatants.length} combatants <span className="middot">·</span>{" "}
            {run.status === "ready"
              ? "Ready when you are"
              : run.status === "active"
                ? "In progress"
                : run.status === "paused"
                  ? "Paused"
                  : "Finished"}
          </p>
        </div>
        <div className="round-counter">
          <small>ROUND</small>
          <strong>{String(run.round).padStart(2, "0")}</strong>
        </div>
      </div>
      <div
        className="initiative-tabs"
        role="tablist"
        aria-label="Initiative sections"
      >
        {(["combatants", "monsters"] as const).map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            id={"tab-" + instanceId + "-" + name}
            aria-controls={"panel-" + instanceId + "-" + name}
            aria-selected={tab === name}
            tabIndex={tab === name ? 0 : -1}
            onClick={() => setTab(name)}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? "combatants"
                  : event.key === "End"
                    ? "monsters"
                    : name === "combatants"
                      ? "monsters"
                      : "combatants";
              setTab(next);
              document
                .getElementById("tab-" + instanceId + "-" + next)
                ?.focus();
            }}
          >
            {name === "combatants" ? "Combatants" : "Monsters"}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={"panel-" + instanceId + "-combatants"}
        aria-labelledby={"tab-" + instanceId + "-combatants"}
        hidden={tab !== "combatants"}
      >
        <div className="combat-toolbar">
          <button
            className="secondary"
            onClick={() => {
              setEditing("new");
              setFormError("");
            }}
            disabled={run.combatants.length >= 100}
          >
            <Plus size={15} />
            Add combatant
          </button>
          <button
            className="secondary"
            disabled={!!party.characters.length && !missingParty.length}
            title={
              party.characters.length
                ? `Add ${missingParty.length} missing PCs; existing combatants stay unchanged`
                : "Create the campaign party"
            }
            onClick={() => {
              if (!party.characters.length) {
                manageParty();
                return;
              }
              setPartyError("");
              try {
                // Validate capacity before the store update; never add only part of a party.
                const prepared = addPartyToRun(run, party);
                update((current) => {
                  const next =
                    current.run === run
                      ? prepared
                      : addPartyToRun(current.run, party);
                  return next === current.run
                    ? current
                    : changeRun(current, next);
                });
              } catch (error) {
                setPartyError(
                  error instanceof Error
                    ? error.message
                    : "Unable to add the party.",
                );
              }
            }}
          >
            <Users size={15} />
            {party.characters.length ? "Add party" : "Set up party"}
          </button>
          <button className="secondary" onClick={() => setEncounters(true)}>
            Load encounter
          </button>
          <div className="toolbar-actions">
            <button
              className="icon-button"
              aria-label="Sort by initiative"
              title="Sort highest first; ties keep their order"
              disabled={run.combatants.length < 2}
              onClick={() =>
                mutate((r) => ({
                  ...r,
                  combatants: [...r.combatants].sort(
                    (a, b) =>
                      (b.initiative ?? -Infinity) - (a.initiative ?? -Infinity),
                  ),
                }))
              }
            >
              <ArrowDownWideNarrow size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Undo combat change"
              disabled={!tool.history.length}
              onClick={() =>
                update((t) =>
                  t.history.length
                    ? { ...t, run: t.history[0], history: t.history.slice(1) }
                    : t,
                )
              }
            >
              <RotateCcw size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Reset encounter"
              disabled={!run.combatants.length && !run.hazards?.length}
              onClick={() => setConfirm(true)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {partyError && (
          <p className="inline-error" role="alert">
            {partyError}
          </p>
        )}
        {run.legendaryTurn && (
          <section
            className="legendary-action"
            aria-label="Legendary action"
            aria-live="polite"
          >
            <strong>
              {active?.name ?? "Legendary monster"} acts after{" "}
              {run.combatants.find((c) => c.id === run.legendaryTurn?.afterId)
                ?.name ?? "the hero"}
            </strong>
            <p className="hint">
              Choose an action from the statblock, then complete this action. It
              does not consume an ordinary initiative turn.
            </p>
            <div className="toolbar-actions">
              {run.combatants
                .filter(
                  (c) =>
                    c.legendary &&
                    canAct(c) &&
                    legendaryGroup(c) === run.legendaryTurn!.groups[0],
                )
                .map((c) => (
                  <button
                    key={c.id}
                    className="quiet"
                    disabled={run.status !== "active" || run.activeId === c.id}
                    onClick={() => mutate((r) => ({ ...r, activeId: c.id }))}
                  >
                    Act as {c.name}
                  </button>
                ))}
            </div>
          </section>
        )}
        {run.combatants.length ? (
          <>
            <div className="combat-list-label">
              <span>ORDER / COMBATANT</span>
              <span>HIT POINTS</span>
            </div>
            <ol className="combat-list">
              {run.combatants.map((c, index) => (
                <li
                  key={c.id}
                  className={`combatant ${c.id === run.activeId ? "is-active" : ""} ${!canAct(c) ? "is-defeated" : ""}`}
                >
                  <div
                    className={`initiative-score ${c.side}`}
                    title={`${c.side} · initiative ${c.initiative ?? "not set"}`}
                  >
                    {!canAct(c) ? <Skull size={16} /> : (c.initiative ?? "—")}
                  </div>
                  <div className="combatant-details">
                    <button
                      className="combatant-name"
                      onClick={() => {
                        setEditing(c);
                        setFormError("");
                      }}
                      aria-label={`Edit ${c.name}`}
                    >
                      <span>
                        {c.name}
                        {c.id === run.activeId && <i className="active-dot" />}
                      </span>
                      <small>
                        {!canAct(c)
                          ? c.monster || c.side === "enemy"
                            ? "Dead"
                            : "Defeated"
                          : c.legendary?.phase === "lastStand"
                            ? "Last Stand"
                            : c.legendary?.phase === "bloodied"
                              ? "Bloodied"
                              : c.side}
                        {c.conditions && ` · ${c.conditions}`}
                      </small>
                      {c.notes && (
                        <small className="combat-note">{c.notes}</small>
                      )}
                    </button>
                    {c.legendary && (
                      <details
                        className="legendary-phase"
                        open={
                          c.legendary.phase === "bloodied" ||
                          c.legendary.phase === "lastStand"
                        }
                      >
                        <summary>
                          Legendary ·{" "}
                          {c.legendary.phase === "normal"
                            ? "Healthy"
                            : c.legendary.phase === "lastStand"
                              ? "Last Stand"
                              : c.legendary.phase === "bloodied"
                                ? "Bloodied"
                                : "Defeated"}
                        </summary>
                        <p className="hint">
                          Acts after each hero's turn. Bloodied at{" "}
                          {c.legendary.bloodiedAt} HP.
                        </p>
                        {c.legendary.phase !== "normal" &&
                          c.legendary.phase !== "defeated" && (
                            <Markdown
                              body={
                                c.legendary.bloodiedText ||
                                "Apply the monster's Bloodied abilities."
                              }
                              all={all}
                              open={open}
                              onRoll={rollFormula}
                            />
                          )}
                        {c.legendary.phase === "lastStand" && (
                          <Markdown
                            body={
                              c.legendary.lastStandText ||
                              "Apply the monster's Last Stand abilities."
                            }
                            all={all}
                            open={open}
                            onRoll={rollFormula}
                          />
                        )}
                        {c.legendary.phase === "lastStand" &&
                          c.legendary.lastStandHp === null && (
                            <p className="hint">
                              Review the statblock and set Last Stand HP, or
                              mark defeated after resolving its special effect.
                            </p>
                          )}
                        <button
                          className="quiet"
                          aria-label={
                            "Configure legendary phases for " + c.name
                          }
                          onClick={() => {
                            setEditing(c);
                            setFormError("");
                          }}
                        >
                          Phase settings
                        </button>
                      </details>
                    )}
                    {c.monster && (
                      <button
                        className="reference-link combat-statblock"
                        aria-label={"View statblock for " + c.name}
                        onClick={() => setViewing(c)}
                      >
                        Statblock
                      </button>
                    )}
                  </div>
                  <div className="hp-control">
                    <div>
                      <button
                        className="icon-button"
                        aria-label={`Damage ${c.name}`}
                        disabled={
                          !canAct(c) ||
                          (c.legendary?.phase === "lastStand" &&
                            c.legendary.lastStandHp === null)
                        }
                        onClick={() => hp(c.id, -1)}
                      >
                        −
                      </button>
                      <button
                        className="hp-value"
                        aria-label={`Set HP for ${c.name}`}
                        onClick={() => {
                          setEditing(c);
                          setFormError("");
                        }}
                      >
                        <strong>{c.hp}</strong>
                        <span>/{c.maxHp}</span>
                        {c.legendary?.phase === "lastStand" && (
                          <small className="last-stand-hp">
                            Last Stand {c.legendary.lastStandHp ?? "?"}/
                            {c.legendary.lastStandMaxHp ?? "?"}
                          </small>
                        )}
                      </button>
                      {c.monster || c.side === "enemy" ? (
                        <button
                          className="icon-button"
                          aria-label={
                            canAct(c)
                              ? "Mark " + c.name + " dead"
                              : "Revive " + c.name
                          }
                          title={canAct(c) ? "Mark dead" : "Revive at 1 HP"}
                          onClick={() =>
                            mutate((r) => ({
                              ...r,
                              combatants: r.combatants.map((other) =>
                                other.id === c.id
                                  ? canAct(other)
                                    ? defeatCombatant(other)
                                    : reviveCombatant(other)
                                  : other,
                              ),
                            }))
                          }
                        >
                          {canAct(c) ? (
                            <Skull size={16} />
                          ) : (
                            <Cross size={16} />
                          )}
                        </button>
                      ) : (
                        <button
                          className="icon-button"
                          aria-label={`Heal ${c.name}`}
                          disabled={
                            c.legendary?.phase === "defeated" ||
                            (c.legendary?.phase === "lastStand"
                              ? c.legendary.lastStandHp === null ||
                                c.legendary.lastStandHp ===
                                  c.legendary.lastStandMaxHp
                              : c.hp === c.maxHp)
                          }
                          onClick={() => hp(c.id, 1)}
                        >
                          +
                        </button>
                      )}
                    </div>
                    <div className="hp-track">
                      <span style={{ width: `${(100 * c.hp) / c.maxHp}%` }} />
                    </div>
                  </div>
                  <div className="row-order">
                    <button
                      className="icon-button"
                      aria-label={`Move ${c.name} up`}
                      disabled={index === 0}
                      onClick={() => move(c.id, -1)}
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Move ${c.name} down`}
                      disabled={index === run.combatants.length - 1}
                      onClick={() => move(c.id, 1)}
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div className="combat-empty">
            <div className="empty-emblem">
              <Swords size={32} strokeWidth={1.1} />
            </div>
            <h3>The scene is set.</h3>
            <p>
              Add your heroes and their opposition.
              <br />
              Keep the order. Let the story unfold.
            </p>
            <button
              className="text-button"
              onClick={() => {
                setEditing("new");
                setFormError("");
              }}
            >
              Add your first combatant <span>↗</span>
            </button>
          </div>
        )}
        {!!run.hazards?.length && (
          <section className="combat-hazards">
            <h3>Hazards</h3>
            <p className="hint">
              Hazards keep their own instructions; no creature HP is assumed.
            </p>
            {run.hazards.map((h) => (
              <div className="content-actions" key={h.id}>
                <button className="reference-link" onClick={() => setHazard(h)}>
                  {h.record.title}
                </button>
                <button
                  className="quiet danger"
                  aria-label={`Remove hazard ${h.record.title}`}
                  onClick={() =>
                    mutate((r) => ({
                      ...r,
                      hazards: r.hazards?.filter(
                        (existing) => existing.id !== h.id,
                      ),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </section>
        )}
        <div className="turn-footer">
          <div className="turn-status">
            <Shield size={17} />
            <span>
              {active ? (
                <>
                  <small>
                    {run.legendaryTurn ? "LEGENDARY ACTION" : "CURRENT TURN"}
                  </small>
                  <strong>{active.name}</strong>
                </>
              ) : (
                <>
                  <small>MANUAL ORDER</small>
                  <strong>
                    {run.status === "finished"
                      ? "Encounter complete"
                      : "You set the pace"}
                  </strong>
                </>
              )}
            </span>
          </div>
          <div className="toolbar-actions">
            {(run.status === "active" || run.status === "paused") && (
              <>
                <button
                  className="icon-button"
                  aria-label={
                    run.status === "paused" ? "Resume combat" : "Pause combat"
                  }
                  onClick={() =>
                    mutate((r) => ({
                      ...r,
                      status: r.status === "paused" ? "active" : "paused",
                    }))
                  }
                >
                  {run.status === "paused" ? (
                    <Play size={16} />
                  ) : (
                    <Pause size={16} />
                  )}
                </button>
                <button
                  className="icon-button"
                  aria-label="Finish combat"
                  onClick={() => mutate((r) => ({ ...r, status: "finished" }))}
                >
                  <Flag size={16} />
                </button>
              </>
            )}
            <button
              className="primary"
              disabled={
                !run.combatants.some(canAct) ||
                run.status === "paused" ||
                run.status === "finished"
              }
              onClick={onAdvance}
            >
              {run.status === "ready"
                ? "Begin combat"
                : run.legendaryTurn
                  ? "Complete legendary action"
                  : "Next turn"}
              <Play size={14} />
            </button>
          </div>
        </div>
        <p className="tool-footnote">
          Manual initiative · highest first when sorted · defeated combatants
          are skipped.{" "}
          {run.combatants.some((c) => c.legendary) &&
            "Legendary actions follow each hero; Last Stand stays active at 0 HP."}
        </p>
      </div>
      <div
        role="tabpanel"
        id={"panel-" + instanceId + "-monsters"}
        aria-labelledby={"tab-" + instanceId + "-monsters"}
        hidden={tab !== "monsters"}
      >
        <MonsterSearch
          heroCount={party.characters.length || 4}
          full={run.combatants.length >= 100}
          add={(entry, heroes) => {
            const prepared = addMonsterToRun(run, entry, heroes);
            update((current) =>
              changeRun(
                current,
                current.run === run
                  ? prepared
                  : addMonsterToRun(current.run, entry, heroes),
              ),
            );
          }}
        />
      </div>
      {viewing?.monster && (
        <Modal
          title={viewing.name + " statblock"}
          onClose={() => setViewing(null)}
          wide
        >
          <ReferenceBody
            sections={false}
            entry={{
              ...viewing.monster.record,
              target: viewing.monster.target,
              pack: all.find(
                (entry) => entry.target === viewing.monster?.target,
              )?.pack,
            }}
          />
          <p className="hint">
            Encounter snapshot · later library edits do not change this
            combatant.
          </p>
        </Modal>
      )}
      {editing && (
        <Modal
          title={editing === "new" ? "Add combatant" : `Edit ${editing.name}`}
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const maxHp = Number(data.get("maxHp"));
              const currentHp = Number(data.get("hp"));
              const name = String(data.get("name")).trim();
              if (!name) {
                setFormError("Enter a name.");
                return;
              }
              if (editing !== "new" && currentHp > maxHp) {
                setFormError("Current HP cannot exceed maximum HP.");
                return;
              }
              let combatant: Combatant = {
                ...(editing === "new" ? {} : editing),
                id: editing === "new" ? uid() : editing.id,
                name,
                side: data.get("side") as Combatant["side"],
                initiative:
                  String(data.get("initiative")).trim() === ""
                    ? null
                    : Number(data.get("initiative")),
                maxHp,
                hp: editing === "new" ? maxHp : currentHp,
                conditions: String(data.get("conditions") ?? ""),
                notes: String(data.get("notes") ?? ""),
              };
              try {
                if (data.get("legendary")) {
                  if (combatant.side !== "enemy")
                    throw new Error(
                      "Legendary timing is for enemy monsters. Set Side to Enemy.",
                    );
                  const initial =
                    editing !== "new" && editing.legendary
                      ? editing.legendary
                      : legendaryState(
                          editing !== "new"
                            ? editing.monster?.record
                            : undefined,
                          maxHp,
                        );
                  const poolText = String(
                    data.get("lastStandMaxHp") ?? "",
                  ).trim();
                  const remainingText = String(
                    data.get("lastStandHp") ?? "",
                  ).trim();
                  const state = legendaryStateSchema.parse({
                    ...initial,
                    phase: String(data.get("legendaryPhase")),
                    bloodiedAt: String(data.get("bloodiedAt")).trim()
                      ? Number(data.get("bloodiedAt"))
                      : initial.bloodiedAt,
                    lastStandMaxHp: poolText ? Number(poolText) : null,
                    lastStandHp: remainingText ? Number(remainingText) : null,
                  });
                  if (state.phase === "lastStand" && state.lastStandHp === 0)
                    state.phase = "defeated";
                  combatant = { ...combatant, legendary: state };
                  if (state.phase === "lastStand" || state.phase === "defeated")
                    combatant.hp = 0;
                  else combatant = setCombatantHp(combatant, combatant.hp);
                } else combatant.legendary = undefined;
              } catch (cause) {
                setFormError(
                  cause instanceof Error
                    ? cause.message
                    : "Check legendary phase settings.",
                );
                return;
              }
              mutate((r) => ({
                ...r,
                combatants:
                  editing === "new"
                    ? [...r.combatants, combatant]
                    : r.combatants.map((c) =>
                        c.id === combatant.id ? combatant : c,
                      ),
              }));
              setEditing(null);
            }}
          >
            <label>
              Name
              <input
                name="name"
                autoFocus
                required
                maxLength={80}
                defaultValue={editing === "new" ? "" : editing.name}
                placeholder="Hero, creature, or ally"
              />
            </label>
            <div className="form-grid">
              <label>
                Side
                <select
                  name="side"
                  defaultValue={editing === "new" ? "hero" : editing.side}
                >
                  <option value="hero">Hero</option>
                  <option value="enemy">Enemy</option>
                  <option value="ally">Ally</option>
                </select>
              </label>
              <label>
                Initiative
                <input
                  name="initiative"
                  type="number"
                  step="any"
                  defaultValue={
                    editing === "new" ? "" : (editing.initiative ?? "")
                  }
                  placeholder="Optional"
                />
              </label>
              <label>
                Maximum HP
                <input
                  name="maxHp"
                  type="number"
                  required
                  min={1}
                  max={99999}
                  defaultValue={editing === "new" ? 20 : editing.maxHp}
                />
              </label>
              {editing !== "new" && (
                <label>
                  Current HP
                  <input
                    name="hp"
                    type="number"
                    required
                    min={0}
                    max={99999}
                    defaultValue={editing.hp}
                  />
                </label>
              )}
            </div>
            <details
              className="legendary-options"
              open={editing !== "new" && !!editing.legendary}
            >
              <summary>Legendary monster settings</summary>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="legendary"
                  defaultChecked={editing !== "new" && !!editing.legendary}
                />
                Legendary monster
              </label>
              <div className="form-grid">
                <label>
                  Phase
                  <select
                    name="legendaryPhase"
                    defaultValue={
                      editing === "new"
                        ? "normal"
                        : (editing.legendary?.phase ?? "normal")
                    }
                  >
                    <option value="normal">Healthy</option>
                    <option value="bloodied">Bloodied</option>
                    <option value="lastStand">Last Stand</option>
                    <option value="defeated">Defeated</option>
                  </select>
                </label>
                <label>
                  Bloodied at HP
                  <input
                    name="bloodiedAt"
                    type="number"
                    min={0}
                    max={99999}
                    step={1}
                    placeholder="Half maximum HP"
                    defaultValue={
                      editing === "new"
                        ? ""
                        : (editing.legendary?.bloodiedAt ??
                          Math.floor(editing.maxHp / 2))
                    }
                  />
                </label>
                <label>
                  Last Stand maximum HP
                  <input
                    name="lastStandMaxHp"
                    type="number"
                    min={1}
                    max={99999}
                    step={1}
                    defaultValue={
                      editing === "new"
                        ? ""
                        : (editing.legendary?.lastStandMaxHp ?? "")
                    }
                  />
                </label>
                <label>
                  Last Stand remaining HP
                  <input
                    name="lastStandHp"
                    type="number"
                    min={0}
                    max={99999}
                    step={1}
                    defaultValue={
                      editing === "new"
                        ? ""
                        : (editing.legendary?.lastStandHp ?? "")
                    }
                  />
                </label>
              </div>
              <p className="hint">
                Last Stand begins at 0 HP and has its own damage pool. Leave the
                pool blank for unusual effects; mark Defeated manually when
                resolved. Phase abilities and special triggers remain GM
                decisions.
              </p>
            </details>
            <label>
              Conditions
              <input
                name="conditions"
                maxLength={240}
                defaultValue={editing === "new" ? "" : editing.conditions}
                placeholder="e.g. Slowed, frightened"
              />
            </label>
            <label>
              Notes
              <textarea
                name="notes"
                maxLength={500}
                defaultValue={editing === "new" ? "" : editing.notes}
                placeholder="A reminder for their turn…"
              />
            </label>
            {formError && (
              <p className="inline-error" role="alert">
                {formError}
              </p>
            )}
            <div className="modal-actions">
              {editing !== "new" && (
                <button
                  className="danger text-button"
                  type="button"
                  onClick={() => {
                    mutate((r) => removeCombatant(r, editing.id));
                    setEditing(null);
                  }}
                >
                  Remove combatant
                </button>
              )}
              <button className="primary" type="submit">
                {editing === "new" ? "Add combatant" : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {confirm && (
        <Modal title="Reset this encounter?" onClose={() => setConfirm(false)}>
          <p>
            This removes the current combatants and returns to round one. You
            can undo this change.
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setConfirm(false)}>
              Keep encounter
            </button>
            <button
              className="primary"
              onClick={() => {
                update((t) => changeRun(t, newRun()));
                setConfirm(false);
              }}
            >
              Reset encounter
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
