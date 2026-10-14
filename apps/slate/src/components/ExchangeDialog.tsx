import { FileInput } from "./FileInput";
import { NexusCredit } from "./NexusCredit";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "./Modal";
import { useContent } from "./ContentWorkspace";
import { ImportRecordList } from "./ImportRecordList";
import { applyExchange, exportRecords, type ImportPreview } from "../exchange";
import { fetchNexusImport } from "../nexus-import";
import {
  contentImportPack,
  installContentImportPack,
  prepareContentImport,
} from "../content-import";
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
  const [fetching, setFetching] = useState(false);
  const [source, setSource] = useState<"file" | "nexus">("nexus");
  const [link, setLink] = useState("");
  const [destination, setDestination] = useState<"campaign" | "pack">(
    "campaign",
  );
  const [importPackName, setImportPackName] = useState("");
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
  const controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      generation.current++;
      controller.current?.abort();
    },
    [],
  );
  const importPack = useMemo(() => {
    if (!preview || destination !== "pack") return null;
    try {
      return { ...contentImportPack(preview, importPackName, all), error: "" };
    } catch (e) {
      return {
        value: null,
        warnings: [] as string[],
        error: e instanceof Error ? e.message : "Unable to create this pack.",
      };
    }
  }, [preview, destination, importPackName, all]);
  function cancelPreview() {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    setFetching(false);
    setPreview(null);
    setError("");
    setMessage("");
  }
  function acceptPreview(next: ImportPreview) {
    setPreview(next);
    setImportPackName(next.name ?? "Imported content");
    setDestination(next.pack ? "pack" : "campaign");
  }
  const candidates = initialRecords ?? campaign.content;
  return (
    <Modal title="Import and export content" onClose={onClose} wide>
      <p className="hint">
        Paste a public Nimble Nexus link or import a local JSON file. Preview
        every record before saving it to this campaign or a content pack.
      </p>
      <div className="campaign-tabs" role="group" aria-label="Import source">
        <button
          className="secondary"
          aria-pressed={source === "nexus"}
          disabled={busy}
          onClick={() => {
            cancelPreview();
            setSource("nexus");
          }}
        >
          Nexus link
        </button>
        <button
          className="secondary"
          aria-pressed={source === "file"}
          disabled={busy}
          onClick={() => {
            cancelPreview();
            setSource("file");
          }}
        >
          JSON file
        </button>
      </div>
      {source === "nexus" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            cancelPreview();
            const ticket = generation.current;
            const active = new AbortController();
            controller.current = active;
            setFetching(true);
            void fetchNexusImport(link, all, active.signal)
              .then((next) => {
                if (generation.current === ticket) acceptPreview(next);
              })
              .catch((e) => {
                if (generation.current === ticket)
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Unable to fetch Nexus content.",
                  );
              })
              .finally(() => {
                if (generation.current === ticket) {
                  setFetching(false);
                  controller.current = null;
                }
              });
          }}
        >
          <label>
            Nimble Nexus link
            <input
              type="url"
              required
              value={link}
              disabled={busy || fetching}
              onChange={(e) => {
                cancelPreview();
                setLink(e.target.value);
              }}
              placeholder="https://nimble.nexus/monsters/..."
            />
          </label>
          <button
            className="secondary"
            type="submit"
            disabled={busy || fetching || !link.trim()}
          >
            Preview Nexus import
          </button>
          <p className="hint">
            Public monsters, hazards, items, encounters and collections. Full
            statblocks and family abilities are fetched before preview. A
            connection is needed to fetch; saved content works offline. Artwork
            remains source links.
          </p>
          <NexusCredit />
        </form>
      )}
      {source === "file" && (
        <label>
          Import content JSON
          <FileInput
            type="file"
            accept=".json,application/json"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              cancelPreview();
              const ticket = generation.current;
              if (!file) return;
              if (file.size > 8 * 1024 * 1024) {
                setError("Import exceeds 8 MiB.");
                return;
              }
              setFetching(true);
              void file
                .text()
                .then((text) => prepareContentImport(text, all))
                .then((next) => {
                  if (generation.current === ticket) acceptPreview(next);
                })
                .catch((error) => {
                  if (generation.current === ticket)
                    setError(
                      error instanceof Error
                        ? error.message
                        : "Invalid import.",
                    );
                })
                .finally(() => {
                  if (generation.current === ticket) setFetching(false);
                });
            }}
          />
        </label>
      )}
      {fetching && (
        <div className="content-actions">
          <p role="status">
            {source === "nexus"
              ? "Fetching Nexus content and dependencies…"
              : "Reading content…"}
          </p>
          <button className="quiet" onClick={cancelPreview}>
            Cancel preview
          </button>
        </div>
      )}
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
          <p className="hint">
            Nothing has been stored. Expand any record to inspect its full
            content.
          </p>
          <ImportRecordList
            key={preview.records.map((r) => r.id).join("|")}
            preview={preview}
          />
          {!!preview.warnings.length && (
            <ul className="exchange-warnings" aria-label="Import warnings">
              {preview.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          )}
          <label>
            Import destination
            <select
              disabled={busy}
              value={destination}
              onChange={(e) =>
                setDestination(e.target.value as typeof destination)
              }
            >
              <option value="campaign">Campaign content</option>
              <option value="pack">Content pack</option>
            </select>
          </label>
          {destination === "campaign" ? (
            <>
              {preview.campaignError && (
                <p role="alert">{preview.campaignError}</p>
              )}
              <label>
                Matching records
                <select
                  disabled={busy}
                  value={mode}
                  onChange={(e) => setMode(e.target.value as typeof mode)}
                >
                  <option value="skip">Keep existing records</option>
                  <option value="replace">Replace matching records</option>
                  <option value="copy">Import independent copies</option>
                </select>
              </label>
              <p className="hint">
                Campaign records can be edited. Replacing them keeps active
                combat snapshots unchanged.
              </p>
            </>
          ) : (
            <>
              <label>
                Import pack name
                <input
                  required
                  maxLength={160}
                  value={importPackName}
                  disabled={busy || !!preview.pack}
                  onChange={(e) => setImportPackName(e.target.value)}
                />
              </label>
              <p className="hint">
                The pack is enabled for this campaign and can be enabled in
                others. Pack records are read-only; make a campaign copy to edit
                them.
              </p>
              {importPack?.error && <p role="alert">{importPack.error}</p>}
              {!!importPack?.warnings.length && (
                <ul aria-label="Pack import warnings">
                  {importPack.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              )}
            </>
          )}
          <div className="content-actions">
            <button
              className="primary"
              disabled={
                busy ||
                (destination === "pack"
                  ? !importPack?.value
                  : !!preview.campaignError)
              }
              onClick={async () => {
                if (!preview || (destination === "pack" && !importPack?.value))
                  return;
                setBusy(true);
                setError("");
                try {
                  await appStore.change(
                    (data) => {
                      if (destination === "pack")
                        return installContentImportPack(
                          data,
                          campaign.id,
                          importPack!.value!,
                        );
                      if (
                        !data.campaigns.some(
                          (c) => c.id === campaign.id && !c.archivedAt,
                        )
                      )
                        throw new Error(
                          "This campaign is no longer available.",
                        );
                      return {
                        ...data,
                        campaigns: data.campaigns.map((c) =>
                          c.id === campaign.id
                            ? applyExchange(c, preview.records, mode)
                            : c,
                        ),
                      };
                    },
                    destination === "campaign" && mode === "replace"
                      ? { checkpoint: "Before replacing imported content" }
                      : undefined,
                  );
                  setMessage(
                    destination === "pack"
                      ? "Content pack imported and saved on this device. Enabled for this campaign."
                      : "Content imported and saved on this device.",
                  );
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
              {destination === "pack"
                ? "Import as content pack"
                : "Import into campaign"}
            </button>
            <button className="quiet" disabled={busy} onClick={cancelPreview}>
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
