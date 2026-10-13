import { TimeWidget } from "./TimeWidget";
import { ImageViewport } from "./ImageViewport";
import { FileInput } from "./FileInput";
import { ZodError } from "zod";
import { useEffect, useState, type ReactNode } from "react";
import { Plus, Minus, ArrowUp, ArrowDown, Trash2, Copy } from "lucide-react";
import { uid, type Tool } from "../model";
import { utilitySchema, utilityTitles, type Utility } from "../utility-schema";
import { counterValue } from "../utilities";
import { TableWidget } from "./TableWidget";
import { appStore } from "../storage";
import { digest } from "../backup";
import { useContent } from "./ContentWorkspace";
import { Modal } from "./Modal";

function Numeric({
  label,
  value,
  onChange,
  step = "any",
  min,
  max,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
  step?: number | "any";
  min?: number;
  max?: number;
}) {
  return (
    <label className="field-label">
      {label}
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value === null || !Number.isFinite(value) ? "" : value}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
      />
    </label>
  );
}
const errorText = (e: unknown) =>
  e instanceof ZodError
    ? [...new Set(e.issues.map((i) => i.message))].slice(0, 5).join(" ")
    : e instanceof Error
      ? e.message
      : "Unable to save this tool.";

export function UtilityWidget({
  tool: value,
  update,
}: {
  tool: Tool;
  update: (fn: (t: Tool) => Tool) => void;
}) {
  const tool = utilitySchema.parse(value);
  const { campaign } = useContent();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false),
    [entryText, setEntryText] = useState("");
  const change = (fn: (t: Utility) => Utility) =>
    update((t) =>
      t.kind === tool.kind
        ? utilitySchema.parse(fn(utilitySchema.parse(t)))
        : t,
    );
  async function addImage(file: File) {
    setBusy(true);
    setError("");
    try {
      if (
        !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
          file.type,
        ) ||
        file.size > 10 * 1024 * 1024
      )
        throw new Error("Choose a PNG, JPEG, WebP or GIF image, up to 10 MiB.");
      // Decode before storing: a renamed non-image must not become a broken card.
      const decoded = await createImageBitmap(file);
      decoded.close();
      const asset = {
        id: uid(),
        name: file.name.slice(0, 200),
        mime: file.type,
        size: file.size,
        sha256: await digest(new Uint8Array(await file.arrayBuffer())),
      };
      await appStore.change(
        (d) => ({
          ...d,
          campaigns: d.campaigns.map((c) =>
            c.id !== campaign.id
              ? c
              : {
                  ...c,
                  assets: [...c.assets, asset],
                  tools: c.tools.map((t) =>
                    t.id === tool.id && t.kind === "image"
                      ? { ...t, assetId: asset.id, zoom: 1, panX: 0, panY: 0 }
                      : t,
                  ),
                },
          ),
        }),
        { assets: [{ campaignId: campaign.id, id: asset.id, blob: file }] },
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  let body: ReactNode;
  switch (tool.kind) {
    case "time":
      body = (
        <TimeWidget
          tool={tool}
          update={(fn) => change((t) => (t.kind === "time" ? fn(t) : t))}
        />
      );
      break;
    case "counter":
      body = (
        <>
          <output className="utility-value" aria-label="Counter value">
            {tool.value}
            <small>{tool.unit}</small>
          </output>
          {tool.target !== null && (
            <p
              className={
                (
                  tool.initial > tool.target
                    ? tool.value <= tool.target
                    : tool.value >= tool.target
                )
                  ? "utility-complete"
                  : "hint"
              }
              role="status"
            >
              {(
                tool.initial > tool.target
                  ? tool.value <= tool.target
                  : tool.value >= tool.target
              )
                ? "Target reached"
                : `Target: ${tool.target} ${tool.unit}`}
            </p>
          )}
          <div className="utility-actions">
            <button
              className="secondary"
              aria-label="Decrease counter"
              disabled={tool.min !== null && tool.value <= tool.min}
              onClick={() =>
                change((t) =>
                  t.kind === "counter"
                    ? { ...t, value: counterValue(t, t.value - t.step) }
                    : t,
                )
              }
            >
              <Minus size={16} />
            </button>
            <button
              className="primary"
              aria-label="Increase counter"
              disabled={tool.max !== null && tool.value >= tool.max}
              onClick={() =>
                change((t) =>
                  t.kind === "counter"
                    ? { ...t, value: counterValue(t, t.value + t.step) }
                    : t,
                )
              }
            >
              <Plus size={16} />
            </button>
            <button
              className="quiet"
              onClick={() =>
                change((t) =>
                  t.kind === "counter"
                    ? { ...t, value: t.initial, epoch: t.epoch + 1 }
                    : t,
                )
              }
            >
              Reset
            </button>
          </div>
          {tool.link && (
            <div className="utility-link">
              <p className="hint">
                {campaign.tools.find((t) => t.id === tool.link!.trackerId)
                  ?.name ?? "Tracker unavailable"}{" "}
                · {tool.link.direction === "increment" ? "+" : "−"}
                {tool.step} each {tool.link.event} ·{" "}
                {tool.link.paused ? "paused" : "linked"}
              </p>
              <button
                className="quiet"
                onClick={() =>
                  change((t) =>
                    t.kind === "counter" && t.link
                      ? { ...t, link: { ...t.link, paused: !t.link.paused } }
                      : t,
                  )
                }
              >
                {tool.link.paused ? "Resume linkage" : "Pause linkage"}
              </button>
            </div>
          )}
        </>
      );
      break;
    case "checklist":
      body = (
        <>
          <p className="hint" role="status">
            {tool.entries.filter((e) => e.checked).length} /{" "}
            {tool.entries.length} complete
          </p>
          <ol className="utility-checklist">
            {tool.entries.map((entry, index) => (
              <li
                key={entry.id}
                style={{ paddingInlineStart: entry.indent * 12 }}
              >
                <label>
                  <input
                    type="checkbox"
                    checked={entry.checked}
                    onChange={() =>
                      change((t) =>
                        t.kind === "checklist"
                          ? {
                              ...t,
                              entries: t.entries.map((e) =>
                                e.id === entry.id
                                  ? { ...e, checked: !e.checked }
                                  : e,
                              ),
                            }
                          : t,
                      )
                    }
                  />
                  <span>{entry.text}</span>
                </label>
                <div className="utility-row-actions">
                  <button
                    className="icon-button"
                    aria-label={`Move ${entry.text} up`}
                    disabled={index === 0}
                    onClick={() =>
                      change((t) => {
                        if (t.kind !== "checklist") return t;
                        const entries = [...t.entries];
                        [entries[index - 1], entries[index]] = [
                          entries[index],
                          entries[index - 1],
                        ];
                        return { ...t, entries };
                      })
                    }
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Move ${entry.text} down`}
                    disabled={index === tool.entries.length - 1}
                    onClick={() =>
                      change((t) => {
                        if (t.kind !== "checklist") return t;
                        const entries = [...t.entries];
                        [entries[index + 1], entries[index]] = [
                          entries[index],
                          entries[index + 1],
                        ];
                        return { ...t, entries };
                      })
                    }
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Duplicate ${entry.text}`}
                    disabled={tool.entries.length >= 200}
                    onClick={() =>
                      change((t) =>
                        t.kind === "checklist"
                          ? {
                              ...t,
                              entries: [
                                ...t.entries.slice(0, index + 1),
                                { ...entry, id: uid(), checked: false },
                                ...t.entries.slice(index + 1),
                              ],
                            }
                          : t,
                      )
                    }
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Remove ${entry.text}`}
                    onClick={() =>
                      change((t) =>
                        t.kind === "checklist"
                          ? {
                              ...t,
                              entries: t.entries.filter(
                                (e) => e.id !== entry.id,
                              ),
                            }
                          : t,
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <form
            className="utility-entry-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!entryText.trim() || tool.entries.length >= 200) return;
              change((t) =>
                t.kind === "checklist"
                  ? {
                      ...t,
                      entries: [
                        ...t.entries,
                        {
                          id: uid(),
                          text: entryText.trim(),
                          checked: false,
                          indent: 0,
                        },
                      ],
                    }
                  : t,
              );
              setEntryText("");
            }}
          >
            <input
              aria-label="New checklist entry"
              maxLength={500}
              value={entryText}
              placeholder="Add a task…"
              onChange={(e) => setEntryText(e.target.value)}
            />
            <button
              className="primary"
              disabled={!entryText.trim() || tool.entries.length >= 200}
            >
              Add
            </button>
          </form>
          <button
            className="quiet"
            disabled={!tool.entries.some((e) => e.checked)}
            onClick={() =>
              change((t) =>
                t.kind === "checklist"
                  ? {
                      ...t,
                      entries: t.entries.map((e) => ({ ...e, checked: false })),
                    }
                  : t,
              )
            }
          >
            Uncheck all
          </button>
        </>
      );
      break;
    case "table":
      body = (
        <TableWidget
          tool={tool}
          update={(next) =>
            change((current) => (current.kind === "table" ? next : current))
          }
        />
      );
      break;
    case "image":
      body = (
        <>
          <LocalImage
            campaignId={campaign.id}
            tool={tool}
            update={(fn) =>
              change((t) =>
                t.kind === "image" && t.assetId === tool.assetId ? fn(t) : t,
              )
            }
          />
          <label className="field-label">
            Import local image
            <FileInput
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={busy}
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                e.currentTarget.value = "";
                if (file) void addImage(file);
              }}
            />
          </label>
          {busy && <p role="status">Saving image…</p>}
        </>
      );
      break;
  }
  return (
    <div className={`utility-tool utility-${tool.kind}`}>
      {body}
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
    </div>
  );
}

function LocalImage({
  campaignId,
  tool,
  update,
}: {
  campaignId: string;
  tool: Extract<Utility, { kind: "image" }>;
  update: (
    fn: (
      t: Extract<Utility, { kind: "image" }>,
    ) => Extract<Utility, { kind: "image" }>,
  ) => void;
}) {
  const [image, setImage] = useState<{ key: string; url: string }>(),
    [error, setError] = useState<{ key: string; text: string }>();
  const key = campaignId + ":" + tool.assetId;
  useEffect(() => {
    if (!tool.assetId) return;
    let live = true,
      url: string | undefined;
    void appStore
      .asset(campaignId, tool.assetId)
      .then((blob) => {
        if (
          !blob ||
          !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
            blob.type,
          )
        )
          throw new Error(
            "This image is missing or has an unsupported format. Import a local image or restore its campaign backup.",
          );
        if (live) {
          url = URL.createObjectURL(blob);
          setImage({ key, url });
        }
      })
      .catch((e) => {
        if (live) setError({ key, text: errorText(e) });
      });
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [campaignId, tool.assetId, key]);
  if (!tool.assetId)
    return (
      <p className="hint">
        Import a local map, portrait or handout. Images are included in campaign
        backups.
      </p>
    );
  if (error?.key === key)
    return (
      <p role="alert" className="inline-error">
        {error.text}
      </p>
    );
  return (
    <figure className="image-card">
      {image?.key === key ? (
        <ImageViewport
          key={key}
          tool={tool}
          src={image.url}
          update={update}
          onError={() =>
            setError({ key, text: "The saved image cannot be displayed." })
          }
        />
      ) : (
        <div className="image-viewport">
          <p className="hint">Loading local image…</p>
        </div>
      )}
      {tool.caption && <figcaption>{tool.caption}</figcaption>}
    </figure>
  );
}

export function UtilityEditor({
  tool,
  onClose,
  save,
}: {
  tool: Utility;
  onClose: () => void;
  save: (t: Utility) => void;
}) {
  const { campaign } = useContent();
  const [draft, setDraft] = useState(() => structuredClone(tool)),
    [error, setError] = useState("");
  const [deadline, setDeadline] = useState("");
  const patch = (delta: Record<string, unknown>) =>
    setDraft({ ...draft, ...delta } as Utility);
  const numberField = (
    label: string,
    key: string,
    value: number | null,
    min?: number,
    max?: number,
    step: number | "any" = "any",
  ) => (
    <Numeric
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(n) => patch({ [key]: n })}
    />
  );
  const submit = () => {
    try {
      let next = draft;
      if (next.kind === "time" && tool.kind === "time") {
        if (deadline) {
          const at = new Date(deadline).getTime(),
            duration = at - Date.now();
          if (!Number.isFinite(at) || duration < 1000 || duration > 604800000)
            throw new Error(
              "Choose a deadline between one second and seven days from now.",
            );
          next = {
            ...next,
            mode: "timer",
            timer: {
              durationMs: Math.round(duration),
              remainingMs: duration,
              deadline: at,
              acknowledged: false,
            },
          };
        } else if (next.timer.durationMs !== tool.timer.durationMs) {
          next = {
            ...next,
            timer: {
              ...next.timer,
              remainingMs: next.timer.durationMs,
              deadline: null,
              acknowledged: false,
            },
          };
        }
      }
      if (next.kind === "counter")
        next = {
          ...next,
          epoch: tool.kind === "counter" ? tool.epoch + 1 : next.epoch,
        };
      save(utilitySchema.parse(next));
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <Modal
      title={`Configure ${utilityTitles[tool.kind]}`}
      onClose={onClose}
      wide={tool.kind === "checklist"}
    >
      <form
        className="utility-editor"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="field-label">
          Tool name
          <input
            required
            maxLength={80}
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </label>
        {draft.kind === "time" && (
          <>
            <label className="field-label">
              Clock format
              <select
                aria-label="Clock format"
                value={draft.clockFormat}
                onChange={(e) => patch({ clockFormat: e.target.value })}
              >
                <option value="24h">24 hour</option>
                <option value="12h">12 hour</option>
              </select>
            </label>
            <Numeric
              label="Duration (seconds)"
              value={draft.timer.durationMs / 1000}
              min={1}
              max={604800}
              step={1}
              onChange={(n) =>
                patch({
                  timer: {
                    ...draft.timer,
                    durationMs: n === null ? null : n * 1000,
                  },
                })
              }
            />
            <label className="field-label">
              Optional local deadline
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </label>
            <p className="hint">
              Switch modes without resetting. Running countdowns and stopwatches
              continue while hidden or closed. Changing duration resets the
              countdown; a deadline starts it immediately. Other settings
              preserve both tools. Expiry is visual and silent when the app is
              open or resumed; background alarms are not guaranteed.
            </p>
          </>
        )}
        {draft.kind === "counter" && (
          <>
            {numberField("Current value", "value", draft.value)}
            {numberField("Starting value", "initial", draft.initial)}
            <label className="field-label">
              Unit
              <input
                maxLength={40}
                value={draft.unit}
                onChange={(e) => patch({ unit: e.target.value })}
              />
            </label>
            {numberField("Step size", "step", draft.step, 0.000001)}
            {numberField("Minimum (optional)", "min", draft.min)}
            {numberField("Maximum (optional)", "max", draft.max)}
            {numberField("Target (optional)", "target", draft.target)}
            <label className="field-label">
              Linked tracker
              <select
                aria-label="Linked tracker"
                value={draft.link?.trackerId ?? ""}
                onChange={(e) =>
                  patch({
                    link: e.target.value
                      ? {
                          trackerId: e.target.value,
                          event: draft.link?.event ?? "round",
                          direction: draft.link?.direction ?? "increment",
                          paused: draft.link?.paused ?? false,
                        }
                      : null,
                  })
                }
              >
                <option value="">Manual only</option>
                {campaign.tools
                  .filter((t) => t.kind === "initiative")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </label>
            {draft.link && (
              <label className="field-label">
                Combat trigger
                <select
                  aria-label="Combat trigger"
                  value={draft.link.event}
                  onChange={(e) =>
                    patch({ link: { ...draft.link, event: e.target.value } })
                  }
                >
                  <option value="round">Each new round</option>
                  <option value="turn">Each Next turn</option>
                </select>
              </label>
            )}
            {draft.link && (
              <label className="field-label">
                Automatic change
                <select
                  aria-label="Automatic change"
                  value={draft.link.direction}
                  onChange={(e) =>
                    patch({
                      link: { ...draft.link, direction: e.target.value },
                    })
                  }
                >
                  <option value="increment">Increment (+ step size)</option>
                  <option value="decrement">Decrement (− step size)</option>
                </select>
              </label>
            )}
            <p className="hint">
              Beginning combat does not change the counter. Only advancing the
              selected tracker triggers this tool. Combat undo reverses linked
              changes; configuring or resetting starts a new counter history.
            </p>
          </>
        )}
        {draft.kind === "image" && (
          <>
            <label className="field-label">
              Caption
              <textarea
                maxLength={1000}
                value={draft.caption}
                onChange={(e) => patch({ caption: e.target.value })}
              />
            </label>
            <label className="field-label">
              Image fit
              <select
                aria-label="Image fit"
                value={draft.fit}
                onChange={(e) => patch({ fit: e.target.value })}
              >
                <option value="contain">Fit whole image</option>
                <option value="cover">Fill card</option>
              </select>
            </label>
            <label className="field-label">
              Campaign image
              <select
                aria-label="Campaign image"
                value={draft.assetId ?? ""}
                onChange={(e) => patch({ assetId: e.target.value || null })}
              >
                <option value="">No image</option>
                {campaign.assets
                  .filter((a) =>
                    [
                      "image/png",
                      "image/jpeg",
                      "image/webp",
                      "image/gif",
                    ].includes(a.mime),
                  )
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </label>
          </>
        )}
        {draft.kind === "checklist" && (
          <>
            <p className="hint">
              Edit labels and indentation. Reorder or duplicate entries in the
              tool.
            </p>
            {draft.entries.map((entry) => (
              <div className="utility-checklist-edit" key={entry.id}>
                <label className="field-label">
                  Entry text
                  <input
                    required
                    maxLength={500}
                    value={entry.text}
                    onChange={(e) =>
                      patch({
                        entries: draft.entries.map((r) =>
                          r.id === entry.id
                            ? { ...r, text: e.target.value }
                            : r,
                        ),
                      })
                    }
                  />
                </label>
                <label className="field-label">
                  Indent
                  <select
                    aria-label="Indent"
                    value={entry.indent}
                    onChange={(e) =>
                      patch({
                        entries: draft.entries.map((r) =>
                          r.id === entry.id
                            ? { ...r, indent: Number(e.target.value) }
                            : r,
                        ),
                      })
                    }
                  >
                    {[0, 1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </>
        )}
        {error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}
        <div className="utility-actions">
          <button className="primary" type="submit">
            Save tool
          </button>
          <button className="secondary" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
