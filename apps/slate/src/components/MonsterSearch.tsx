import { useId, useState } from "react";
import { searchContent, type Entry } from "../content";
import { monsterStatsSchema, isReferenceMonster } from "../monster-schema";
import { useContent } from "./ContentWorkspace";
import { ContentLibrary } from "./ContentLibrary";

export function MonsterSearch({
  add,
  full,
  heroCount,
}: {
  add: (entry: Entry, heroes: number) => void;
  heroCount: number;
  full: boolean;
}) {
  const { all, open } = useContent();
  const id = useId();
  const [heroes, setHeroes] = useState(heroCount);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(20);
  const [library, setLibrary] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const matches = searchContent(all, query, "monster");
  return (
    <div className="monster-search">
      <label htmlFor={id}>Search monsters</label>
      <input
        id={id}
        type="search"
        value={query}
        placeholder="Name, kind, tag or ability…"
        onChange={(event) => {
          setQuery(event.target.value);
          setLimit(20);
          setMessage("");
        }}
      />
      <div className="monster-search-summary">
        <p className="hint">{matches.length} monsters · available offline</p>
        <button className="quiet" onClick={() => setLibrary(true)}>
          Manage monsters
        </button>
      </div>
      {matches.some((e) => e.fields.hpPerHero || e.fields.members) && (
        <label>
          Monster scaling party size
          <input
            type="number"
            min={1}
            max={100}
            value={heroes}
            onChange={(e) => setHeroes(Number(e.target.value))}
          />
        </label>
      )}
      {full && (
        <p className="hint">
          Encounter full · remove a combatant to add another.
        </p>
      )}
      {message && (
        <p className="hint" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      <ul className="monster-results" aria-label="Monster search results">
        {matches.slice(0, limit).map((entry) => {
          const stats = isReferenceMonster(entry)
            ? null
            : monsterStatsSchema.parse(entry.fields);
          return (
            <li key={entry.target}>
              <button
                className="monster-result-title"
                onClick={() => open(entry.target)}
                aria-label={`Preview ${entry.title}`}
              >
                <strong>{entry.title}</strong>
                <small>
                  {stats ? (
                    <>
                      Level {stats.level}
                      {stats.legendary
                        ? " Solo"
                        : stats.minion
                          ? " Minion"
                          : ""}{" "}
                      ·{" "}
                      {stats.hazard
                        ? "Hazard"
                        : stats.members
                          ? `${stats.members.length} members`
                          : `${stats.hpPerHero ? stats.hpPerHero + "/hero" : stats.hp} HP`}{" "}
                      {stats.armor ? `· ${stats.armor} armor` : ""}
                    </>
                  ) : (
                    "Reference only · combat automation unavailable"
                  )}
                </small>
                <small>
                  {stats?.kind || entry.category} ·{" "}
                  {entry.pack ? entry.pack.name : "Campaign"}
                </small>
              </button>
              <button
                className="secondary"
                aria-label={`Add ${entry.title} to encounter`}
                disabled={
                  !stats ||
                  full ||
                  !!stats.incomplete ||
                  heroes < 1 ||
                  heroes > 100
                }
                onClick={() => {
                  setError("");
                  try {
                    add(entry, heroes);
                    setMessage(`${entry.title} added to encounter.`);
                  } catch (cause) {
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : "Unable to add monster.",
                    );
                  }
                }}
              >
                Add
              </button>
            </li>
          );
        })}
      </ul>
      {!matches.length && (
        <p className="hint">
          No matching monsters. Try another search, create a campaign monster,
          or import a monster content pack.
        </p>
      )}
      {matches.length > limit && (
        <button className="secondary" onClick={() => setLimit((n) => n + 20)}>
          Show more monsters
        </button>
      )}
      {library && (
        <ContentLibrary
          initialKind="monster"
          onClose={() => setLibrary(false)}
        />
      )}
    </div>
  );
}
