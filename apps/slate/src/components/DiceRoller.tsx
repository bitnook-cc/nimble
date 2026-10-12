import { useId, useRef, useState } from "react";
import { BookmarkPlus, Dices, Eraser, RotateCcw, Trash2 } from "lucide-react";
import { type DiceTool, type Roll, uid } from "../model";
import { addDieToFormula, roll } from "../rolls";
import { Modal } from "./Modal";

function DiceResult({ entry }: { entry: Roll }) {
  const dice = entry.result.tokens.flatMap((token) =>
    token.type === "dice" ? token.diceData.dice : [],
  );
  return (
    <>
      <div className="result-equation">{entry.formula}</div>
      <div className="result-total">{entry.result.total}</div>
      <div className="die-results">
        {dice.map((die, index) => (
          <span
            key={index}
            className={`die-result ${!die.kept ? "dropped" : ""} ${die.category}`}
            title={`d${die.size}: ${die.value} · ${die.kept ? die.category : "discarded"}`}
          >
            {die.value}
            <small>d{die.size}</small>
          </span>
        ))}
      </div>
      <p className="result-detail">{entry.result.displayString}</p>
      {entry.result.isFumble && <span className="badge">Fumble</span>}
      {entry.result.numCriticals > 0 && (
        <span className="badge">
          {entry.result.numCriticals} critical
          {entry.result.numCriticals !== 1 ? "s" : ""}
        </span>
      )}
    </>
  );
}

export function DiceRoller({
  tool,
  update,
}: {
  tool: DiceTool;
  update: (fn: (tool: DiceTool) => DiceTool) => void;
}) {
  const instanceId = useId();
  const formulaInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);
  const latest = tool.rolls[0];
  function addDie(sides: number) {
    const formula = addDieToFormula(tool.formula, sides);
    if (formula.length > 1000) {
      setError("The formula is full. Remove a term before adding another die.");
      return;
    }
    update((t) => ({ ...t, formula }));
    setError("");
  }
  function performRoll(formula = tool.formula, options = tool.options) {
    try {
      const entry = roll(formula, options);
      update((current) => ({
        ...current,
        rolls: [entry, ...current.rolls].slice(0, 50),
      }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to roll this formula.");
    }
  }
  return (
    <div className="dice-tool">
      <div className="dice-pad" aria-label="Add dice to formula">
        {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
          <button
            key={sides}
            className={tool.formula === `1d${sides}` ? "selected" : ""}
            title={`Add a d${sides} to the formula`}
            onClick={() => addDie(sides)}
          >
            d{sides}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          performRoll();
        }}
      >
        <label className="field-label" htmlFor={`formula-${instanceId}`}>
          Dice formula
        </label>
        <div className="formula-row">
          <input
            ref={formulaInput}
            id={`formula-${instanceId}`}
            className="formula-input"
            value={tool.formula}
            maxLength={1000}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => {
              const formula = e.target.value;
              update((t) => ({ ...t, formula }));
            }}
            placeholder="2d6 + 3"
          />
          <button
            className="icon-button"
            type="button"
            aria-label="Clear dice formula"
            title="Clear dice formula"
            onClick={() => {
              update((t) => ({ ...t, formula: "" }));
              setError("");
              formulaInput.current?.focus();
            }}
          >
            <Eraser size={18} />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Save roll preset"
            title="Save formula and options as a preset"
            onClick={() => setSavingPreset(true)}
            disabled={!tool.formula.trim() || tool.presets.length >= 30}
          >
            <BookmarkPlus size={18} />
          </button>
        </div>
        <label className="field-label" htmlFor={`advantage-${instanceId}`}>
          Advantage
        </label>
        <select
          id={`advantage-${instanceId}`}
          value={tool.options.advantageLevel ?? 0}
          onChange={(e) => {
            const advantageLevel = Number(e.target.value);
            update((t) => ({
              ...t,
              options: { ...t.options, advantageLevel },
            }));
          }}
        >
          <option value={0}>Normal roll</option>
          <option value={1}>Advantage</option>
          <option value={2}>Double advantage</option>
          <option value={-1}>Disadvantage</option>
          <option value={-2}>Double disadvantage</option>
        </select>
        <details className="roll-options">
          <summary>Roll options & notation</summary>
          <div className="option-checks">
            {(
              [
                ["allowCriticals", "Exploding criticals"],
                ["allowFumbles", "Natural 1 sets total to zero"],
                ["vicious", "Vicious"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={!!tool.options[key]}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    update((t) => ({
                      ...t,
                      options: { ...t.options, [key]: checked },
                    }));
                  }}
                />
                {label}
              </label>
            ))}
          </div>
          <p className="hint">
            Use +, −, *, / and parentheses. Add ! for explosions, v for vicious,
            then a or d for advantage or disadvantage. Formula modifiers
            override matching controls. Replace attributes with numbers.
          </p>
        </details>
        <button type="submit" className="primary roll-button">
          <Dices size={18} />
          Roll dice<span>↵</span>
        </button>
      </form>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      {tool.presets.length > 0 && (
        <div className="presets" aria-label="Saved rolls">
          {tool.presets.map((preset) => (
            <div key={preset.id} className="preset">
              <button
                title={preset.formula}
                onClick={() => {
                  update((t) => ({
                    ...t,
                    formula: preset.formula,
                    options: preset.options,
                  }));
                  setError("");
                }}
              >
                {preset.name}
              </button>
              <button
                className="icon-button"
                aria-label={`Delete preset ${preset.name}`}
                onClick={() =>
                  update((t) => ({
                    ...t,
                    presets: t.presets.filter((p) => p.id !== preset.id),
                  }))
                }
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        className={`roll-result ${latest ? "" : "empty-result"}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {latest ? (
          <DiceResult entry={latest} />
        ) : (
          <>
            <Dices size={34} strokeWidth={1.2} />
            <p>
              A little chance.
              <br />A lot of possibility.
            </p>
            <small>Your next roll starts here.</small>
          </>
        )}
      </div>
      {tool.rolls.length > 0 && (
        <div className="roll-history">
          <div className="section-label">
            Recent rolls <span>{tool.rolls.length} / 50</span>
          </div>
          {tool.rolls.slice(0, 10).map((entry) => (
            <div className="history-row" key={entry.id}>
              <time>
                {new Date(entry.at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
              <span title={entry.result.displayString}>{entry.formula}</span>
              <strong>{entry.result.total}</strong>
              <button
                className="icon-button"
                aria-label={`Reroll ${entry.formula}`}
                onClick={() => performRoll(entry.formula, entry.options)}
              >
                <RotateCcw size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      {savingPreset && (
        <Modal title="Save this roll" onClose={() => setSavingPreset(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = String(
                new FormData(e.currentTarget).get("name"),
              ).trim();
              if (!name) return;
              update((t) => ({
                ...t,
                presets: [
                  ...t.presets,
                  {
                    id: uid(),
                    name,
                    formula: t.formula,
                    options: { ...t.options },
                  },
                ],
              }));
              setSavingPreset(false);
            }}
          >
            <p className="hint">
              Save this formula and its options as a named preset. Select it
              later to restore those settings, then press Roll dice.
            </p>
            <label>
              Preset name
              <input
                name="name"
                required
                maxLength={50}
                autoFocus
                placeholder="Longsword"
              />
            </label>
            <button className="primary" type="submit">
              Save preset
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
