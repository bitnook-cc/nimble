import { useState } from "react";
import {
  BookmarkPlus,
  Copy,
  FilePlus2,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import {
  formatNpc,
  nameStyles,
  npcAttributeKinds,
  npcAttributeLabels,
  rerollNpcAttribute,
  rerollNpcName,
  type NpcOptions,
  generatorDefinitionSchema,
} from "@nimble/generators";
import { useContent } from "./ContentWorkspace";
import { GeneratorLibrary } from "./GeneratorLibrary";
import type { NpcTool, NpcEntry, NoteTool } from "../model";
import {
  generateNpcResults,
  replaceNpcResult,
  saveNpcResult,
  npcNote,
} from "../npcs";

export function NpcGenerator({
  tool,
  update,
  saveNote,
  canSaveNote,
}: {
  tool: NpcTool;
  update: (fn: (tool: NpcTool) => NpcTool) => void;
  saveNote: (note: NoteTool) => void;
  canSaveNote: boolean;
}) {
  const { all } = useContent();
  const generators = all.filter((entry) => entry.kind === "npc-generator");
  const selected = generators.find(
    (entry) => entry.target === tool.options.style,
  );
  const unavailable =
    !selected && !nameStyles.some((style) => style.id === tool.options.style);
  const [library, setLibrary] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const npc = tool.current;
  const alreadySaved =
    !!npc &&
    tool.saved.some((entry) => JSON.stringify(entry) === JSON.stringify(npc));
  function attempt(fn: () => void) {
    try {
      fn();
      setError("");
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to generate this NPC.");
    }
  }
  function select(entry: NpcEntry) {
    update((t) => ({
      ...t,
      current: entry,
      options: { style: entry.style, gender: entry.gender },
    }));
    setMessage("");
    setError("");
  }
  return (
    <div className="npc-tool">
      {library && <GeneratorLibrary close={() => setLibrary(false)} />}
      <div className="npc-options">
        <label>
          Name style
          <select
            value={tool.options.style}
            onChange={(e) => {
              const style = e.target.value as NpcOptions["style"];
              update((t) => ({ ...t, options: { ...t.options, style } }));
            }}
          >
            {unavailable && (
              <option value={tool.options.style}>Unavailable generator</option>
            )}
            {generators.length > 0 && (
              <optgroup label="Campaign and content packs">
                {generators.map((entry) => (
                  <option key={entry.target} value={entry.target}>
                    {entry.title}
                    {entry.pack ? ` · ${entry.pack.name}` : " · Campaign"}
                  </option>
                ))}
              </optgroup>
            )}
            {nameStyles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Name pool
          <select
            value={tool.options.gender}
            onChange={(e) => {
              const gender = e.target.value as NpcOptions["gender"];
              update((t) => ({ ...t, options: { ...t.options, gender } }));
            }}
          >
            <option value="any">Any</option>
            <option value="male">Masculine</option>
            <option value="female">Feminine</option>
          </select>
        </label>
      </div>
      <button className="quiet npc-manage" onClick={() => setLibrary(true)}>
        Manage generators
      </button>
      {unavailable && (
        <p className="notice">
          This generator is unavailable. Enable its content pack or choose
          another name style. Saved NPCs still support rerolls.
        </p>
      )}
      <div className="npc-actions">
        <button
          className="primary"
          disabled={unavailable}
          onClick={() =>
            attempt(() =>
              update((t) =>
                generateNpcResults(
                  t,
                  1,
                  undefined,
                  selected
                    ? generatorDefinitionSchema.parse(selected.fields)
                    : undefined,
                ),
              ),
            )
          }
        >
          <Users size={15} /> Generate NPC
        </button>
        <button
          className="secondary"
          disabled={unavailable}
          onClick={() =>
            attempt(() =>
              update((t) =>
                generateNpcResults(
                  t,
                  5,
                  undefined,
                  selected
                    ? generatorDefinitionSchema.parse(selected.fields)
                    : undefined,
                ),
              ),
            )
          }
        >
          Generate 5
        </button>
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {!npc ? (
        <p className="hint">
          A name and four details to bring someone to life at the table.
        </p>
      ) : (
        <section
          className="npc-result"
          aria-label="Generated NPC"
          aria-live="polite"
        >
          <div className="npc-name-row">
            <h3>{npc.name}</h3>
            <button
              className="icon-button"
              aria-label="Reroll name"
              onClick={() =>
                attempt(() =>
                  update((t) =>
                    t.current
                      ? replaceNpcResult(t, {
                          ...t.current,
                          ...rerollNpcName(t.current),
                        })
                      : t,
                  ),
                )
              }
            >
              <RotateCcw size={15} />
            </button>
          </div>
          <dl className="npc-attributes">
            {npcAttributeKinds.map((kind) => (
              <div key={kind}>
                <dt>{npcAttributeLabels[kind]}</dt>
                <dd>
                  <span>{npc.attributes[kind]}</span>
                  <button
                    className="icon-button"
                    aria-label={`Reroll ${npcAttributeLabels[kind].toLowerCase()}`}
                    onClick={() =>
                      attempt(() =>
                        update((t) =>
                          t.current
                            ? replaceNpcResult(t, {
                                ...t.current,
                                ...rerollNpcAttribute(t.current, kind),
                              })
                            : t,
                        ),
                      )
                    }
                  >
                    <RotateCcw size={14} />
                  </button>
                </dd>
              </div>
            ))}
          </dl>
          <div className="npc-actions">
            <button
              className="secondary"
              disabled={
                alreadySaved ||
                (tool.saved.length >= 100 &&
                  !tool.saved.some((s) => s.id === npc.id))
              }
              onClick={() => {
                attempt(() => update(saveNpcResult));
                setMessage("NPC saved in this campaign.");
              }}
            >
              <BookmarkPlus size={15} />
              {alreadySaved ? "Saved NPC" : "Save NPC"}
            </button>
            <button
              className="quiet"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(formatNpc(npc));
                  setMessage("NPC copied.");
                  setError("");
                } catch {
                  setError(
                    "Copy is unavailable. You can select the NPC text or save it as a note.",
                  );
                }
              }}
            >
              <Copy size={15} /> Copy NPC
            </button>
            <button
              className="quiet"
              disabled={!canSaveNote}
              onClick={() => {
                saveNote(npcNote(npc));
                setMessage("Saved as a campaign note.");
              }}
            >
              <FilePlus2 size={15} /> Save as note
            </button>
          </div>
        </section>
      )}
      <p className="hint npc-status" role="status">
        {message}
      </p>
      <details className="npc-list">
        <summary>Saved NPCs ({tool.saved.length})</summary>
        {!tool.saved.length && (
          <p className="hint">Keep favourites here before generating more.</p>
        )}
        {tool.saved.map((entry) => (
          <div className="npc-list-row" key={entry.id}>
            <button
              className="quiet"
              aria-label={`View saved NPC ${entry.name}`}
              onClick={() => select(entry)}
            >
              {entry.name}
            </button>
            <button
              className="icon-button"
              aria-label={`Remove saved NPC ${entry.name}`}
              onClick={() =>
                update((t) => ({
                  ...t,
                  saved: t.saved.filter((s) => s.id !== entry.id),
                }))
              }
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </details>
      <details className="npc-list">
        <summary>Recent NPCs ({tool.history.length})</summary>
        {tool.history.map((entry) => (
          <div className="npc-list-row" key={entry.id}>
            <button
              className="quiet"
              aria-label={`View recent NPC ${entry.name}`}
              onClick={() => select(entry)}
            >
              {entry.name}
            </button>
          </div>
        ))}
      </details>
    </div>
  );
}
