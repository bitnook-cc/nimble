import { useRef, useState } from "react";
import { ArrowLeft, FilePlus2, RefreshCw, Trash2, PenLine } from "lucide-react";
import { useContent } from "./ContentWorkspace";
import { ContentLibrary } from "./ContentLibrary";
import { Markdown } from "./Markdown";
import { Modal } from "./Modal";
import { WorldGraph } from "./WorldGraph";
import { ReferenceTextarea } from "./ReferenceTextarea";
import { newNote, updateNote } from "../notes";
import {
  readDocument,
  writeDocument,
  removeDocumentReference,
  updateReferenceTags,
  type RelationshipReference,
} from "../document-markdown";
import { referenceMarkdown, normalizeRelationshipTags } from "../references";
import type { Campaign, Screen } from "../model";
import type { Entry } from "../content";

export function WorldEditor({
  screen,
  locked,
}: {
  screen: Screen;
  locked: boolean;
}) {
  const { campaign, all, update, open, rollFormula, relationships, remove } =
    useContent();
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("");
  const [pane, setPane] = useState("write"),
    [mode, setMode] = useState("write");
  const [history, setHistory] = useState<string[]>([]),
    [error, setError] = useState("");
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
    text: string;
    body: string;
  } | null>(null);
  const [selectionTags, setSelectionTags] = useState("");
  const [expanding, setExpanding] = useState(false),
    [picker, setPicker] = useState<"selection" | "relationship" | null>(null);
  const [addingRelationship, setAddingRelationship] = useState(false),
    [relationshipTarget, setRelationshipTarget] = useState<Entry | null>(null);
  const [editingReference, setEditingReference] =
      useState<RelationshipReference | null>(null),
    [deleting, setDeleting] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const notes = all.filter((entry) => entry.kind === "note" && !entry.pack);
  const note =
    notes.find((entry) => entry.id === screen.world?.selectedNoteId) ??
    notes[0];
  const document = readDocument(note?.body ?? "");
  const rows = relationships.rows.filter((row) => row.source === note?.target);
  const incoming = relationships.rows.filter(
    (row) => row.targetDocument === note?.target && row.source !== note?.target,
  );
  const world = screen.world ?? { selectedNoteId: null, positions: {} };
  function view(change: Partial<NonNullable<Screen["world"]>>) {
    update((c) => ({
      ...c,
      screens: c.screens.map((s) =>
        s.id === screen.id
          ? { ...s, world: { ...(s.world ?? world), ...change } }
          : s,
      ),
    }));
  }
  function select(target: string) {
    const entry = all.find((entry) => entry.target === target.split("#")[0]);
    if (entry?.kind !== "note" || entry.pack) {
      open(target);
      return;
    }
    if (note && entry.id !== note.id)
      setHistory((items) => [...items.slice(-19), note.id]);
    view({ selectedNoteId: entry.id });
    setSelection(null);
    setPane("write");
    setError("");
  }
  function attempt(change: (campaign: Campaign) => Campaign) {
    try {
      update(change);
      setError("");
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to update this document.",
      );
      return false;
    }
  }
  function metadata(patch: Record<string, unknown>) {
    if (!note) return false;
    return attempt((c) =>
      updateNote(c, note.id, (record) => ({
        ...record,
        body: writeDocument(record.body, {
          title: record.title,
          category: record.category,
          tags: record.tags,
          ...patch,
        }),
      })),
    );
  }
  function createNote() {
    const record = newNote("Untitled note");
    record.body = writeDocument("", {
      title: record.title,
      category: "Note",
      tags: [],
      relationships: [],
    });
    record.category = "Note";
    if (
      attempt((c) => ({
        ...c,
        content: [...c.content, record],
        screens: c.screens.map((s) =>
          s.id === screen.id
            ? {
                ...s,
                world: { ...(s.world ?? world), selectedNoteId: record.id },
              }
            : s,
        ),
      }))
    ) {
      if (note) setHistory((items) => [...items.slice(-19), note.id]);
      setPane("write");
      setMode("write");
      setSelection(null);
    }
  }
  function linkSelection(
    target: string,
    title?: string,
    newCategory = "Note",
    tags = selectionTags,
  ) {
    if (!note || !selection) return;
    if (title !== undefined && !title.trim()) {
      setError("Give the new note a title.");
      return;
    }
    const created = title !== undefined ? newNote(title.trim()) : null;
    if (created) {
      target = `local::${created.id}`;
      created.category = newCategory;
      created.body = writeDocument("", {
        title,
        category: newCategory,
        tags: [],
        relationships: [],
      });
    }
    if (
      attempt((c) => {
        const next = created ? { ...c, content: [...c.content, created] } : c;
        const changed = updateNote(next, note.id, (record) => {
          const parsed = readDocument(record.body);
          if (parsed.content !== selection.body)
            throw new Error(
              "The document changed. Select the passage again before linking it.",
            );
          const content =
            selection.body.slice(0, selection.start) +
            referenceMarkdown(
              selection.text,
              target,
              normalizeRelationshipTags(tags.split(",")),
            ) +
            selection.body.slice(selection.end);
          return {
            ...record,
            body: writeDocument(
              record.body,
              {
                title: record.title,
                category: record.category,
                tags: record.tags,
              },
              content,
            ),
          };
        });
        return created
          ? {
              ...changed,
              screens: changed.screens.map((s) =>
                s.id === screen.id
                  ? {
                      ...s,
                      world: {
                        ...(s.world ?? world),
                        selectedNoteId: created.id,
                      },
                    }
                  : s,
              ),
            }
          : changed;
      })
    ) {
      if (created) setHistory((items) => [...items.slice(-19), note.id]);
      setSelection(null);
      setExpanding(false);
      setPicker(null);
    }
  }
  function captureSelection() {
    const editor = input.current;
    if (
      !editor ||
      mode !== "write" ||
      document.errors.length ||
      editor.selectionStart === editor.selectionEnd
    )
      return;
    setSelection({
      start: editor.selectionStart,
      end: editor.selectionEnd,
      text: editor.value.slice(editor.selectionStart, editor.selectionEnd),
      body: editor.value,
    });
  }
  const issues =
    relationships.issues.find((issue) => issue.source === note?.target)
      ?.errors ?? [];
  return (
    <fieldset
      disabled={locked}
      className="world-editor"
      aria-label="World editor"
    >
      <div className="world-toolbar">
        <div
          className="world-pane-switch"
          role="group"
          aria-label="World editor panels"
        >
          {[
            ["notes", "Notes"],
            ["write", "Write"],
            ["graph", "Graph"],
          ].map(([value, label]) => (
            <button
              className="secondary"
              key={value}
              aria-pressed={pane === value}
              onClick={() => setPane(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="primary"
          onClick={createNote}
          disabled={campaign.content.length >= 2000}
        >
          <FilePlus2 size={15} />
          New note
        </button>
        <button
          className="quiet"
          disabled={relationships.loading}
          onClick={relationships.rebuild}
        >
          <RefreshCw size={14} />
          Rebuild relationship cache
        </button>
        <span className="hint" role="status">
          {relationships.loading
            ? "Indexing relationships…"
            : `${relationships.rows.length} references indexed`}
        </span>
      </div>
      {(error || relationships.error) && (
        <p role="alert" className="notice error">
          {error || relationships.error}
        </p>
      )}
      <div className={`world-columns world-pane-${pane}`}>
        <aside className="world-notes" aria-label="World notes">
          <label className="sr-only" htmlFor="world-note-search">
            Search world notes
          </label>
          <input
            id="world-note-search"
            type="search"
            placeholder="Search notes…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            aria-label="Filter note category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {[...new Set(notes.map((record) => record.category))]
              .sort()
              .map((value) => (
                <option key={value}>{value}</option>
              ))}
          </select>
          <div className="world-note-results">
            {notes
              .filter(
                (record) =>
                  (!category || record.category === category) &&
                  `${record.title} ${record.tags.join(" ")} ${record.body}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
              )
              .map((record) => (
                <button
                  key={record.id}
                  className={note?.id === record.id ? "selected" : ""}
                  aria-pressed={note?.id === record.id}
                  onClick={() => select(record.target)}
                >
                  <strong>{record.title}</strong>
                  <small>{record.category || "Note"}</small>
                </button>
              ))}
          </div>
          {!notes.length && (
            <p className="hint">
              Create a note or use notes already saved in the campaign library.
            </p>
          )}
        </aside>
        <section className="world-document" aria-label="World document">
          {note ? (
            <>
              <div className="content-actions">
                <button
                  className="icon-button"
                  aria-label="Back to previous document"
                  disabled={!history.length}
                  onClick={() => {
                    const id = history.at(-1)!;
                    setHistory((items) => items.slice(0, -1));
                    view({ selectedNoteId: id });
                    setSelection(null);
                  }}
                >
                  <ArrowLeft size={16} />
                </button>
                <EditableNoteTitle
                  key={note.id}
                  title={note.title}
                  disabled={!!document.errors.length}
                  rename={(title) => metadata({ title })}
                />
                <button
                  className="quiet"
                  aria-pressed={mode === "read"}
                  onClick={() => {
                    setMode(mode === "read" ? "write" : "read");
                    setSelection(null);
                  }}
                >
                  {mode === "read" ? "Write" : "Read"}
                </button>
                <button
                  className="quiet"
                  aria-pressed={mode === "source"}
                  onClick={() => {
                    setMode(mode === "source" ? "write" : "source");
                    setSelection(null);
                  }}
                >
                  Markdown source
                </button>
                <button
                  className="icon-button"
                  aria-label="Delete document"
                  onClick={() => setDeleting(true)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <details className="world-metadata" key={note.id + note.title}>
                <summary>Document metadata · {note.category || "Note"}</summary>
                <label>
                  Document title
                  <input
                    defaultValue={note.title}
                    maxLength={160}
                    onBlur={(event) => {
                      const title = event.target.value.trim();
                      if (title && title !== note.title) metadata({ title });
                    }}
                  />
                </label>
                <label>
                  Document category
                  <input
                    defaultValue={note.category}
                    maxLength={160}
                    onBlur={(event) =>
                      metadata({ category: event.target.value })
                    }
                  />
                </label>
                <label>
                  Document tags
                  <input
                    defaultValue={note.tags.join(", ")}
                    onBlur={(event) =>
                      metadata({
                        tags: normalizeRelationshipTags(
                          event.target.value.split(","),
                        ),
                      })
                    }
                  />
                </label>
              </details>
              <details className="world-relationships" open>
                <summary>Relationships ({rows.length})</summary>
                <div className="world-relationship-list">
                  {!rows.length && (
                    <p className="hint">
                      No relationships yet. Link a passage or add a header
                      relationship.
                    </p>
                  )}
                  {rows.map((row) => (
                    <div key={row.key} className="world-relationship-row">
                      <button
                        className="reference-link"
                        onClick={() => select(row.target)}
                      >
                        {all.find(
                          (record) => record.target === row.targetDocument,
                        )?.title ?? `Missing: ${row.target}`}
                      </button>
                      <span className="hint">
                        {row.tags.join(" · ") || "Untagged"}
                        <small>
                          {row.origin === "header" ? "Header" : "In text"}
                        </small>
                      </span>
                      <button
                        className="icon-button"
                        aria-label={`Edit ${row.origin} relationship tags`}
                        disabled={
                          relationships.loading || !!document.errors.length
                        }
                        onClick={() => setEditingReference(row)}
                      >
                        <PenLine size={13} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Remove ${row.origin} reference to ${all.find((record) => record.target === row.targetDocument)?.title ?? row.target}`}
                        disabled={
                          relationships.loading || !!document.errors.length
                        }
                        onClick={() =>
                          attempt((c) =>
                            updateNote(c, note.id, (record) => ({
                              ...record,
                              body: removeDocumentReference(record.body, row),
                            })),
                          )
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="quiet"
                  disabled={!!document.errors.length}
                  onClick={() => {
                    setRelationshipTarget(null);
                    setAddingRelationship(true);
                  }}
                >
                  Add relationship
                </button>
                {!!incoming.length && (
                  <details>
                    <summary>Referenced by ({incoming.length})</summary>
                    {incoming.map((row) => (
                      <button
                        className="reference-link"
                        key={row.key}
                        onClick={() => select(row.source)}
                      >
                        {all.find((record) => record.target === row.source)
                          ?.title ?? row.source}{" "}
                        · {row.tags.join(", ") || "untagged"}
                      </button>
                    ))}
                  </details>
                )}
              </details>
              {!!(document.errors.length || issues.length) && (
                <p role="alert" className="notice error">
                  {[...new Set([...document.errors, ...issues])].join(" ")} Fix
                  the header in Markdown source. The document is preserved.
                </p>
              )}
              {mode === "read" ? (
                <div className="world-read">
                  <Markdown
                    body={note.body}
                    all={all}
                    open={select}
                    onRoll={rollFormula}
                    preserveLabels
                  />
                </div>
              ) : (
                <ReferenceTextarea
                  key={note.id + mode}
                  editorRef={input}
                  all={all}
                  excludeTarget={note.target}
                  referencesEnabled={
                    mode === "write" && !document.errors.length
                  }
                  className="world-text"
                  aria-label={
                    mode === "source"
                      ? "Document Markdown source"
                      : "Document text"
                  }
                  value={
                    mode === "source" || document.errors.length
                      ? note.body
                      : document.content
                  }
                  maxLength={100000}
                  onSelect={captureSelection}
                  onMouseUp={captureSelection}
                  onKeyUp={captureSelection}
                  onTextChange={(text) => {
                    setSelection(null);
                    return attempt((c) =>
                      updateNote(c, note.id, (record) => ({
                        ...record,
                        body:
                          mode === "source" || document.errors.length
                            ? text
                            : writeDocument(
                                record.body,
                                {
                                  title: record.title,
                                  category: record.category,
                                  tags: record.tags,
                                },
                                text,
                              ),
                      })),
                    );
                  }}
                  placeholder="Write about your world. Type @ to find a reference, or select a passage to expand or link it."
                />
              )}
              {selection && mode === "write" && (
                <div
                  className="world-selection"
                  role="group"
                  aria-label="Selected text actions"
                >
                  <span>{selection.text.slice(0, 60)}</span>
                  <label>
                    Relationship tags
                    <input
                      value={selectionTags}
                      onChange={(event) => setSelectionTags(event.target.value)}
                      placeholder="member-of, secret…"
                    />
                  </label>
                  <button
                    className="secondary"
                    onClick={() => setExpanding(true)}
                  >
                    Expand selection
                  </button>
                  <button
                    className="secondary"
                    onClick={() => setPicker("selection")}
                  >
                    Link selected text
                  </button>
                  <button className="quiet" onClick={() => setSelection(null)}>
                    Cancel selection
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="world-empty">
              <h2>Your world starts with a note</h2>
              <p>
                Select existing campaign notes, or create one and expand its
                ideas into linked documents.
              </p>
              <button className="primary" onClick={createNote}>
                Create your first note
              </button>
            </div>
          )}
        </section>
        <WorldGraph
          entries={all}
          relationships={relationships.rows}
          selected={note?.target ?? null}
          positions={world.positions}
          select={select}
          move={(target, point) =>
            view({ positions: { ...world.positions, [target]: point } })
          }
        />
      </div>
      {expanding && selection && (
        <Modal
          title="Expand into a linked note"
          onClose={() => setExpanding(false)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const fields = new FormData(event.currentTarget);
              linkSelection(
                "",
                String(fields.get("title")).trim(),
                String(fields.get("category")),
                String(fields.get("tags")),
              );
            }}
          >
            <label>
              New note title
              <input
                name="title"
                required
                maxLength={160}
                defaultValue={selection.text.slice(0, 160)}
              />
            </label>
            <label>
              New note category
              <input name="category" defaultValue="Note" maxLength={160} />
            </label>
            <label>
              Relationship tags
              <input
                name="tags"
                defaultValue={selectionTags}
                placeholder="Comma-separated tags"
              />
            </label>
            <p className="hint">
              The selected words become a link. The new note and the reference
              are saved together.
            </p>
            <button className="primary">Create linked note</button>
          </form>
        </Modal>
      )}
      {addingRelationship && note && (
        <Modal
          title="Add header relationship"
          onClose={() => setAddingRelationship(false)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!relationshipTarget) return;
              const tags = normalizeRelationshipTags(
                String(new FormData(event.currentTarget).get("tags")).split(
                  ",",
                ),
              );
              metadata({
                relationships: [
                  ...document.relationships,
                  { target: relationshipTarget.target, tags },
                ],
              });
              setAddingRelationship(false);
            }}
          >
            <button
              type="button"
              className="secondary"
              onClick={() => setPicker("relationship")}
            >
              {relationshipTarget?.title ?? "Choose relationship target"}
            </button>
            <label>
              Relationship tags
              <input name="tags" placeholder="Comma-separated tags; optional" />
            </label>
            <button className="primary" disabled={!relationshipTarget}>
              Add relationship
            </button>
          </form>
        </Modal>
      )}
      {picker && (
        <ContentLibrary
          onClose={() => setPicker(null)}
          choose={(entry) => {
            if (picker === "selection") linkSelection(entry.target);
            else {
              setRelationshipTarget(entry);
              setPicker(null);
            }
          }}
        />
      )}
      {editingReference && note && (
        <Modal
          title="Edit relationship tags"
          onClose={() => setEditingReference(null)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const tags = normalizeRelationshipTags(
                String(new FormData(event.currentTarget).get("tags")).split(
                  ",",
                ),
              );
              if (
                attempt((c) =>
                  updateNote(c, note.id, (record) => ({
                    ...record,
                    body: updateReferenceTags(
                      record.body,
                      editingReference,
                      tags,
                    ),
                  })),
                )
              )
                setEditingReference(null);
            }}
          >
            <label>
              Relationship tags
              <input
                name="tags"
                defaultValue={editingReference.tags.join(", ")}
              />
            </label>
            <button className="primary">Save relationship tags</button>
          </form>
        </Modal>
      )}
      {deleting && note && (
        <Modal
          title={`Delete ${note.title}?`}
          onClose={() => setDeleting(false)}
        >
          <p>
            Delete this document and its editing widgets? Incoming references
            remain available as unresolved connections.
          </p>
          <button
            className="secondary danger"
            onClick={() => {
              remove(note);
              setDeleting(false);
              setSelection(null);
            }}
          >
            Delete document
          </button>
          <button className="secondary" onClick={() => setDeleting(false)}>
            Keep document
          </button>
        </Modal>
      )}
    </fieldset>
  );
}

function EditableNoteTitle({
  title,
  disabled,
  rename,
}: {
  title: string;
  disabled: boolean;
  rename: (title: string) => boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const restoreFocus = useRef(false);
  return (
    <h2 className="world-title" aria-label={title}>
      {editing ? (
        <input
          aria-label="Note title"
          value={draft}
          maxLength={160}
          autoFocus
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            const next = draft.trim();
            if (!next || next === title || rename(next)) {
              setDraft(title);
              setEditing(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              restoreFocus.current = true;
              event.currentTarget.blur();
            } else if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              restoreFocus.current = true;
              setDraft(title);
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          className="world-title-button"
          aria-label="Edit document title"
          title={
            disabled
              ? "Fix the Markdown metadata to rename this note"
              : "Edit title"
          }
          disabled={disabled}
          ref={(element) => {
            if (element && restoreFocus.current) {
              element.focus();
              restoreFocus.current = false;
            }
          }}
          onClick={() => {
            setDraft(title);
            setEditing(true);
          }}
        >
          {title}
        </button>
      )}
    </h2>
  );
}
