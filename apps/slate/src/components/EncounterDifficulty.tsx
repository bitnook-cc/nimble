import { encounterDifficulty } from "../encounter-difficulty";
import type { Entry } from "../content";

export function EncounterDifficulty({
  entry,
  all,
  heroes,
  heroLevel,
}: {
  entry: Entry;
  all: Entry[];
  heroes: number;
  heroLevel?: number;
}) {
  const rating = encounterDifficulty(entry, all, heroes, heroLevel);
  return (
    <section className="encounter-difficulty" aria-label="Encounter difficulty">
      <p className="difficulty-summary">
        <strong>
          {rating.label}
          {rating.minions && !rating.blockers.length ? " + minions" : ""}
        </strong>
        <span>
          {rating.ratio === null ? "—" : Math.round(rating.ratio * 100) + "%"}{" "}
          of {rating.solos ? "average hero level" : "party level budget"}
        </span>
      </p>
      <p className="hint">
        {rating.solos ? "Legendary levels" : "Monster levels"}{" "}
        {rating.monsterBudget} ·{" "}
        {rating.solos
          ? "Average hero level " + rating.heroLevel
          : "Party levels " + rating.partyBudget}
      </p>
      {!!rating.blockers.length && (
        <ul>
          {rating.blockers.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      )}
      <details>
        <summary>Difficulty guidance · GMG v1</summary>
        <p className="hint">
          {rating.solos
            ? "A legendary solo/team matches average hero level. One or two levels lower is easier; one or two higher is more challenging."
            : "Easy <50% · Medium ~75% · Hard 100% · Deadly >100–125% · Very deadly ≥150%. Between landmarks, the estimate shows a range."}
        </p>
        {rating.notes.map((text) => (
          <p className="hint" key={text}>
            {text}
          </p>
        ))}
      </details>
    </section>
  );
}
