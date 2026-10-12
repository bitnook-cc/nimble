import { useState } from "react";
import {
  generatorDefinitionSchema,
  nameStyles,
  type GeneratorDefinition,
} from "@nimble/generators";
import { useContent } from "./ContentWorkspace";
import { Modal } from "./Modal";
import { ContentLibrary } from "./ContentLibrary";
import { GeneratorEditor } from "./GeneratorEditor";
import {
  builtinDefinition,
  blankDefinition,
  generatorRecord,
  exportGeneratorPack,
} from "../generator-content";
import { recordSchema, parsePack, type ContentRecord } from "../content-schema";
import { uid } from "../model";
import { download } from "../backup";

export function GeneratorLibrary({ close }: { close: () => void }) {
  const { campaign, all, update } = useContent();
  const [editing, setEditing] = useState<{
    id: string;
    title: string;
    definition: GeneratorDefinition;
    original?: ContentRecord;
  } | null>(null);
  const [deleting, setDeleting] = useState<ContentRecord | null>(null);
  const [packs, setPacks] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  function edit(record: ContentRecord, copy = false, origin?: string) {
    setEditing({
      id: copy ? uid() : record.id,
      title: copy ? `${record.title.slice(0, 153)} (copy)` : record.title,
      definition: generatorDefinitionSchema.parse(record.fields),
      original: { ...record, ...(origin ? { origin } : {}) },
    });
  }
  return (
    <Modal title="NPC generators" onClose={close} wide>
      <p className="hint">
        Generators belong to this campaign. Edit names and attributes here, or
        share them in content packs. Saved NPCs keep their original tables for
        rerolls.
      </p>
      <div className="content-actions">
        <button
          className="primary"
          onClick={() =>
            setEditing({ id: uid(), title: "", definition: blankDefinition() })
          }
        >
          New generator
        </button>
        <button className="secondary" onClick={() => setPacks(true)}>
          Import / manage packs
        </button>
        <button
          className="secondary"
          disabled={
            !campaign.content.some((record) => record.kind === "npc-generator")
          }
          onClick={() => setExporting(true)}
        >
          Export generator pack
        </button>
      </div>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <h3>Campaign generators</h3>
      {!campaign.content.some((record) => record.kind === "npc-generator") && (
        <p className="hint">
          Create a generator or copy a built-in table to get started.
        </p>
      )}
      {campaign.content
        .filter((record) => record.kind === "npc-generator")
        .map((record) => (
          <article key={record.id} className="library-row">
            <strong>{record.title}</strong>
            <div className="content-actions">
              <button
                className="secondary"
                onClick={() => edit(record)}
                aria-label={`Edit generator ${record.title}`}
              >
                Edit
              </button>
              <button
                className="quiet"
                onClick={() => edit(record, true)}
                aria-label={`Duplicate generator ${record.title}`}
              >
                Duplicate
              </button>
              <button
                className="quiet"
                onClick={() => setDeleting(record)}
                aria-label={`Remove generator ${record.title}`}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      <h3>Enabled content packs</h3>
      {!all.some(
        (record) => record.kind === "npc-generator" && record.pack,
      ) && (
        <p className="hint">
          Import a generator content pack to add more tables.
        </p>
      )}
      {all
        .filter((record) => record.kind === "npc-generator" && record.pack)
        .map((record) => (
          <article key={record.target} className="library-row">
            <div>
              <strong>{record.title}</strong>
              <p className="hint">
                {record.pack!.name} · {record.pack!.version}
              </p>
            </div>
            <button
              className="secondary"
              aria-label={`Copy generator ${record.title} to campaign`}
              onClick={() =>
                edit(recordSchema.parse(record), true, record.target)
              }
            >
              Make campaign copy
            </button>
          </article>
        ))}
      <h3>Built-in generators</h3>
      {nameStyles.map((style) => (
        <article key={style.id} className="library-row">
          <strong>{style.label}</strong>
          <button
            className="secondary"
            aria-label={`Copy ${style.label} generator to campaign`}
            onClick={() =>
              setEditing({
                id: uid(),
                title: `${style.label} (copy)`,
                definition: builtinDefinition(style.id),
              })
            }
          >
            Make campaign copy
          </button>
        </article>
      ))}
      {editing && (
        <Modal title="Edit NPC generator" onClose={() => setEditing(null)} wide>
          <GeneratorEditor
            initial={editing.definition}
            title={editing.title}
            cancel={() => setEditing(null)}
            save={(title, definition) => {
              const record = generatorRecord(
                editing.id,
                title,
                definition,
                editing.original,
              );
              update((current) => ({
                ...current,
                content: current.content.some((r) => r.id === record.id)
                  ? current.content.map((r) =>
                      r.id === record.id ? record : r,
                    )
                  : [...current.content, record],
              }));
              setEditing(null);
            }}
          />
        </Modal>
      )}
      {deleting && (
        <Modal title="Remove generator?" onClose={() => setDeleting(null)}>
          <p>
            Remove {deleting.title} from this campaign? Saved NPCs retain their
            names, details, and reroll tables. Tools using this generator will
            need another name style.
          </p>
          <div className="content-actions">
            <button
              className="danger"
              onClick={() => {
                update((current) => ({
                  ...current,
                  content: current.content.filter(
                    (record) => record.id !== deleting.id,
                  ),
                }));
                setDeleting(null);
              }}
            >
              Remove generator
            </button>
            <button className="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {packs && (
        <ContentLibrary initialTab="packs" onClose={() => setPacks(false)} />
      )}
      {exporting && (
        <Modal
          title="Export generator pack"
          onClose={() => setExporting(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              try {
                const pack = exportGeneratorPack(
                  campaign,
                  String(form.get("id")),
                  String(form.get("version")),
                  String(form.get("name")),
                );
                const json = JSON.stringify(pack, null, 2);
                parsePack(json);
                download(
                  new Blob([json], { type: "application/json" }),
                  `${pack.id}-${pack.version}.slate-content.json`,
                );
                setError("");
                setExporting(false);
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Unable to export generator pack.",
                );
              }
            }}
          >
            <p className="hint">
              Exports every campaign generator. Choose a new version after
              editing a published pack; installing another version keeps the old
              tables available.
            </p>
            <label>
              Pack name
              <input
                name="name"
                required
                maxLength={160}
                defaultValue={`${campaign.name} NPC generators`}
              />
            </label>
            <label>
              Pack ID
              <input
                name="id"
                required
                maxLength={160}
                defaultValue={`campaign-${campaign.id}-generators`}
              />
            </label>
            <label>
              Pack version
              <input name="version" required maxLength={160} defaultValue="1" />
            </label>
            {error && (
              <p role="alert" className="notice error">
                {error}
              </p>
            )}
            <button className="primary">Download pack</button>
          </form>
        </Modal>
      )}
    </Modal>
  );
}
