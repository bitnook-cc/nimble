import { FileInput } from "./FileInput";
import { encounterFieldsSchema } from "../encounter-schema";
import { useRef, useState } from "react";
import { Modal } from "./Modal";
import { useContent } from "./ContentWorkspace";
import {
  applyExchange,
  exportRecords,
  parseExchange,
  type ImportPreview,
} from "../exchange";
import { download } from "../backup";
import { appStore } from "../storage";
import { type ContentRecord } from "../content-schema";

export function ExchangeDialog({
  onClose,
  initialRecords,
}: {
  onClose: () => void;
  initialRecords?: ContentRecord[];
}) {
  const { all, campaign } = useContent();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mode, setMode] = useState<"skip" | "replace" | "copy">("skip");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [packName, setPackName] = useState(`${campaign.name} content`);
  const [format, setFormat] = useState<"slate" | "pack" | "nexus" | "nimbrew">(
    "slate",
  );
  const [selected, setSelected] = useState(
    () => new Set((initialRecords ?? campaign.content).map((r) => r.id)),
  );
  const [prepared, setPrepared] = useState<ReturnType<
    typeof exportRecords
  > | null>(null);
  const generation = useRef(0);
  const candidates = initialRecords ?? campaign.content;
  return (
    <Modal title="Import and export content" onClose={onClose} wide>
      <p className="hint">
        Import Nexus JSON:API, Nimbrew monster JSON, or Slate records. Files are
        validated before any campaign changes. No online publishing or downloads
        occur.
      </p>
      <label>
        Import content JSON
        <FileInput
          type="file"
          accept=".json,application/json"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            const ticket = ++generation.current;
            setPreview(null);
            setError("");
            setMessage("");
            if (!file) return;
            if (file.size > 8 * 1024 * 1024) {
              setError("Import exceeds 8 MiB.");
              return;
            }
            void file
              .text()
              .then((text) => {
                if (generation.current === ticket)
                  setPreview(parseExchange(text, all));
              })
              .catch((error) => {
                if (generation.current === ticket)
                  setError(
                    error instanceof Error ? error.message : "Invalid import.",
                  );
              });
          }}
        />
      </label>
      {preview && (
        <section className="notice exchange-preview">
          <h3>Import preview · {preview.format}</h3>
          <p>
            {preview.records.length} records.{" "}
            {
              preview.records.filter((r) =>
                campaign.content.some((old) => old.id === r.id),
              ).length
            }{" "}
            matching IDs in this campaign.
          </p>
          <ul className="exchange-records">
            {preview.records.map((record) => (
              <li key={record.id}>
                {record.title} · {record.kind}
                {record.fields.incomplete ? " · Incomplete statblock" : ""}
                {record.kind === "encounter" && (
                  <>
                    <p>
                      For {encounterFieldsSchema.parse(record.fields).heroCount}{" "}
                      heroes at level{" "}
                      {encounterFieldsSchema.parse(record.fields).heroLevel}
                    </p>
                    <ul>
                      {encounterFieldsSchema
                        .parse(record.fields)
                        .entries.map((e) => (
                          <li key={e.id}>
                            {e.name}: {e.quantity}
                            {e.isPerHero
                              ? ` per ${e.heroesPerMonster} heroes`
                              : " total"}{" "}
                            ·{" "}
                            {preview.records.find(
                              (r) => "local::" + r.id === e.target,
                            )?.fields.incomplete
                              ? "Missing full statblock"
                              : preview.records.some(
                                    (r) =>
                                      "local::" + r.id === e.target &&
                                      r.kind === "monster",
                                  ) ||
                                  all.some(
                                    (r) =>
                                      r.target === e.target &&
                                      !r.fields.incomplete,
                                  )
                                ? "Statblock available"
                                : "Missing dependency"}
                          </li>
                        ))}
                    </ul>
                  </>
                )}
              </li>
            ))}
          </ul>
          {!!preview.warnings.length && (
            <ul className="exchange-warnings" aria-label="Import warnings">
              {preview.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          )}
          <label>
            Matching records
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
            >
              <option value="skip">Keep existing records</option>
              <option value="replace">Replace matching records</option>
              <option value="copy">Import independent copies</option>
            </select>
          </label>
          <p className="hint">
            Replace changes matching library records; active combat snapshots
            stay unchanged.
          </p>
          <div className="content-actions">
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await appStore.change(
                    (data) => ({
                      ...data,
                      campaigns: data.campaigns.map((c) =>
                        c.id === campaign.id
                          ? applyExchange(c, preview.records, mode)
                          : c,
                      ),
                    }),
                    mode === "replace"
                      ? { checkpoint: "Before replacing imported content" }
                      : undefined,
                  );
                  setMessage("Content imported and saved on this device.");
                  setPreview(null);
                } catch (error) {
                  setError(
                    error instanceof Error
                      ? error.message
                      : "Import failed. No changes were made.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Import into campaign
            </button>
            <button
              className="quiet"
              disabled={busy}
              onClick={() => setPreview(null)}
            >
              Cancel import
            </button>
          </div>
        </section>
      )}
      <h3>Export</h3>
      <p className="hint">
        Slate records preserve custom fields and source data. Complete campaign
        ZIP backups also include referenced packs and attachments.
      </p>
      <details>
        <summary>Select records ({selected.size})</summary>
        <div className="content-actions">
          <button
            className="quiet"
            onClick={() => {
              setSelected(new Set(candidates.map((r) => r.id)));
              setPrepared(null);
            }}
          >
            Select all
          </button>
          <button
            className="quiet"
            onClick={() => {
              setSelected(new Set());
              setPrepared(null);
            }}
          >
            Select none
          </button>
        </div>
        <div className="exchange-records">
          {candidates.map((r) => (
            <label key={r.id}>
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={(e) => {
                  const next = new Set(selected);
                  if (e.target.checked) next.add(r.id);
                  else next.delete(r.id);
                  setSelected(next);
                  setPrepared(null);
                }}
              />
              {r.title} · {r.kind}
            </label>
          ))}
        </div>
      </details>
      <label>
        Export format
        <select
          value={format}
          onChange={(event) => {
            setFormat(event.target.value as typeof format);
            setPrepared(null);
          }}
        >
          <option value="slate">Slate records (complete)</option>
          <option value="pack">Slate content pack</option>
          <option value="nexus">Nexus JSON:API</option>
          <option value="nimbrew">Nimbrew (one monster)</option>
        </select>
      </label>
      {format === "pack" && (
        <label>
          Content pack name
          <input
            maxLength={160}
            value={packName}
            onChange={(event) => {
              setPackName(event.target.value);
              setPrepared(null);
            }}
          />
        </label>
      )}
      <button
        className="secondary"
        disabled={!selected.size}
        onClick={() => {
          setError("");
          try {
            setPrepared(
              exportRecords(
                candidates.filter((r) => selected.has(r.id)),
                format,
                all,
                packName,
              ),
            );
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Unable to export.",
            );
          }
        }}
      >
        Preview export
      </button>
      {prepared && (
        <div className="notice exchange-preview">
          <p>{selected.size} records prepared.</p>
          {prepared.warnings.length ? (
            <ul aria-label="Export warnings">
              {prepared.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          ) : (
            <p>All record fields are preserved.</p>
          )}
          <button
            className="primary"
            onClick={() =>
              download(
                new Blob([JSON.stringify(prepared.value, null, 2)], {
                  type: "application/json",
                }),
                `${campaign.name.replace(/[^a-z0-9_-]/gi, "-")}.${format}.json`,
              )
            }
          >
            Download export
          </button>
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
    </Modal>
  );
}
