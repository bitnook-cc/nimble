import { useState } from "react";
import { Check } from "lucide-react";
import { type TableWidgetTool, tableOutcomes } from "../utility-schema";
import { resolveEntry } from "../content";
import {
  tableDefinition,
  rollContentTable,
  referenceTableDefinition,
  makeRandomTableCopy,
} from "../table-content";
import { useContent } from "./ContentWorkspace";
import { ContentLibrary } from "./ContentLibrary";
import { TableEditor } from "./TableEditor";
import { Modal } from "./Modal";
import { Markdown } from "./Markdown";

export function TableWidget({
  tool,
  update,
  preview = false,
}: {
  tool: TableWidgetTool;
  update: (tool: TableWidgetTool) => void;
  preview?: boolean;
}) {
  const {
    all,
    open,
    rollFormula,
    campaign,
    update: updateCampaign,
  } = useContent();
  const [choosing, setChoosing] = useState(false),
    [creating, setCreating] = useState(false),
    [error, setError] = useState("");
  const entry = tool.target ? resolveEntry(all, tool.target) : undefined;
  const definition = tableDefinition(entry);
  const outcomes = definition ? tableOutcomes(definition) : [];
  const convertible = !!referenceTableDefinition(entry);
  const latest = tool.history[0]?.steps[0];
  const selectedRow =
    latest?.tableId === entry?.target ? latest?.rowId : undefined;
  const md = (body: string, target = entry?.target) => {
    const record = all.find((record) => record.target === target);
    return (
      <Markdown
        body={body}
        all={all}
        open={open}
        onRoll={rollFormula}
        pack={
          record?.pack ??
          all.find((source) => source.target === record?.origin)?.pack
        }
      />
    );
  };
  function roll(manual?: string) {
    try {
      if (!entry)
        throw new Error(
          "The selected table is unavailable. Choose another table.",
        );
      const result = rollContentTable(entry, all, manual);
      update({ ...tool, history: [result, ...tool.history].slice(0, 20) });
      setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to roll table.",
      );
    }
  }
  function makeRollable() {
    if (!entry) return;
    try {
      const record = makeRandomTableCopy(entry);
      updateCampaign((campaign) => ({
        ...campaign,
        content: [...campaign.content, record],
        tools: campaign.tools.map((current) =>
          current.id === tool.id && current.kind === "table"
            ? {
                ...current,
                target: `local::${record.id}`,
                name: record.title.slice(0, 80),
              }
            : current,
        ),
      }));
      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create a campaign copy.",
      );
    }
  }
  return (
    <div className="utility-tool utility-table">
      <div className="utility-actions">
        {definition && (
          <button className="primary" onClick={() => roll()}>
            Roll table
          </button>
        )}
        {selectedRow && latest?.roll !== null && (
          <output
            className="table-roll-number"
            aria-label="Rolled number"
            aria-live="polite"
          >
            Rolled {latest?.roll}
          </output>
        )}
        {!preview && (
          <button className="quiet" onClick={() => setChoosing(true)}>
            Choose table
          </button>
        )}
        {!preview && (
          <button className="quiet" onClick={() => setCreating(true)}>
            Create table
          </button>
        )}
      </div>
      {!entry && (
        <p className="hint">
          {tool.target
            ? "The selected table is unavailable. Choose another table or restore its content pack."
            : "Choose a library table or create one for this campaign."}
        </p>
      )}
      {entry && !definition && (
        <div className="table-reference-notice">
          <p className="hint">
            This is a reference table without roll weights or dice ranges.
            {convertible
              ? " Create a campaign copy with equal chances for each entry, then configure weights or ranges if needed."
              : " Create a random table to define its entries and chances."}
          </p>
          {convertible && !preview && (
            <button className="secondary" onClick={makeRollable}>
              Make rollable campaign copy
            </button>
          )}
        </div>
      )}
      {entry && !preview && (
        <>
          <button className="reference-link" onClick={() => open(entry.target)}>
            {entry.title}
          </button>
          {md(entry.body)}
        </>
      )}
      {definition && (
        <table className="random-table" aria-label="Table entries">
          <thead>
            <tr>
              <th scope="col">Roll</th>
              <th scope="col">Content</th>
            </tr>
          </thead>
          <tbody>
            {outcomes.map(({ row, from, to }) => {
              const selected = row.id === selectedRow;
              return (
                <tr
                  key={row.id}
                  className={selected ? "is-selected" : undefined}
                  aria-current={selected ? "true" : undefined}
                >
                  <td>{from === to ? from : `${from}–${to}`}</td>
                  <td>
                    <div className="table-entry-title">
                      <button className="quiet" onClick={() => roll(row.id)}>
                        {row.name}
                      </button>
                      {selected && (
                        <span className="table-selected">
                          <Check size={15} aria-hidden="true" />
                          <span className="sr-only">Selected result</span>
                        </span>
                      )}
                    </div>
                    {row.body && md(row.body)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {tool.history[0] && (
        <section
          className="table-result"
          aria-label="Table result"
          aria-live="polite"
        >
          {tool.history[0].steps.map((step, index) => (
            <div className="table-result-summary" key={index}>
              <span className="hint">
                {step.roll === null
                  ? "Selected"
                  : `${step.formula.replace(/^(?:weighted|list) (\d+)$/, "1–$1")}: ${step.roll}`}
              </span>
              <h3>{step.name}</h3>
            </div>
          ))}
          <details className="table-result-details">
            <summary>Result details</summary>
            {tool.history[0].steps.map((step, index) => (
              <div key={index}>
                <p className="hint">{step.tableName}</p>
                {md(step.body, step.tableId)}
              </div>
            ))}
          </details>
        </section>
      )}
      {!!tool.history.length && (
        <details>
          <summary>Result history · {tool.history.length}</summary>
          <ol className="table-history">
            {tool.history.map((result) => (
              <li key={result.id}>
                {result.steps.map((step) => (
                  <div key={step.tableId}>
                    <strong>{step.name}</strong>
                    {md(step.body, step.tableId)}
                  </div>
                ))}
              </li>
            ))}
          </ol>
          <button
            className="quiet"
            onClick={() => update({ ...tool, history: [] })}
          >
            Clear history
          </button>
        </details>
      )}
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      {choosing && (
        <ContentLibrary
          initialKind="table"
          onClose={() => setChoosing(false)}
          choose={(entry) => {
            update({
              ...tool,
              target: entry.target,
              name: entry.title.slice(0, 80),
            });
            setError("");
          }}
        />
      )}
      {creating && (
        <Modal
          title="Create random table"
          onClose={() => setCreating(false)}
          wide
        >
          <TableEditor
            cancel={() => setCreating(false)}
            save={(record) => {
              updateCampaign((campaign) => ({
                ...campaign,
                content: [...campaign.content, record],
                tools: campaign.tools.map((current) =>
                  current.id === tool.id && current.kind === "table"
                    ? {
                        ...current,
                        target: `local::${record.id}`,
                        name: record.title.slice(0, 80),
                      }
                    : current,
                ),
              }));
              setCreating(false);
              setError("");
            }}
          />
        </Modal>
      )}
      <span className="sr-only">Tables belong to {campaign.name}.</span>
    </div>
  );
}

export function TableSettings({
  tool,
  save,
  onClose,
}: {
  tool: TableWidgetTool;
  save: (tool: TableWidgetTool) => void;
  onClose: () => void;
}) {
  const { all, edit } = useContent();
  const [name, setName] = useState(tool.name),
    [target, setTarget] = useState(tool.target ?? "");
  const entry = resolveEntry(all, target);
  return (
    <Modal title="Configure Random table" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save({ ...tool, name, target: target || null });
        }}
      >
        <label>
          Tool name
          <input
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Displayed table
          <select
            aria-label="Displayed table"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          >
            <option value="">No table selected</option>
            {target && !entry && (
              <option value={target}>Unavailable table</option>
            )}
            {all
              .filter((entry) => entry.kind === "table")
              .map((entry) => (
                <option key={entry.target} value={entry.target}>
                  {entry.title} ·{" "}
                  {tableDefinition(entry) ? "Random table" : "Reference table"}
                </option>
              ))}
          </select>
        </label>
        {entry && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              edit(entry);
            }}
          >
            {entry.pack ? "Edit campaign copy" : "Edit table content"}
          </button>
        )}
        <p className="hint">
          Entries are saved in the library. This widget only displays the
          selected table and remembers its results.
        </p>
        <button className="primary">Save tool</button>
      </form>
    </Modal>
  );
}
