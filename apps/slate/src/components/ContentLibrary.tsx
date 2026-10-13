import { TableEditor } from "./TableEditor";
import { FileInput } from "./FileInput";
import { NexusCredit } from "./NexusCredit";
import { EncounterLibrary } from "./EncounterLibrary";
import { ItemLibrary } from "./ItemLibrary";
import { ExchangeDialog } from "./ExchangeDialog";
import { ImportRecordList } from "./ImportRecordList";
import {
  prepareContentImport,
  installContentImportPack,
} from "../content-import";
import { applyExchange, type ImportPreview } from "../exchange";
import { useMemo, useRef, useState } from "react";
import { PenLine, Trash2, Pin, ArrowDownUp } from "lucide-react";
import { Modal } from "./Modal";
import { useContent } from "./ContentWorkspace";
import { searchContent, type Entry } from "../content";
import { tableDefinition } from "../table-content";
import { packKey, parsePack, type ContentPack } from "../content-schema";
import { appStore } from "../storage";
import { uid } from "../model";
import { download } from "../backup";

export function ContentLibrary({
  onClose,
  choose,
  initialKind = "all",
  initialTab = "browse",
}: {
  onClose: () => void;
  choose?: (entry: Entry) => void;
  initialKind?: string;
  initialTab?: "browse" | "create" | "packs";
}) {
  const { all, campaign, packs, open, edit, remove, pin, update } =
    useContent();
  const [deleting, setDeleting] = useState<Entry | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [itemManager, setItemManager] = useState(false);
  const [encounterManager, setEncounterManager] = useState(false);
  const [exchange, setExchange] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState(initialKind);
  const [source, setSource] = useState("all");
  const [category, setCategory] = useState("all");
  const [tab, setTab] = useState(initialTab);
  const [limit, setLimit] = useState(40);
  const [incoming, setIncoming] = useState<ContentPack | null>(null);
  const [incomingPreview, setIncomingPreview] = useState<ImportPreview | null>(
    null,
  );
  const [importDestination, setImportDestination] = useState("pack");
  const importGeneration = useRef(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const officialOrder = ["nimble-core-rules", "nimble-gmg", "nimble-heroes"];
  const enabledPacks = packs
    .filter((pack) => campaign.packRefs.includes(packKey(pack)))
    .sort((a, b) => {
      const rank = (id: string) => {
        const index = officialOrder.indexOf(id);
        return index < 0 ? officialOrder.length : index;
      };
      return (
        rank(a.id) - rank(b.id) ||
        a.name.localeCompare(b.name) ||
        a.version.localeCompare(b.version)
      );
    });
  const scopedEntries = useMemo(
    () =>
      all.filter(
        (entry) =>
          source === "all" ||
          (source === "campaign"
            ? !entry.pack
            : entry.pack && packKey(entry.pack) === source),
      ),
    [all, source],
  );
  const results = useMemo(
    () =>
      searchContent(scopedEntries, query, kind).filter(
        (r) => category === "all" || r.category === category,
      ),
    [scopedEntries, query, kind, category],
  );
  async function install() {
    if (!incoming) return;
    setBusy(true);
    setError("");
    try {
      await appStore.change((data) => {
        if (importDestination === "pack")
          return installContentImportPack(data, campaign.id, incoming);
        if (!incomingPreview || incomingPreview.campaignError)
          throw new Error("Campaign import is unavailable.");
        if (!data.campaigns.some((c) => c.id === campaign.id && !c.archivedAt))
          throw new Error("This campaign is no longer available.");
        return {
          ...data,
          campaigns: data.campaigns.map((c) =>
            c.id === campaign.id
              ? applyExchange(c, incomingPreview.records, "skip")
              : c,
          ),
        };
      });
      setIncoming(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={choose ? "Choose reference" : "Campaign library"}
      onClose={onClose}
      wide
    >
      <div className="campaign-tabs" role="group" aria-label="Library sections">
        {(["browse", "create", "packs"] as const).map((t) => (
          <button
            className="secondary"
            key={t}
            aria-pressed={tab === t}
            onClick={() => {
              if (
                t === "create" &&
                !["rule", "spell", "item", "monster", "table"].includes(kind)
              )
                setKind("rule");
              setTab(t);
            }}
          >
            {
              {
                browse: "Browse",
                create: "Create content",
                packs: "Content packs",
              }[t]
            }
          </button>
        ))}
        {!choose && (
          <button className="primary" onClick={() => setExchange(true)}>
            <ArrowDownUp size={15} /> Import / export content
          </button>
        )}
      </div>
      {!choose && (
        <div className="content-actions">
          <button className="quiet" onClick={() => setItemManager(true)}>
            Manage items
          </button>
          <button className="quiet" onClick={() => setEncounterManager(true)}>
            Manage encounters
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {tab === "browse" && (
        <>
          <label>
            Search content
            <input
              ref={searchInput}
              type="search"
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(40);
              }}
              placeholder="Name, tag or text…"
            />
          </label>
          <div className="library-filters">
            <label>
              Content source
              <select
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setCategory("all");
                  setLimit(40);
                }}
              >
                <option value="all">All content</option>
                <option value="campaign">Campaign content</option>
                {enabledPacks.map((pack) => (
                  <option key={packKey(pack)} value={packKey(pack)}>
                    {pack.name}
                    {enabledPacks.some(
                      (other) => other !== pack && other.name === pack.name,
                    )
                      ? ` · ${pack.version.slice(0, 12)}`
                      : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Content type
              <select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  setLimit(40);
                }}
              >
                {[
                  "all",
                  "rule",
                  "spell",
                  "item",
                  "monster",
                  "encounter",
                  "npc-generator",
                  "note",
                  "faq",
                  "class",
                  "subclass",
                  "ancestry",
                  "background",
                  "table",
                ].map((k) => (
                  <option key={k} value={k}>
                    {k === "all" ? "All types" : k}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Category
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setLimit(40);
                }}
              >
                <option value="all">All categories</option>
                {[...new Set(scopedEntries.map((r) => r.category))]
                  .filter(Boolean)
                  .sort()
                  .map((c) => (
                    <option key={c}>{c}</option>
                  ))}
              </select>
            </label>
          </div>
          <p className="hint" role="status">
            {results.length} results · available offline
          </p>
          <div className="library-results">
            {results.slice(0, limit).map((r) => (
              <article className="library-row" key={r.target}>
                <button
                  className="library-title"
                  onClick={() => {
                    if (choose) {
                      choose(r);
                      onClose();
                    } else open(r.target);
                  }}
                >
                  <strong>{r.title}</strong>
                  <small>
                    {r.kind === "table"
                      ? tableDefinition(r)
                        ? "Random table"
                        : "Reference table"
                      : r.kind}{" "}
                    · {r.category}
                    {r.pack
                      ? ` · ${r.pack.version.slice(0, 7)}`
                      : " · Campaign"}
                  </small>
                </button>
                {!choose && (
                  <div className="library-row-actions">
                    <button
                      className="icon-button"
                      aria-label={
                        r.pack
                          ? `Edit campaign copy of ${r.title}`
                          : `Edit ${r.title}`
                      }
                      title={r.pack ? "Edit a campaign copy" : "Edit content"}
                      onClick={() => edit(r)}
                    >
                      <PenLine size={16} aria-hidden="true" />
                    </button>
                    {!r.pack && (
                      <button
                        className="icon-button danger"
                        aria-label={`Delete ${r.title}`}
                        title="Delete content"
                        onClick={() => setDeleting(r)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                    <button
                      className="icon-button"
                      aria-label={`Pin ${r.title}`}
                      title="Pin to current screen"
                      onClick={() => pin(r)}
                    >
                      <Pin size={16} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
          {results.length > limit && (
            <button
              className="secondary"
              onClick={() => setLimit((n) => n + 40)}
            >
              Show more
            </button>
          )}
          {results.length === 0 && (
            <p>
              No matching content. Try another search or create a campaign
              reference.
            </p>
          )}
        </>
      )}
      {tab === "create" && (
        <label>
          New content type
          <select
            aria-label="New content type"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            {["rule", "spell", "item", "monster", "table"].map((kind) => (
              <option key={kind} value={kind}>
                {kind === "table" ? "Random table" : kind}
              </option>
            ))}
          </select>
        </label>
      )}
      {tab === "create" && kind === "table" && (
        <TableEditor
          cancel={() => setTab("browse")}
          save={(record) => {
            update((campaign) => ({
              ...campaign,
              content: [...campaign.content, record],
            }));
            setTab("browse");
            setSource("campaign");
            setCategory("all");
            setQuery(record.title);
            setLimit(40);
            open(`local::${record.id}`);
          }}
        />
      )}
      {tab === "create" && kind !== "table" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              id = uid(),
              title = String(f.get("title")).trim(),
              newKind = kind as "rule" | "spell" | "item" | "monster";
            if (!title) return;
            update((c) => ({
              ...c,
              content: [
                ...c.content,
                {
                  id,
                  kind: newKind,
                  title,
                  body: String(f.get("body")),
                  tags: [],
                  category: "Campaign content",
                  sources: [],
                  related: [],
                  fields:
                    newKind === "monster"
                      ? {
                          hp: Number(f.get("hp")),
                          level: String(f.get("level")),
                          armor: String(f.get("armor")),
                        }
                      : {},
                },
              ],
            }));
            setTab("browse");
            setSource("campaign");
            setCategory("all");
            setLimit(40);
            setQuery(title);
            open(`local::${id}`);
          }}
        >
          <p className="hint">
            Custom content belongs to this campaign. To adapt a Nexus rule or
            spell, open it and choose Make campaign copy.
          </p>
          <label>
            New content title
            <input name="title" required maxLength={80} />
          </label>
          {kind === "monster" && (
            <div className="form-grid">
              <label>
                Monster HP
                <input
                  name="hp"
                  type="number"
                  required
                  min={1}
                  max={99999}
                  defaultValue={20}
                />
              </label>
              <label>
                Monster level
                <input name="level" required maxLength={40} defaultValue="1" />
              </label>
              <label>
                Monster armor
                <input name="armor" maxLength={80} defaultValue="none" />
              </label>
            </div>
          )}
          <label>
            New content Markdown
            <textarea name="body" rows={10} maxLength={100000} />
          </label>
          <button className="primary">Create reference</button>
        </form>
      )}
      {tab === "packs" && (
        <>
          <p className="hint">
            Packs are immutable, versioned copies stored on this device.
            Installing a newer version keeps existing references tied to their
            original version. Disabling a pack hides its content and generators
            in this campaign; saved references and NPCs are retained.
          </p>
          <NexusCredit />
          {packs.map((p) => (
            <article className="pack-row" key={packKey(p)}>
              <strong>{p.name}</strong>
              <p className="hint">
                {p.records.length} records · version {p.version.slice(0, 12)} ·{" "}
                {campaign.packRefs.includes(packKey(p))
                  ? "Enabled for this campaign"
                  : "Installed on this device"}
              </p>
              <div className="content-actions">
                {!campaign.packRefs.includes(packKey(p)) && (
                  <button
                    className="secondary"
                    onClick={() =>
                      update((c) => ({
                        ...c,
                        packRefs: [...c.packRefs, packKey(p)],
                      }))
                    }
                  >
                    Enable pack
                  </button>
                )}
                {campaign.packRefs.includes(packKey(p)) && (
                  <button
                    className="secondary"
                    onClick={() => {
                      if (source === packKey(p)) {
                        setSource("all");
                        setCategory("all");
                        setLimit(40);
                      }
                      update((c) => ({
                        ...c,
                        packRefs: c.packRefs.filter(
                          (ref) => ref !== packKey(p),
                        ),
                      }));
                    }}
                  >
                    Disable pack
                  </button>
                )}
                <button
                  className="quiet"
                  onClick={() =>
                    download(
                      new Blob([JSON.stringify(p, null, 2)], {
                        type: "application/json",
                      }),
                      `${p.id}-${p.version.slice(0, 12)}.slate-content.json`,
                    )
                  }
                >
                  Export pack
                </button>
              </div>
              <details>
                <summary>Attribution</summary>
                <p>{p.source.license}</p>
                {p.source.url && (
                  <a
                    href={p.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Source revision
                  </a>
                )}
              </details>
            </article>
          ))}
          <label>
            Import content pack
            <FileInput
              type="file"
              accept=".json,application/json"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                setError("");
                setIncoming(null);
                setIncomingPreview(null);
                setImportDestination("pack");
                const ticket = ++importGeneration.current;
                if (!file) return;
                if (file.size > 8 * 1024 * 1024) {
                  setError("Content pack exceeds 8 MiB.");
                  return;
                }
                void file
                  .text()
                  .then(async (text) => {
                    const pack = parsePack(text);
                    const preview = await prepareContentImport(text, all);
                    if (importGeneration.current === ticket) {
                      setIncoming(pack);
                      setIncomingPreview(preview);
                    }
                  })
                  .catch(() => {
                    if (importGeneration.current === ticket)
                      setError(
                        "Invalid or unsupported content pack. No changes were made.",
                      );
                  });
              }}
            />
          </label>
          {incoming && (
            <div className="notice">
              <h3>{incoming.name}</h3>
              <p>
                {incoming.records.length} records ·{" "}
                {Object.keys(incoming.assets).length} images · version{" "}
                {incoming.version.slice(0, 12)}
              </p>
              <p>{incoming.source.license}</p>
              <p className="hint">
                Nothing has been stored. Preview each record before importing.
              </p>
              {incomingPreview && (
                <ImportRecordList
                  key={packKey(incoming)}
                  preview={incomingPreview}
                />
              )}
              <label>
                Import destination
                <select
                  value={importDestination}
                  disabled={busy}
                  onChange={(e) => setImportDestination(e.target.value)}
                >
                  <option value="pack">Content pack</option>
                  <option value="campaign">Campaign content</option>
                </select>
              </label>
              {importDestination === "campaign" && (
                <p className="hint">
                  Create editable campaign records. Existing matching records
                  will be kept.
                </p>
              )}
              {importDestination === "campaign" &&
                incomingPreview?.campaignError && (
                  <p role="alert">{incomingPreview.campaignError}</p>
                )}
              <button
                className="primary"
                disabled={
                  busy ||
                  (importDestination === "campaign" &&
                    !!incomingPreview?.campaignError)
                }
                onClick={() => void install()}
              >
                {importDestination === "pack"
                  ? "Install content pack"
                  : "Import into campaign"}
              </button>
              <button
                className="quiet"
                disabled={busy}
                onClick={() => {
                  importGeneration.current++;
                  setIncoming(null);
                }}
              >
                Cancel import
              </button>
            </div>
          )}
        </>
      )}
      {itemManager && (
        <Modal title="Item database" onClose={() => setItemManager(false)} wide>
          <ItemLibrary />
        </Modal>
      )}
      {encounterManager && (
        <EncounterLibrary onClose={() => setEncounterManager(false)} />
      )}
      {exchange && <ExchangeDialog onClose={() => setExchange(false)} />}
      {deleting && (
        <Modal
          title={`Delete ${deleting.title}?`}
          onClose={() => setDeleting(null)}
        >
          <p>
            Delete this campaign content? Existing note links and reference
            tiles will no longer open it.{" "}
            {deleting.kind === "note" &&
              "Its note widgets will also be removed."}
          </p>
          <div className="content-actions">
            <button
              className="secondary danger"
              onClick={() => {
                remove(deleting);
                setDeleting(null);
                requestAnimationFrame(() => searchInput.current?.focus());
              }}
            >
              Delete content
            </button>
            <button className="secondary" onClick={() => setDeleting(null)}>
              Keep content
            </button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
