import { EncounterDifficulty } from "./EncounterDifficulty";
import { useState } from "react";
import { Modal } from "./Modal";
import { useContent } from "./ContentWorkspace";
import { searchContent, type Entry } from "../content";
import { encounterFieldsSchema } from "../encounter-schema";
import { encounterSummary, startEncounter } from "../encounters";
import { duplicateEncounter } from "../encounter-builder";
import { EncounterEditor } from "./EncounterEditor";
import { recordSchema, type ContentRecord } from "../content-schema";
import { type Run } from "../model";
import { Markdown } from "./Markdown";
import { ExchangeDialog } from "./ExchangeDialog";

export function EncounterLibrary({
  onClose,
  start,
  occupied = false,
}: {
  onClose: () => void;
  start?: (run: Run) => void;
  occupied?: boolean;
}) {
  const { all, campaign, open, rollFormula, update } = useContent();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Entry | null>(null);
  const [heroes, setHeroes] = useState(campaign.party.characters.length || 4);
  const [includeParty, setIncludeParty] = useState(true);
  const [error, setError] = useState("");
  const [exchange, setExchange] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [editor, setEditor] = useState<ContentRecord | "new" | null>(null);
  const entry = selected
    ? all.find((e) => e.target === selected.target)
    : undefined;
  const summary =
    entry && Number.isInteger(heroes) && heroes >= 1 && heroes <= 100
      ? encounterSummary(
          entry,
          all,
          heroes,
          start && includeParty ? campaign.party : undefined,
        )
      : null;
  const rows = summary?.rows ?? [];
  const load = () => {
    try {
      if (!entry || !start) return;
      const run = startEncounter(
        entry,
        all,
        heroes,
        includeParty ? campaign.party : undefined,
      );
      start(run);
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to start encounter.",
      );
    }
  };
  return (
    <Modal
      title={start ? "Load encounter" : "Encounter library"}
      onClose={onClose}
      wide
    >
      <div className="content-actions">
        <button className="primary" onClick={() => setEditor("new")}>
          New encounter
        </button>
        <button className="secondary" onClick={() => setExchange(true)}>
          Import / export encounters
        </button>
      </div>
      <label>
        Search encounters
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <ul className="monster-results" aria-label="Saved encounters">
        {searchContent(all, query, "encounter").map((e) => (
          <li key={e.target}>
            <button
              className="monster-result-title"
              onClick={() => {
                setSelected(e);
                setHeroes(encounterFieldsSchema.parse(e.fields).heroCount);
                setConfirming(false);
                setError("");
              }}
            >
              <strong>{e.title}</strong>
              <small>
                {encounterFieldsSchema.parse(e.fields).entries.length} entries
              </small>
            </button>
          </li>
        ))}
      </ul>
      {!all.some((e) => e.kind === "encounter") && (
        <p className="hint">
          Create an encounter or import one from Nexus to begin.
        </p>
      )}
      {entry && (
        <section className="notice encounter-preview">
          <h3>{entry.title}</h3>
          <div className="content-actions">
            <button
              className="secondary"
              onClick={() =>
                setEditor(
                  entry.pack
                    ? duplicateEncounter(entry)
                    : recordSchema.parse(entry),
                )
              }
            >
              {entry.pack ? "Edit campaign copy" : "Edit encounter"}
            </button>
            <button
              className="secondary"
              onClick={() => {
                const copy = duplicateEncounter(entry);
                update((c) => ({ ...c, content: [...c.content, copy] }));
                setSelected({ ...copy, target: `local::${copy.id}` });
                setConfirming(false);
                setError("");
              }}
            >
              Duplicate encounter
            </button>
          </div>
          <Markdown
            onRoll={rollFormula}
            body={entry.body}
            all={all}
            open={open}
          />
          <p className="hint">
            Planned for {encounterFieldsSchema.parse(entry.fields).heroCount}{" "}
            heroes at level{" "}
            {encounterFieldsSchema.parse(entry.fields).heroLevel}.
          </p>
          <label>
            Party size
            <input
              type="number"
              min={1}
              max={100}
              value={Number.isFinite(heroes) ? heroes : ""}
              onChange={(e) => {
                setHeroes(Number(e.target.value));
                setConfirming(false);
              }}
            />
          </label>
          {start && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeParty}
                onChange={(e) => {
                  setIncludeParty(e.target.checked);
                  setConfirming(false);
                }}
              />
              Include campaign party PCs
            </label>
          )}
          <ul aria-label="Resolved encounter entries">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  className="reference-link"
                  onClick={() => open(row.target)}
                >
                  {row.monster?.title ?? row.name}
                </button>{" "}
                · {row.count}
                {row.stats?.hazard
                  ? " hazards"
                  : row.stats?.members
                    ? " teams"
                    : " creatures"}
                {row.isPerHero
                  ? ` (${row.quantity} per ${row.heroesPerMonster} heroes)`
                  : ""}
                {row.rawCount !== row.count
                  ? ` · rounded up from ${row.rawCount}`
                  : ""}
                {row.stats?.hpPerHero
                  ? ` · ${row.stats.hpPerHero * heroes} HP each`
                  : ""}
                {row.missing ? " · Missing full statblock or family" : ""}
              </li>
            ))}
          </ul>
          {!!encounterFieldsSchema.parse(entry.fields).missing.length && (
            <p className="hint">
              External dependencies:{" "}
              {encounterFieldsSchema.parse(entry.fields).missing.join(", ")}
            </p>
          )}
          {encounterFieldsSchema.parse(entry.fields).annotations && (
            <p>{encounterFieldsSchema.parse(entry.fields).annotations}</p>
          )}
          <p className="hint">
            Starting creates fresh combat snapshots. The saved encounter is
            retained; initiative remains manual.
          </p>
          {summary && (
            <EncounterDifficulty
              entry={entry}
              all={all}
              heroes={heroes}
              heroLevel={
                start &&
                includeParty &&
                campaign.party.characters.length === heroes
                  ? campaign.party.characters.reduce(
                      (sum, pc) => sum + pc.level,
                      0,
                    ) / heroes
                  : undefined
              }
            />
          )}
          {summary && (
            <section aria-label="Encounter readiness">
              <p>
                {summary.combatants} combatants · {summary.hazards} hazards
                {start && includeParty ? " · including campaign party PCs" : ""}
              </p>
              {!!summary.blockers.length && (
                <ul className="notice error">
                  {summary.blockers.map((message, i) => (
                    <li key={i}>{message}</li>
                  ))}
                </ul>
              )}
            </section>
          )}
          {start && (
            <button
              className="primary"
              disabled={
                !rows.length ||
                !!summary?.blockers.length ||
                heroes < 1 ||
                heroes > 100
              }
              onClick={() => (occupied ? setConfirming(true) : load())}
            >
              Start encounter
            </button>
          )}
          {confirming && (
            <div className="notice">
              <p>
                Replace the tracker’s current combat? You can restore it with
                Undo combat change.
              </p>
              <button className="secondary" onClick={load}>
                Replace current combat
              </button>
              <button className="quiet" onClick={() => setConfirming(false)}>
                Keep current combat
              </button>
            </div>
          )}
        </section>
      )}
      {editor && (
        <Modal
          title={editor === "new" ? "New encounter" : "Edit encounter"}
          onClose={() => setEditor(null)}
          wide
        >
          <EncounterEditor
            initial={editor === "new" ? undefined : editor}
            cancel={() => setEditor(null)}
            save={(record) => {
              update((c) => ({
                ...c,
                content: c.content.some((r) => r.id === record.id)
                  ? c.content.map((r) => (r.id === record.id ? record : r))
                  : [...c.content, record],
              }));
              setSelected({ ...record, target: `local::${record.id}` });
              setHeroes(encounterFieldsSchema.parse(record.fields).heroCount);
              setQuery("");
              setEditor(null);
              setConfirming(false);
              setError("");
            }}
            remove={
              editor !== "new" &&
              campaign.content.some((r) => r.id === editor.id)
                ? () => {
                    update((c) => ({
                      ...c,
                      content: c.content.filter((r) => r.id !== editor.id),
                    }));
                    setEditor(null);
                    setSelected(null);
                    setConfirming(false);
                  }
                : undefined
            }
          />
        </Modal>
      )}
      {error && <p role="alert">{error}</p>}
      {exchange && <ExchangeDialog onClose={() => setExchange(false)} />}
    </Modal>
  );
}
