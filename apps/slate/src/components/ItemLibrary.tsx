import { useState } from "react";
import { useContent } from "./ContentWorkspace";
import { searchContent } from "../content";
import { itemFieldsSchema, rarities } from "../item-schema";
import { type ContentRecord } from "../content-schema";
import { uid, type ItemLibraryTool } from "../model";
import { Modal } from "./Modal";
import { ItemEditor } from "./ItemEditor";
import { ExchangeDialog } from "./ExchangeDialog";

export function ItemLibrary({
  tool,
  updateTool,
}: {
  tool?: ItemLibraryTool;
  updateTool?: (fn: (tool: ItemLibraryTool) => ItemLibraryTool) => void;
}) {
  const { all, campaign, update, open, pin } = useContent();
  const [localFilter, setLocalFilter] = useState<ItemLibraryTool["filter"]>({
    query: "",
    type: "all",
    rarity: "all",
    favouritesOnly: false,
  });
  const filter = tool?.filter ?? localFilter;
  const setFilter = (next: typeof filter) =>
    updateTool
      ? updateTool((t) => ({ ...t, filter: next }))
      : setLocalFilter(next);
  const [editing, setEditing] = useState<ContentRecord | "new" | null>(null);
  const [exchange, setExchange] = useState(false);
  const [limit, setLimit] = useState(40);
  const [error, setError] = useState("");
  const favourites = campaign.itemFavourites;
  const items = searchContent(all, filter.query, "item").filter((entry) => {
    const f = itemFieldsSchema.parse(entry.fields);
    return (
      (filter.type === "all" || f.kind === filter.type) &&
      (filter.rarity === "all" || f.rarity === filter.rarity) &&
      (!filter.favouritesOnly || favourites.includes(entry.target))
    );
  });
  return (
    <div className="item-library">
      <label>
        Search items
        <input
          type="search"
          value={filter.query}
          onChange={(e) => {
            setFilter({ ...filter, query: e.target.value });
            setLimit(40);
          }}
          placeholder="Name, tags or description…"
        />
      </label>
      <div className="form-grid">
        <label>
          Item type filter
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          >
            <option value="all">All types</option>
            {[
              ...new Set(
                all
                  .filter((e) => e.kind === "item")
                  .map((e) => itemFieldsSchema.parse(e.fields).kind),
              ),
            ]
              .sort()
              .filter(Boolean)
              .map((type) => (
                <option key={type}>{type}</option>
              ))}
          </select>
        </label>
        <label>
          Item rarity filter
          <select
            value={filter.rarity}
            onChange={(e) =>
              setFilter({
                ...filter,
                rarity: e.target.value as typeof filter.rarity,
              })
            }
          >
            <option value="all">All rarities</option>
            {rarities.map((r) => (
              <option value={r} key={r}>
                {r.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={filter.favouritesOnly}
          onChange={(e) =>
            setFilter({ ...filter, favouritesOnly: e.target.checked })
          }
        />
        Favourites only
      </label>
      <div className="content-actions">
        <button
          className="secondary"
          disabled={campaign.content.length >= 1000}
          onClick={() => setEditing("new")}
        >
          New item
        </button>
        <button className="quiet" onClick={() => setExchange(true)}>
          Import / export items
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <p className="hint">{items.length} items · available offline</p>
      <ul className="monster-results" aria-label="Item search results">
        {items.slice(0, limit).map((entry) => {
          const fields = itemFieldsSchema.parse(entry.fields);
          return (
            <li key={entry.target}>
              <button
                className="monster-result-title"
                onClick={() => open(entry.target)}
                aria-label={`Preview ${entry.title}`}
              >
                <strong>{entry.title}</strong>
                <small>
                  {fields.kind || "Item"} · {fields.rarity.replaceAll("_", " ")}
                </small>
                <small>{entry.tags.join(" · ")}</small>
              </button>
              <div className="content-actions">
                <button
                  className="quiet"
                  aria-label={`Favourite ${entry.title}`}
                  aria-pressed={favourites.includes(entry.target)}
                  disabled={
                    !favourites.includes(entry.target) &&
                    favourites.length >= 3000
                  }
                  onClick={() =>
                    update((c) => ({
                      ...c,
                      itemFavourites: c.itemFavourites.includes(entry.target)
                        ? c.itemFavourites.filter((t) => t !== entry.target)
                        : [...c.itemFavourites, entry.target],
                    }))
                  }
                >
                  ☆
                </button>
                <button
                  className="quiet"
                  aria-label={`Pin ${entry.title}`}
                  onClick={() => pin(entry)}
                >
                  Pin
                </button>
                {!entry.pack && (
                  <button
                    className="quiet"
                    aria-label={`Edit ${entry.title}`}
                    onClick={() => setEditing(entry as ContentRecord)}
                  >
                    Edit
                  </button>
                )}
                <button
                  className="quiet"
                  aria-label={`Duplicate ${entry.title}`}
                  disabled={campaign.content.length >= 1000}
                  onClick={() => {
                    try {
                      const copy = {
                        ...entry,
                        id: uid(),
                        title: entry.title.slice(0, 153) + " (copy)",
                        origin: entry.target,
                      };
                      update((c) => ({
                        ...c,
                        content: [...c.content, copy as ContentRecord],
                      }));
                    } catch (error) {
                      setError(
                        error instanceof Error
                          ? error.message
                          : "Unable to duplicate item.",
                      );
                    }
                  }}
                >
                  Copy
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {!items.length && (
        <p className="hint">No matching items. Create one or import content.</p>
      )}
      {items.length > limit && (
        <button className="quiet" onClick={() => setLimit((n) => n + 40)}>
          Show more items
        </button>
      )}
      {editing && (
        <Modal
          title={editing === "new" ? "New item" : "Edit item"}
          onClose={() => setEditing(null)}
          wide
        >
          <ItemEditor
            initial={editing === "new" ? undefined : editing}
            cancel={() => setEditing(null)}
            save={(record) => {
              update((c) => ({
                ...c,
                content: c.content.some((r) => r.id === record.id)
                  ? c.content.map((r) => (r.id === record.id ? record : r))
                  : [...c.content, record],
              }));
              if (editing === "new") {
                setFilter({
                  query: record.title,
                  type: "all",
                  rarity: "all",
                  favouritesOnly: false,
                });
                setLimit(40);
              } else if (filter.query)
                setFilter({ ...filter, query: record.title });
              setEditing(null);
            }}
            remove={
              editing === "new"
                ? undefined
                : () => {
                    update((c) => ({
                      ...c,
                      content: c.content.filter((r) => r.id !== editing.id),
                    }));
                    setEditing(null);
                  }
            }
          />
        </Modal>
      )}
      {exchange && (
        <ExchangeDialog
          onClose={() => setExchange(false)}
          initialRecords={items.map((e) => e as ContentRecord)}
        />
      )}
    </div>
  );
}
