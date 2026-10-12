import { EncounterDifficulty } from "./EncounterDifficulty";
import { useState } from "react";
import { searchContent, type Entry } from "../content";
import { encounterFieldsSchema } from "../encounter-schema";
import { type ContentRecord } from "../content-schema";
import { monsterStatsSchema } from "../monster-schema";
import { saveEncounterDefinition } from "../encounter-builder";
import { encounterSummary } from "../encounters";
import { uid } from "../model";
import { useContent } from "./ContentWorkspace";

export function EncounterEditor({
  initial,
  save,
  cancel,
  remove,
}: {
  initial?: ContentRecord;
  save: (record: ContentRecord) => void;
  cancel: () => void;
  remove?: () => void;
}) {
  const { all, campaign, open } = useContent();
  const original = encounterFieldsSchema.parse(
    initial?.fields ?? {
      entries: [],
      heroCount: campaign.party.characters.length || 4,
      heroLevel: campaign.party.characters.length
        ? campaign.party.characters.reduce((sum, pc) => sum + pc.level, 0) /
          campaign.party.characters.length
        : 1,
    },
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [heroes, setHeroes] = useState(String(original.heroCount));
  const [level, setLevel] = useState(String(original.heroLevel));
  const [annotations, setAnnotations] = useState(original.annotations);
  const [links, setLinks] = useState(() =>
    original.entries.map((r) => ({
      ...r,
      quantity: String(r.quantity),
      heroesPerMonster: String(r.heroesPerMonster),
    })),
  );
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [limit, setLimit] = useState(20);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const parsed = encounterFieldsSchema.safeParse({
    ...original,
    heroCount: Number(heroes),
    heroLevel: Number(level),
    annotations,
    entries: links.map((r) => ({
      ...r,
      quantity: Number(r.quantity),
      heroesPerMonster: Number(r.heroesPerMonster),
    })),
  });
  const draft: Entry = {
    ...(initial ?? {
      id: "draft",
      tags: [],
      category: "",
      sources: [],
      related: [],
    }),
    kind: "encounter",
    title,
    body,
    fields: parsed.success ? parsed.data : {},
    target: "local::draft",
  };
  const summary = parsed.success
    ? encounterSummary(draft, all, parsed.data.heroCount)
    : null;
  const matches = searchContent(all, query, "monster").filter((r) => {
    const stats = monsterStatsSchema.parse(r.fields);
    return (
      kind === "all" ||
      (kind === "hazard"
        ? stats.hazard
        : kind === "team"
          ? stats.members
          : !stats.hazard && !stats.members)
    );
  });
  return (
    <form
      className="encounter-builder"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        try {
          if (!title.trim()) throw new Error("Give the encounter a name.");
          if (!parsed.success)
            throw new Error(
              "Choose a whole party size from 1 to 100, a level from 0 to 100, positive quantities up to 100, and whole scaling divisors from 1 to 100.",
            );
          save(
            saveEncounterDefinition(
              initial,
              { title, body, fields: parsed.data },
              all,
            ),
          );
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to save encounter.",
          );
        }
      }}
    >
      <label>
        Encounter title
        <input
          autoFocus
          required
          maxLength={160}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <div className="form-grid">
        <label>
          Default party size
          <input
            required
            type="number"
            min={1}
            max={100}
            step={1}
            value={heroes}
            onChange={(e) => setHeroes(e.target.value)}
          />
        </label>
        <label>
          Party level
          <input
            required
            type="number"
            min={0}
            max={100}
            step="any"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          />
        </label>
      </div>
      {!!campaign.party.characters.length && (
        <button
          type="button"
          className="quiet"
          onClick={() => {
            setHeroes(String(campaign.party.characters.length));
            setLevel(
              String(
                campaign.party.characters.reduce(
                  (sum, pc) => sum + pc.level,
                  0,
                ) / campaign.party.characters.length,
              ),
            );
          }}
        >
          Use campaign party levels
        </button>
      )}
      <p className="hint">
        Party level is the average hero level. Difficulty uses the sum of those
        levels.
      </p>
      <label>
        Encounter description (Markdown)
        <textarea
          rows={3}
          maxLength={100000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <div className="encounter-builder-columns">
        <section aria-label="Encounter composition">
          <h3>
            Composition <small>({links.length}/100)</small>
          </h3>
          {!links.length && (
            <p className="hint">
              Add creatures, teams or hazards from the library. You can save an
              empty draft.
            </p>
          )}
          <ol className="encounter-composition">
            {links.map((link, index) => {
              const row = summary?.rows[index];
              const change = (patch: Partial<typeof link>) =>
                setLinks((current) =>
                  current.map((r) =>
                    r.id === link.id ? { ...r, ...patch } : r,
                  ),
                );
              return (
                <li key={link.id}>
                  <div className="content-actions">
                    <button
                      type="button"
                      className="reference-link"
                      onClick={() => open(link.target)}
                    >
                      {row?.monster?.title ?? link.name}
                    </button>
                    <button
                      type="button"
                      className="quiet"
                      aria-label={`Remove entry ${index + 1}`}
                      onClick={() =>
                        setLinks((current) =>
                          current.filter((r) => r.id !== link.id),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                  <div className="form-grid">
                    <label>
                      Quantity {index + 1}
                      <input
                        required
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={link.quantity}
                        onChange={(e) => change({ quantity: e.target.value })}
                      />
                    </label>
                    <label>
                      Quantity mode {index + 1}
                      <select
                        value={link.isPerHero ? "scaled" : "fixed"}
                        onChange={(e) =>
                          change({ isPerHero: e.target.value === "scaled" })
                        }
                      >
                        <option value="fixed">Fixed count</option>
                        <option value="scaled">Per heroes</option>
                      </select>
                    </label>
                    {link.isPerHero && (
                      <label>
                        Heroes per quantity {index + 1}
                        <input
                          required
                          type="number"
                          min={1}
                          max={100}
                          step={1}
                          value={link.heroesPerMonster}
                          onChange={(e) =>
                            change({ heroesPerMonster: e.target.value })
                          }
                        />
                      </label>
                    )}
                  </div>
                  {row && (
                    <p className={row.missing ? "notice error" : "hint"}>
                      {row.missing
                        ? "Missing full statblock or family dependencies"
                        : `Resolves to ${row.count} ${row.stats?.hazard ? "hazards" : row.stats?.members ? "teams" : "creatures"}`}
                      {row.rawCount !== row.count
                        ? ` · rounded up from ${row.rawCount}`
                        : ""}
                      {row.stats?.legendary
                        ? " · Solo quantity always resolves to one"
                        : ""}
                      {row.stats?.hpPerHero
                        ? ` · ${row.stats.hpPerHero * Number(heroes)} HP each`
                        : ""}
                      {row.stats?.members
                        ? ` · ${row.stats.members.length} combatants per team`
                        : ""}
                    </p>
                  )}
                  <div className="content-actions">
                    <button
                      type="button"
                      className="quiet"
                      disabled={index === 0}
                      aria-label={`Move entry ${index + 1} up`}
                      onClick={() =>
                        setLinks((current) => {
                          const next = [...current];
                          [next[index - 1], next[index]] = [
                            next[index],
                            next[index - 1],
                          ];
                          return next;
                        })
                      }
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      className="quiet"
                      disabled={index === links.length - 1}
                      aria-label={`Move entry ${index + 1} down`}
                      onClick={() =>
                        setLinks((current) => {
                          const next = [...current];
                          [next[index], next[index + 1]] = [
                            next[index + 1],
                            next[index],
                          ];
                          return next;
                        })
                      }
                    >
                      Move down
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
        <section aria-label="Encounter statblock library">
          <h3>Add statblocks</h3>
          <label>
            Search encounter statblocks
            <input
              type="search"
              placeholder="Name, tag or ability…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(20);
              }}
            />
          </label>
          <label>
            Statblock type
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                setLimit(20);
              }}
            >
              <option value="all">All types</option>
              <option value="creature">Creatures</option>
              <option value="team">Teams</option>
              <option value="hazard">Hazards</option>
            </select>
          </label>
          <p className="hint">{matches.length} results · available offline</p>
          <ul
            className="monster-results"
            aria-label="Encounter statblock search results"
          >
            {matches.slice(0, limit).map((entry) => {
              const stats = monsterStatsSchema.parse(entry.fields);
              return (
                <li key={entry.target}>
                  <button
                    type="button"
                    className="monster-result-title"
                    aria-label={`Preview ${entry.title}`}
                    onClick={() => open(entry.target)}
                  >
                    <strong>{entry.title}</strong>
                    <small>
                      Level {stats.level} ·{" "}
                      {stats.hazard
                        ? "Hazard"
                        : stats.members
                          ? "Team"
                          : stats.legendary
                            ? "Solo"
                            : "Creature"}
                    </small>
                    {stats.incomplete && (
                      <small>Incomplete · can be saved as a draft</small>
                    )}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={links.length >= 100}
                    aria-label={`Add ${entry.title} to composition`}
                    onClick={() =>
                      setLinks((current) => [
                        ...current,
                        {
                          id: uid(),
                          target: entry.target,
                          name: entry.title,
                          quantity: "1",
                          isPerHero: false,
                          heroesPerMonster: "1",
                        },
                      ])
                    }
                  >
                    Add
                  </button>
                </li>
              );
            })}
          </ul>
          {!matches.length && (
            <p className="hint">
              No matching statblocks. Create campaign content or import full
              monster records from the campaign library.
            </p>
          )}
          {matches.length > limit && (
            <button
              type="button"
              className="secondary"
              onClick={() => setLimit((n) => n + 20)}
            >
              Show more statblocks
            </button>
          )}
        </section>
      </div>
      <section className="notice" aria-label="Encounter readiness">
        <h3>Preview for {heroes || "…"} heroes</h3>
        {summary ? (
          <>
            <p>
              {summary.combatants} enemy combatants · {summary.hazards} hazards
              (party PCs are optional when starting).
            </p>
            {!!summary.blockers.length && (
              <ul>
                {summary.blockers.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p>Enter valid party assumptions and quantities to preview.</p>
        )}
        {summary && parsed.success && (
          <EncounterDifficulty
            entry={draft}
            all={all}
            heroes={parsed.data.heroCount}
          />
        )}
      </section>
      <label>
        GM annotations
        <textarea
          rows={2}
          maxLength={100000}
          value={annotations}
          onChange={(e) => setAnnotations(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <div className="content-actions">
        <button className="primary">Save encounter</button>
        <button type="button" className="secondary" onClick={cancel}>
          Cancel
        </button>
        {remove && (
          <button
            type="button"
            className="quiet danger"
            onClick={() => setDeleting(true)}
          >
            Delete encounter
          </button>
        )}
      </div>
      <p className="hint">
        Only Save encounter changes campaign content. Editing a definition
        leaves current combat unchanged.
      </p>
      {deleting && (
        <div className="notice">
          <p>
            Delete this saved encounter? Existing combat snapshots are retained;
            references to this definition will be missing.
          </p>
          <button type="button" className="secondary danger" onClick={remove}>
            Confirm delete encounter
          </button>
          <button
            type="button"
            className="quiet"
            onClick={() => setDeleting(false)}
          >
            Keep encounter
          </button>
        </div>
      )}
    </form>
  );
}
