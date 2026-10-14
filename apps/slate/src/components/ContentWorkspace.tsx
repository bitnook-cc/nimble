import { TableEditor } from "./TableEditor";
import { NexusCredit } from "./NexusCredit";
import { isNexusSource } from "../nexus-attribution";
import { TableWidget } from "./TableWidget";
import { tableDefinition, mapTableLinks } from "../table-content";
import { ItemEditor } from "./ItemEditor";
import { EncounterEditor } from "./EncounterEditor";
import { itemFieldsSchema } from "../item-schema";
import { encounterFieldsSchema } from "../encounter-schema";
import { generatorDefinitionSchema } from "@nimble/generators";
import { getDialogOpener } from "../dialog-focus";
import { GeneratorEditor } from "./GeneratorEditor";
import { monsterStatsSchema, isCombatMonster } from "../monster-schema";
import { roll } from "../rolls";
import { newTool, type Roll } from "../model";
import { download } from "../backup";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { Modal } from "./Modal";
import { Markdown } from "./Markdown";
import {
  entries,
  contentKind,
  resolveEntry,
  backlinks,
  headingId,
  removeCampaignContent,
  type Entry,
} from "../content";
import {
  referenceMarkdown,
  packSchema,
  type ContentRecord,
  type ContentPack,
} from "../content-schema";
import { uid, type Campaign } from "../model";
import type { AppData, Tool } from "../model";

type Workspace = {
  rollFormula: (formula: string) => Roll;
  all: Entry[];
  campaign: Campaign;
  packs: AppData["packs"];
  update: (fn: (c: Campaign) => Campaign) => void;
  open: (target: string) => void;
  edit: (entry: Entry) => void;
  remove: (entry: Entry) => void;
  pin: (entry: Entry) => void;
};
const Context = createContext<Workspace | null>(null);
export function useContent() {
  const value = useContext(Context);
  if (!value) throw new Error("Content workspace missing");
  return value;
}
// Preview records resolve each other without creating campaign data or dice history.
export function ImportPreviewContent({
  records,
  pack,
  children,
}: {
  records: ContentRecord[];
  pack?: ContentPack;
  children: ReactNode;
}) {
  const workspace = useContent();
  const [target, setTarget] = useState<string | null>(null);
  const incoming = records.map((record) => ({
    ...record,
    target: `local::${record.id}`,
    pack,
  }));
  const all = [
    ...incoming,
    ...workspace.all.filter(
      (entry) => !incoming.some((r) => r.target === entry.target),
    ),
  ];
  const entry = target ? resolveEntry(all, target) : undefined;
  return (
    <Context.Provider
      value={{
        ...workspace,
        all,
        open: setTarget,
        rollFormula: (formula) =>
          roll(formula, {
            advantageLevel: 0,
            allowCriticals: false,
            allowFumbles: false,
          }),
        update: () => {},
        edit: () => {},
        remove: () => {},
        pin: () => {},
      }}
    >
      {children}
      {target && (
        <Modal
          title={entry?.title ?? "Reference unavailable"}
          onClose={() => setTarget(null)}
          wide
        >
          {entry ? (
            <ReferenceBody entry={entry} preview />
          ) : (
            <p>This reference is not included in the import.</p>
          )}
        </Modal>
      )}
    </Context.Provider>
  );
}
export function ContentProvider({
  campaign,
  packs,
  update,
  pin,
  children,
}: {
  campaign: Campaign;
  packs: AppData["packs"];
  update: Workspace["update"];
  pin: Workspace["pin"];
  children: ReactNode;
}) {
  const all = useMemo(() => entries(campaign, packs), [campaign, packs]);
  const opener = useRef<HTMLElement | null>(null);
  const openerDialog = useRef<HTMLDialogElement | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const rollFormula = (formula: string) => {
    const result = roll(formula, {
      advantageLevel: 0,
      allowCriticals: false,
      allowFumbles: false,
    });
    update((c) => {
      const existing = c.tools.find((t) => t.kind === "dice"),
        tool = existing ?? newTool("dice");
      if (tool.kind !== "dice") return c;
      const next = { ...tool, rolls: [result, ...tool.rolls].slice(0, 50) };
      return {
        ...c,
        tools: existing
          ? c.tools.map((t) => (t.id === existing.id ? next : t))
          : [...c.tools, next],
      };
    });
    return result;
  };
  const open = (target: string) => {
    if (!history.length) {
      opener.current = getDialogOpener();
      openerDialog.current = opener.current?.closest("dialog") ?? null;
    }
    setHistory((h) => [...h.slice(-19), target]);
    setEditing(false);
  };
  const target = history.at(-1),
    entry = target ? resolveEntry(all, target) : undefined;
  const [message, setMessage] = useState("");
  function copy(record: Entry, editCopy = false) {
    const definition = tableDefinition(record);
    const custom: ContentRecord = {
      id: uid(),
      title: record.title,
      body: record.body,
      tags: record.tags,
      category: record.category,
      sources: record.sources,
      fields:
        definition && record.pack
          ? {
              ...record.fields,
              definition: mapTableLinks(definition, (target) =>
                target.includes("::")
                  ? target
                  : `${record.pack!.id}@${record.pack!.version}::${target}`,
              ),
            }
          : record.fields,
      kind: record.kind === "note" ? "rule" : record.kind,
      origin: record.target,
      ...(record.importedFrom ? { importedFrom: record.importedFrom } : {}),
      related: record.related.map((r) =>
        record.pack && !r.includes("::")
          ? `${record.pack.id}@${record.pack.version}::${r}`
          : r,
      ),
    };
    update((c) => ({ ...c, content: [...c.content, custom] }));
    setHistory([`local::${custom.id}`]);
    setEditing(editCopy);
    setMessage("Campaign copy created. The source is unchanged.");
  }
  const close = () => {
    const parent = openerDialog.current;
    setHistory([]);
    requestAnimationFrame(() => {
      if (opener.current?.isConnected) opener.current.focus();
      else if (parent?.isConnected)
        parent.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    });
    setEditing(false);
    setMessage("");
  };
  const edit = (record: Entry) => {
    open(record.target);
    if (record.pack) copy(record, true);
    else setEditing(true);
  };
  const remove = (record: Entry) => {
    const base = record.target.split("#")[0];
    if (record.pack || base !== `local::${record.id}`) return;
    if (history.some((target) => target.split("#")[0] === base)) close();
    update((campaign) => removeCampaignContent(campaign, record.id));
  };
  return (
    <Context.Provider
      value={{
        all,
        campaign,
        packs,
        update,
        open,
        edit,
        remove,
        pin,
        rollFormula,
      }}
    >
      {children}
      {target && (
        <Modal title={entry?.title ?? "Missing reference"} onClose={close} wide>
          <div className="content-actions">
            {history.length > 1 && (
              <button
                className="secondary"
                onClick={() => {
                  setHistory((h) => h.slice(0, -1));
                  setEditing(false);
                }}
              >
                Back
              </button>
            )}
            {entry && (
              <>
                <button
                  className="primary"
                  onClick={() => {
                    pin(entry);
                  }}
                >
                  Pin to screen
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(referenceMarkdown(entry.title, entry.target))
                      .then(
                        () => setMessage("Reference copied."),
                        () =>
                          setMessage(
                            referenceMarkdown(entry.title, entry.target),
                          ),
                      );
                  }}
                >
                  Copy reference
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    download(
                      new Blob(["# " + entry.title + "\n\n" + entry.body], {
                        type: "text/markdown",
                      }),
                      entry.title.replace(/[^a-z0-9_-]/gi, "-") + ".md",
                    )
                  }
                >
                  Export Markdown
                </button>
                {entry.pack ? (
                  <button className="secondary" onClick={() => copy(entry)}>
                    Make campaign copy
                  </button>
                ) : (
                  <button
                    className="secondary"
                    onClick={() => setEditing((v) => !v)}
                  >
                    {editing ? "Read" : "Edit content"}
                  </button>
                )}
              </>
            )}
          </div>
          {message && (
            <p role="status" className="hint">
              {message}
            </p>
          )}
          {entry ? (
            editing && !entry.pack ? (
              <ContentEditor
                key={entry.id}
                entry={entry}
                done={() => setEditing(false)}
              />
            ) : (
              <>
                <ReferenceBody key={entry.target} entry={entry} />
                <div className="backlinks">
                  <h3>Referenced by</h3>
                  {backlinks(all, entry.target).length ? (
                    backlinks(all, entry.target).map((r) => (
                      <button
                        className="reference-link"
                        key={r.target}
                        onClick={() => open(r.target)}
                      >
                        {r.title}
                      </button>
                    ))
                  ) : (
                    <p className="hint">No references yet.</p>
                  )}
                </div>
              </>
            )
          ) : (
            <p>
              This content or section is not installed in this campaign. Its
              saved reference is retained. Enable the matching content pack or
              restore the original campaign record.
            </p>
          )}
        </Modal>
      )}
    </Context.Provider>
  );
}
export function ReferenceBody({
  entry,
  sections = true,
  preview = false,
}: {
  entry: Entry;
  sections?: boolean;
  preview?: boolean;
}) {
  const { all, open, rollFormula } = useContent();
  const importAssets = packSchema.shape.assets.safeParse(
    entry.importedFrom?.assets,
  );
  const importSource = packSchema.shape.source.safeParse(
    entry.importedFrom?.source,
  );
  const nexusUrl = (entry.fields.nexus as { url?: unknown } | undefined)?.url;
  const fromNexus =
    isNexusSource(nexusUrl) ||
    (entry.fields.exchange as { format?: string } | undefined)?.format ===
      "nexus" ||
    isNexusSource(entry.pack?.source.url) ||
    (importSource.success && isNexusSource(importSource.data.url));
  const [tableHistory, setTableHistory] = useState<
    import("../utility-schema").TableWidgetTool["history"]
  >([]);
  const headings = [...entry.body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => ({
    title: m[1],
    anchor: headingId(m[1]),
  }));
  return (
    <>
      <p className="content-meta">
        {entry.fields.system === "dnd-5e-2024" && "5.5e reference · "}
        {contentKind(entry)} · {entry.category}
        {preview
          ? " · Import preview"
          : entry.pack
            ? ` · ${entry.pack.version.slice(0, 7)}`
            : " · Campaign content"}
      </p>
      {!!entry.fields.exchange && (
        <p className="hint">
          Imported source:{" "}
          {String(
            (
              entry.fields.exchange as {
                format?: string;
                resource?: { id?: string };
              }
            ).format ?? "content",
          )}
          {(entry.fields.exchange as { resource?: { id?: string } }).resource
            ?.id
            ? " · " +
              (entry.fields.exchange as { resource: { id: string } }).resource
                .id
            : ""}
        </p>
      )}
      {entry.sources.length > 0 && (
        <p className="hint">
          {entry.sources
            .map(
              (s) =>
                `${s.book}${s.pages?.length ? " · p. " + s.pages.join(", ") : ""}`,
            )
            .join(" / ")}
        </p>
      )}
      {typeof nexusUrl === "string" &&
        /^https:\/\/nimble\.nexus\/(monsters|hazards|items|encounters)\/[a-zA-Z0-9_.-]+$/.test(
          nexusUrl,
        ) && (
          <p className="hint">
            <a href={nexusUrl} target="_blank" rel="noopener noreferrer">
              View on Nimble Nexus
            </a>
          </p>
        )}
      {!entry.pack && importSource.success && (
        <details className="content-attribution">
          <summary>Source and attribution</summary>
          <p>{importSource.data.license}</p>
          {fromNexus && <NexusCredit />}
          {importSource.data.url && (
            <a
              href={importSource.data.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Source content
            </a>
          )}
        </details>
      )}
      {isCombatMonster(entry) &&
        (() => {
          const stats = monsterStatsSchema.parse(entry.fields);
          const facts = {
            Level:
              stats.level +
              (stats.legendary ? " Solo" : stats.minion ? " Minion" : ""),
            HP: stats.hpPerHero ? `${stats.hpPerHero}/hero` : (stats.hp ?? ""),
            Armor: stats.armor ?? "",
            Size: stats.size ?? "",
            Kind: stats.hazard ? "Hazard" : stats.members ? "Team" : stats.kind,
            Movement: stats.movement,
            Saves: stats.saves,
          };
          return (
            <dl className="spell-facts monster-facts">
              {Object.entries(facts)
                .filter(([, value]) => value !== "")
                .map(([name, value]) => (
                  <div key={name}>
                    <dt>{name}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
          );
        })()}
      {entry.kind === "item" &&
        (() => {
          const f = itemFieldsSchema.parse(entry.fields);
          const facts = {
            Type: f.kind,
            Rarity: f.rarity.replaceAll("_", " "),
            Price: f.price
              ? `${f.price.amount} ${f.price.currency}`
              : undefined,
            Slots: f.slots,
            Damage: f.damage,
            Armor: f.armor,
            Uses: f.uses,
            ...f.properties,
          };
          return (
            <dl className="spell-facts">
              {Object.entries(facts)
                .filter(([, v]) => v !== undefined && v !== "")
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{String(v)}</dd>
                  </div>
                ))}
            </dl>
          );
        })()}
      {entry.kind === "encounter" &&
        (() => {
          const f = encounterFieldsSchema.parse(entry.fields);
          return (
            <>
              <p className="hint">
                For {f.heroCount} heroes at level {f.heroLevel}
              </p>
              <ul>
                {f.entries.map((e) => (
                  <li key={e.id}>
                    <button
                      className="reference-link"
                      onClick={() => open(e.target)}
                    >
                      {resolveEntry(all, e.target)?.title ?? e.name}
                    </button>{" "}
                    · {e.quantity}
                    {e.isPerHero ? ` per ${e.heroesPerMonster} heroes` : ""}
                  </li>
                ))}
              </ul>
              {f.annotations && <p>{f.annotations}</p>}
            </>
          );
        })()}
      {entry.kind === "monster" && !!entry.fields.incomplete && (
        <p className="notice">
          Incomplete statblock:{" "}
          {String(
            (entry.fields.missing as string[] | undefined)?.join(", ") ??
              "missing dependencies",
          )}
          .
        </p>
      )}
      {entry.kind === "spell" && entry.fields.system !== "dnd-5e-2024" && (
        <dl className="spell-facts">
          {["school", "tier", "actions", "utility", "reaction", "target"]
            .filter((k) => entry.fields[k] !== undefined)
            .map((k) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>
                  {typeof entry.fields[k] === "object"
                    ? Object.entries(entry.fields[k] as Record<string, unknown>)
                        .map(([key, v]) => `${key}: ${v}`)
                        .join(" · ")
                    : String(entry.fields[k])}
                </dd>
              </div>
            ))}
        </dl>
      )}
      {entry.origin && (
        <p className="hint">
          Campaign copy of{" "}
          <button
            className="reference-link"
            onClick={() => open(entry.origin!)}
          >
            source content
          </button>
        </p>
      )}
      {sections && !entry.target.includes("#") && headings.length > 0 && (
        <label className="section-picker">
          Open a section
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) open(entry.target + "#" + e.target.value);
            }}
          >
            <option value="">Choose section…</option>
            {headings.map((h, i) => (
              <option key={i} value={h.anchor}>
                {h.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {entry.kind === "table" && tableDefinition(entry) && (
        <TableWidget
          preview
          tool={{
            id: entry.target,
            kind: "table",
            name: entry.title.slice(0, 80),
            target: entry.target,
            history: tableHistory,
          }}
          update={(tool) => setTableHistory(tool.history)}
        />
      )}
      <Markdown
        onRoll={rollFormula}
        body={entry.body}
        all={all}
        open={open}
        pack={entry.pack ?? all.find((r) => r.target === entry.origin)?.pack}
        assets={importAssets.success ? importAssets.data : undefined}
      />
      {entry.kind === "item" && !!entry.fields.moreInfo && (
        <Markdown
          body={String(entry.fields.moreInfo)}
          all={all}
          open={open}
          onRoll={rollFormula}
          pack={entry.pack ?? all.find((r) => r.target === entry.origin)?.pack}
          assets={importAssets.success ? importAssets.data : undefined}
        />
      )}
      {!!entry.related.length && (
        <div className="related-rules">
          <h3>Related content</h3>
          {entry.related.map((r) => {
            const target =
              entry.pack && !r.includes("::")
                ? `${entry.pack.id}@${entry.pack.version}::${r}`
                : r;
            return (
              <button
                className="reference-link"
                key={r}
                onClick={() => open(target)}
              >
                {resolveEntry(all, target)?.title ?? r}
              </button>
            );
          })}
        </div>
      )}
      {entry.pack && (
        <details className="content-attribution">
          <summary>Source and attribution</summary>
          <p>{entry.pack.source.license}</p>
          {fromNexus && <NexusCredit />}
          {entry.pack.source.url && (
            <a
              href={entry.pack.source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {fromNexus ? "Nexus source" : "Source document"} ·{" "}
              {entry.pack.source.revision.slice(0, 7)}
            </a>
          )}
        </details>
      )}
      {!entry.pack && !importSource.success && fromNexus && (
        <details className="content-attribution">
          <summary>Source and attribution</summary>
          <NexusCredit />
        </details>
      )}
    </>
  );
}
export function ContentEditor({
  entry,
  done,
}: {
  entry: Entry;
  done: () => void;
}) {
  const { update, remove } = useContent();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  if (entry.kind === "table")
    return (
      <TableEditor
        initial={entry as ContentRecord}
        cancel={done}
        remove={() => remove(entry)}
        save={(record) => {
          update((campaign) => ({
            ...campaign,
            content: campaign.content.map((current) =>
              current.id === entry.id ? record : current,
            ),
          }));
          done();
        }}
      />
    );
  if (entry.kind === "item")
    return (
      <ItemEditor
        initial={entry as ContentRecord}
        cancel={done}
        save={(record) => {
          update((c) => ({
            ...c,
            content: c.content.map((r) => (r.id === entry.id ? record : r)),
          }));
          done();
        }}
        remove={() => {
          remove(entry);
        }}
      />
    );
  if (entry.kind === "encounter")
    return (
      <EncounterEditor
        initial={entry as ContentRecord}
        cancel={done}
        save={(record) => {
          update((c) => ({
            ...c,
            content: c.content.map((r) => (r.id === entry.id ? record : r)),
          }));
          done();
        }}
        remove={() => {
          remove(entry);
        }}
      />
    );
  if (entry.kind === "npc-generator")
    return (
      <GeneratorEditor
        title={entry.title}
        initial={generatorDefinitionSchema.parse(entry.fields)}
        cancel={done}
        save={(title, definition) => {
          update((c) => ({
            ...c,
            content: c.content.map((record) =>
              record.id === entry.id
                ? { ...record, title, fields: definition }
                : record,
            ),
          }));
          done();
        }}
      />
    );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget),
          title = String(data.get("title")).trim(),
          body = String(data.get("body")),
          tags = String(data.get("tags"))
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        try {
          update((c) => ({
            ...c,
            content: c.content.map((r) =>
              r.id === entry.id
                ? {
                    ...r,
                    title,
                    body,
                    tags,
                    fields: isCombatMonster(r)
                      ? {
                          ...r.fields,
                          hp: data.get("monsterHp")
                            ? Number(data.get("monsterHp"))
                            : undefined,
                          level: String(data.get("monsterLevel")),
                          armor: r.fields.hazard
                            ? undefined
                            : String(data.get("monsterArmor")),
                        }
                      : r.kind === "encounter"
                        ? {
                            ...r.fields,
                            heroCount: Number(data.get("heroCount")),
                            annotations: String(data.get("annotations")),
                          }
                        : r.fields,
                  }
                : r,
            ),
            tools: c.tools.map((t) =>
              t.id === entry.id && t.kind === "note"
                ? { ...t, name: title, body, tags }
                : t,
            ),
          }));
          done();
        } catch {
          setError("Unable to save. Use at most 30 tags and a shorter title.");
        }
      }}
    >
      <label>
        Content title
        <input
          name="title"
          defaultValue={entry.title}
          required
          maxLength={80}
        />
      </label>
      <label>
        Tags, separated by commas
        <input
          name="tags"
          defaultValue={entry.tags.join(", ")}
          maxLength={1000}
        />
      </label>
      {isCombatMonster(entry) && (
        <div className="form-grid">
          <label>
            {entry.fields.hazard ? "Hazard HP (optional)" : "Monster HP"}
            <input
              name="monsterHp"
              type="number"
              required={!entry.fields.hazard && !entry.fields.members}
              min={1}
              max={99999}
              defaultValue={
                entry.fields.hp === undefined
                  ? undefined
                  : Number(entry.fields.hp)
              }
            />
          </label>
          <label>
            {entry.fields.hazard ? "Hazard level" : "Monster level"}
            <input
              name="monsterLevel"
              required
              maxLength={40}
              defaultValue={String(entry.fields.level)}
            />
          </label>
          {!entry.fields.hazard && (
            <label>
              Monster armor
              <input
                name="monsterArmor"
                maxLength={80}
                defaultValue={String(entry.fields.armor ?? "none")}
              />
            </label>
          )}
        </div>
      )}
      <label>
        Markdown content
        <textarea
          name="body"
          defaultValue={entry.body}
          rows={14}
          maxLength={100000}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <div className="content-actions">
        <button className="primary">Save content</button>
        <button
          type="button"
          className="quiet danger"
          onClick={() => setDeleting(true)}
        >
          Delete content
        </button>
      </div>
      {deleting && (
        <div className="notice">
          <p>
            Delete this content? References will remain readable but unresolved.
            Note widgets will be removed.
          </p>
          <button
            type="button"
            className="secondary danger"
            onClick={() => {
              remove(entry);
            }}
          >
            Confirm delete content
          </button>
        </div>
      )}
    </form>
  );
}
export function ReferenceWidget({
  tool,
  choose,
}: {
  tool: Extract<Tool, { kind: "reference" }>;
  choose: () => void;
}) {
  const { all, open } = useContent();
  const entry = resolveEntry(all, tool.target);
  return (
    <div className="reference-widget">
      <div className="content-actions">
        <button className="quiet" onClick={choose}>
          Choose reference
        </button>
        {entry && (
          <button className="quiet" onClick={() => open(tool.target)}>
            Open preview
          </button>
        )}
      </div>
      {entry ? (
        <>
          <h3>{entry.title}</h3>
          <ReferenceBody entry={entry} />
        </>
      ) : (
        <p className="hint">
          {tool.target
            ? "This saved reference is unavailable. Choose another or restore its source."
            : "Choose a rule, spell, item, monster, hazard or note from your campaign library."}
        </p>
      )}
    </div>
  );
}
