import { useState } from "react";
import {
  generatorDefinitionSchema,
  generateNpc,
  formatNpc,
  npcAttributeKinds,
  npcAttributeLabels,
  type GeneratorDefinition,
} from "@nimble/generators";
import { builtinDefinition } from "../generator-content";

const pools = ["unisex", "male", "female", "surnames"] as const;
const poolLabels = {
  unisex: "Any first names",
  male: "Masculine first names",
  female: "Feminine first names",
  surnames: "Surnames",
};
const lines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
function LineTable({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <textarea
        rows={4}
        value={value}
        maxLength={1000000}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function GeneratorEditor({
  initial,
  title: initialTitle,
  save,
  cancel,
}: {
  initial: GeneratorDefinition;
  title: string;
  save: (title: string, definition: GeneratorDefinition) => void;
  cancel: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [mode, setMode] = useState(initial.names.mode);
  const list = initial.names.mode === "list" ? initial.names : undefined;
  const [nameLists, setNameLists] = useState({
    any: list?.firstNames.any.join("\n") ?? "",
    male: list?.firstNames.male.join("\n") ?? "",
    female: list?.firstNames.female.join("\n") ?? "",
    surnames: list?.surnames.join("\n") ?? "",
  });
  const [attributes, setAttributes] = useState(
    Object.fromEntries(
      npcAttributeKinds.map((kind) => [
        kind,
        initial.attributes[kind].join("\n"),
      ]),
    ) as Record<(typeof npcAttributeKinds)[number], string>,
  );
  const [patternPools, setPatternPools] = useState(() => {
    const config =
      initial.names.mode === "syllables" ? initial.names.config : {};
    const fallback = builtinDefinition().names;
    if (fallback.mode !== "syllables")
      throw new Error("Missing starter patterns.");
    return Object.fromEntries(
      pools.map((pool) => {
        const table =
          config[pool] ?? fallback.config[pool] ?? fallback.config.male!;
        return [
          pool,
          {
            enabled: !!config[pool],
            prefixes: table.syllables.prefixes.join("\n"),
            middle: table.syllables.middle.join("\n"),
            suffixes: table.syllables.suffixes.join("\n"),
            patterns: table.patterns.join("\n"),
            ...table.constraints,
            minSyllables: table.constraints.syllableCount.min,
            maxSyllables: table.constraints.syllableCount.max,
          },
        ];
      }),
    ) as unknown as Record<
      (typeof pools)[number],
      {
        enabled: boolean;
        prefixes: string;
        middle: string;
        suffixes: string;
        patterns: string;
        minLength: number;
        maxLength: number;
        minSyllables: number;
        maxSyllables: number;
      }
    >;
  });
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  function definition() {
    const config = Object.fromEntries(
      pools
        .filter((pool) => patternPools[pool].enabled)
        .map((pool) => {
          const draft = patternPools[pool];
          return [
            pool,
            {
              syllables: {
                prefixes: lines(draft.prefixes),
                middle: lines(draft.middle),
                suffixes: lines(draft.suffixes),
              },
              patterns: lines(draft.patterns).map((pattern) =>
                pattern.toUpperCase(),
              ),
              constraints: {
                minLength: draft.minLength,
                maxLength: draft.maxLength,
                syllableCount: {
                  min: draft.minSyllables,
                  max: draft.maxSyllables,
                },
              },
            },
          ];
        }),
    );
    const parsed = generatorDefinitionSchema.safeParse({
      names:
        mode === "list"
          ? {
              mode,
              firstNames: {
                any: lines(nameLists.any),
                male: lines(nameLists.male),
                female: lines(nameLists.female),
              },
              surnames: lines(nameLists.surnames),
            }
          : { mode, config },
      attributes: Object.fromEntries(
        npcAttributeKinds.map((kind) => [kind, lines(attributes[kind])]),
      ),
    });
    if (!parsed.success)
      throw new Error(
        parsed.error.issues
          .slice(0, 4)
          .map((issue) => `${issue.path.join(" · ")}: ${issue.message}`)
          .join("\n"),
      );
    return parsed.data;
  }
  function attempt(fn: () => void) {
    try {
      fn();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save generator.");
    }
  }
  return (
    <form
      className="generator-editor"
      onSubmit={(e) => {
        e.preventDefault();
        attempt(() => {
          if (!title.trim()) throw new Error("Give this generator a name.");
          save(title.trim(), definition());
        });
      }}
    >
      <label>
        Generator name
        <input
          required
          value={title}
          maxLength={160}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label>
        Name generation
        <select
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as typeof mode);
            setPreview("");
          }}
        >
          <option value="list">Name lists</option>
          <option value="syllables">Syllable patterns</option>
        </select>
      </label>
      <p className="hint">
        One entry per line. Repeated entries are more likely to be chosen. Any
        first names take precedence over masculine and feminine pools. Missing
        gender pools fall back to the available names.
      </p>
      {mode === "list" ? (
        <div className="generator-tables">
          {(["any", "male", "female", "surnames"] as const).map((pool) => (
            <LineTable
              key={pool}
              label={pool === "any" ? "Any first names" : poolLabels[pool]}
              value={nameLists[pool]}
              onChange={(value) =>
                setNameLists((current) => ({ ...current, [pool]: value }))
              }
            />
          ))}
        </div>
      ) : (
        <div>
          <p className="hint">
            P = prefix, M = middle, S = suffix. For example, PS joins a prefix
            and suffix. Enable at least one first-name pool. Enable surnames to
            generate a family name.
          </p>
          {pools.map((pool) => {
            const draft = patternPools[pool];
            const change = (values: Partial<typeof draft>) =>
              setPatternPools((current) => ({
                ...current,
                [pool]: { ...current[pool], ...values },
              }));
            return (
              <fieldset key={pool} className="generator-pool">
                <legend>{poolLabels[pool]}</legend>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) => change({ enabled: e.target.checked })}
                  />
                  Enable {poolLabels[pool].toLowerCase()}
                </label>
                {draft.enabled && (
                  <details open={pool === "unisex"}>
                    <summary>
                      Edit {poolLabels[pool].toLowerCase()} patterns
                    </summary>
                    <div className="generator-tables">
                      {(
                        ["prefixes", "middle", "suffixes", "patterns"] as const
                      ).map((part) => (
                        <LineTable
                          key={part}
                          label={`${poolLabels[pool]} ${part}`}
                          value={draft[part]}
                          onChange={(value) => change({ [part]: value })}
                        />
                      ))}
                    </div>
                    <div className="form-grid">
                      {(
                        [
                          "minLength",
                          "maxLength",
                          "minSyllables",
                          "maxSyllables",
                        ] as const
                      ).map((key) => (
                        <label key={key}>
                          {poolLabels[pool]}{" "}
                          {
                            {
                              minLength: "minimum length",
                              maxLength: "maximum length",
                              minSyllables: "minimum syllables",
                              maxSyllables: "maximum syllables",
                            }[key]
                          }
                          <input
                            type="number"
                            required
                            min={1}
                            max={key.includes("Syllables") ? 8 : 39}
                            value={draft[key]}
                            onChange={(e) =>
                              change({ [key]: Number(e.target.value) })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </details>
                )}
              </fieldset>
            );
          })}
        </div>
      )}
      <h3>NPC attributes</h3>
      <p className="hint">
        Each table needs at least one entry. These replace the four default
        tables for this generator.
      </p>
      <div className="generator-tables">
        {npcAttributeKinds.map((kind) => (
          <LineTable
            key={kind}
            label={`${npcAttributeLabels[kind]} entries`}
            value={attributes[kind]}
            onChange={(value) =>
              setAttributes((current) => ({ ...current, [kind]: value }))
            }
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="notice error generator-error">
          {error}
        </p>
      )}
      <div className="content-actions">
        <button className="primary">Save generator</button>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            attempt(() =>
              setPreview(formatNpc(generateNpc({}, Math.random, definition()))),
            )
          }
        >
          Try generator
        </button>
        <button type="button" className="quiet" onClick={cancel}>
          Cancel
        </button>
      </div>
      {preview && (
        <pre className="generator-preview" role="status">
          {preview}
        </pre>
      )}
    </form>
  );
}
