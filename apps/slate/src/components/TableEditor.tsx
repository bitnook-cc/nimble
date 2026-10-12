import { useState } from "react";
import { uid } from "../model";
import {
  recordSchema,
  referenceMarkdown,
  type ContentRecord,
} from "../content-schema";
import {
  defaultTableDefinition,
  tableDefinitionSchema,
  type TableDefinition,
} from "../utility-schema";
import { tableDefinition, referenceTableDefinition } from "../table-content";
import { useContent } from "./ContentWorkspace";
import { ContentLibrary } from "./ContentLibrary";
import { Modal } from "./Modal";

export function TableEditor({
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
  const { all } = useContent();
  const [title, setTitle] = useState(initial?.title ?? "Random table");
  const [body, setBody] = useState(initial?.body ?? "");
  const [definition, setDefinition] = useState<TableDefinition>(
    () =>
      tableDefinition(initial) ??
      referenceTableDefinition(initial) ??
      defaultTableDefinition(),
  );
  const [error, setError] = useState("");
  const [referenceRow, setReferenceRow] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const rowChange = (id: string, delta: Record<string, unknown>) =>
    setDefinition((table) => ({
      ...table,
      rows: table.rows.map((row) =>
        row.id === id ? { ...row, ...delta } : row,
      ),
    }));
  return (
    <>
      <form
        className="utility-editor"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            const parsed = tableDefinitionSchema.parse(definition);
            save(
              recordSchema.parse({
                ...(initial ?? {
                  id: uid(),
                  kind: "table",
                  tags: [],
                  category: "Campaign content",
                  sources: [],
                  related: [],
                }),
                title,
                body,
                fields: { ...initial?.fields, definition: parsed },
              }),
            );
          } catch (error) {
            setError(
              error instanceof Error && "issues" in error
                ? [
                    ...new Set(
                      (error as { issues: { message: string }[] }).issues.map(
                        (issue) => issue.message,
                      ),
                    ),
                  ].join(" ")
                : error instanceof Error
                  ? error.message
                  : "Unable to save table.",
            );
          }
        }}
      >
        <label>
          Table name
          <input
            required
            maxLength={160}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          Description (Markdown)
          <textarea
            value={body}
            maxLength={100000}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <label>
          Roll mapping
          <select
            aria-label="Roll mapping"
            value={definition.mode}
            onChange={(event) =>
              setDefinition({
                ...definition,
                mode: event.target.value as TableDefinition["mode"],
              })
            }
          >
            <option value="list">Simple list (equal chance)</option>
            <option value="weighted">Weighted rows</option>
            <option value="ranges">Dice ranges</option>
          </select>
        </label>
        {definition.mode === "ranges" && (
          <label>
            Table dice formula
            <input
              value={definition.formula}
              onChange={(event) =>
                setDefinition({ ...definition, formula: event.target.value })
              }
              placeholder="1d100-1"
            />
          </label>
        )}
        {definition.rows.map((row, index) => (
          <fieldset className="table-editor-row" key={row.id}>
            <legend>Row {index + 1}</legend>
            <label>
              Row name
              <input
                required
                maxLength={160}
                value={row.name}
                onChange={(event) =>
                  rowChange(row.id, { name: event.target.value })
                }
              />
            </label>
            <label>
              Row Markdown
              <textarea
                rows={3}
                maxLength={10000}
                value={row.body}
                onChange={(event) =>
                  rowChange(row.id, { body: event.target.value })
                }
              />
            </label>
            <button
              type="button"
              className="quiet"
              onClick={() => setReferenceRow(row.id)}
            >
              Insert reference
            </button>
            <div className="utility-form-grid">
              {(definition.mode === "weighted"
                ? [["Weight", "weight"]]
                : definition.mode === "ranges"
                  ? [
                      ["Range start", "from"],
                      ["Range end", "to"],
                    ]
                  : []
              ).map(([label, key]) => (
                <label key={key}>
                  {label}
                  <input
                    type="number"
                    step={1}
                    required
                    min={key === "weight" ? 1 : -20000}
                    max={key === "weight" ? 10000 : 20000}
                    value={row[key as "weight" | "from" | "to"] ?? ""}
                    onChange={(event) =>
                      rowChange(row.id, {
                        [key]:
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <label>
              Then roll table
              <select
                aria-label="Then roll table"
                value={row.tableId ?? ""}
                onChange={(event) =>
                  rowChange(row.id, {
                    tableId: event.target.value || undefined,
                  })
                }
              >
                <option value="">No linked table</option>
                {all
                  .filter(
                    (entry) =>
                      tableDefinition(entry) && entry.id !== initial?.id,
                  )
                  .map((entry) => (
                    <option key={entry.target} value={entry.target}>
                      {entry.title}
                    </option>
                  ))}
              </select>
            </label>
            <button
              type="button"
              className="quiet danger"
              disabled={definition.rows.length <= 1}
              onClick={() =>
                setDefinition({
                  ...definition,
                  rows: definition.rows.filter((item) => item.id !== row.id),
                })
              }
            >
              Remove row
            </button>
          </fieldset>
        ))}
        <button
          type="button"
          className="secondary"
          disabled={definition.rows.length >= 200}
          onClick={() =>
            setDefinition({
              ...definition,
              rows: [
                ...definition.rows,
                {
                  id: uid(),
                  name: "New row",
                  body: "",
                  weight: 1,
                  from: 1,
                  to: 1,
                },
              ],
            })
          }
        >
          Add row
        </button>
        <p className="hint">
          Lists give each entry an equal chance. Weights give larger values a
          higher chance. Dice ranges are inclusive and must cover every outcome
          once; use 1d10-1 for 0–9. Linked tables allow eight steps, with no
          cycles. Editing this content updates every widget that displays it.
        </p>
        {error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}
        <div className="utility-actions">
          <button className="primary" type="submit">
            Save table
          </button>
          <button className="secondary" type="button" onClick={cancel}>
            Cancel
          </button>
          {remove && (
            <button
              className="quiet danger"
              type="button"
              onClick={() => setDeleting(true)}
            >
              Delete table
            </button>
          )}
        </div>
      </form>
      {referenceRow && (
        <ContentLibrary
          onClose={() => setReferenceRow(null)}
          choose={(entry) => {
            const row = definition.rows.find((row) => row.id === referenceRow);
            if (row)
              rowChange(row.id, {
                body:
                  row.body + " " + referenceMarkdown(entry.title, entry.target),
              });
            setReferenceRow(null);
          }}
        />
      )}
      {deleting && (
        <Modal title="Delete table?" onClose={() => setDeleting(false)}>
          <p>
            Widgets and notes referencing this table will no longer be able to
            open it.
          </p>
          <button className="danger" onClick={remove}>
            Confirm delete
          </button>
          <button className="secondary" onClick={() => setDeleting(false)}>
            Keep table
          </button>
        </Modal>
      )}
    </>
  );
}
