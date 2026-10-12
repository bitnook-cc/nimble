import { useState } from "react";
import { itemFieldsSchema, rarities } from "../item-schema";
import { recordSchema, type ContentRecord } from "../content-schema";
import { uid } from "../model";

export function ItemEditor({
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
  const fields = itemFieldsSchema.parse(initial?.fields ?? {});
  const [properties, setProperties] = useState(() =>
    Object.entries(fields.properties).map(([key, value]) => ({
      id: uid(),
      key,
      value,
    })),
  );
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        try {
          const data = new FormData(event.currentTarget);
          const optional = (key: string) =>
            String(data.get(key) ?? "").trim() || undefined;
          const amount = optional("price");
          const pairs = properties.map((p) => [p.key.trim(), p.value] as const);
          if (
            pairs.some(([key]) => !key) ||
            new Set(pairs.map(([key]) => key)).size !== pairs.length
          )
            throw new Error("Give each property a unique name.");
          const props = Object.fromEntries(pairs);
          const next = itemFieldsSchema.parse({
            kind: data.get("kind"),
            rarity: data.get("rarity"),
            moreInfo: data.get("moreInfo"),
            price:
              amount === undefined
                ? undefined
                : { amount: Number(amount), currency: data.get("currency") },
            slots:
              optional("slots") === undefined
                ? undefined
                : Number(data.get("slots")),
            uses:
              optional("uses") === undefined
                ? undefined
                : Number(data.get("uses")),
            damage: optional("damage"),
            armor: optional("armor"),
            properties: props,
          });
          save(
            recordSchema.parse({
              ...initial,
              id: initial?.id ?? uid(),
              kind: "item",
              title: data.get("title"),
              body: data.get("body"),
              tags: String(data.get("tags"))
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
              category: String(data.get("category")),
              sources: initial?.sources ?? [],
              related: initial?.related ?? [],
              fields: { ...initial?.fields, ...next },
            }),
          );
        } catch (error) {
          setError(
            error instanceof Error ? error.message : "Unable to save item.",
          );
        }
      }}
    >
      <div className="form-grid">
        <label>
          Item name
          <input
            name="title"
            required
            maxLength={160}
            defaultValue={initial?.title}
          />
        </label>
        <label>
          Item type
          <input
            name="kind"
            maxLength={160}
            defaultValue={fields.kind}
            placeholder="Weapon, armor, potion…"
          />
        </label>
        <label>
          Rarity
          <select name="rarity" defaultValue={fields.rarity}>
            {rarities.map((r) => (
              <option key={r} value={r}>
                {r.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <input
            name="category"
            maxLength={160}
            defaultValue={initial?.category ?? "Campaign items"}
          />
        </label>
      </div>
      <label>
        Item tags
        <input
          name="tags"
          maxLength={2000}
          defaultValue={initial?.tags.join(", ")}
          placeholder="Comma-separated tags"
        />
      </label>
      <label>
        Description (Markdown)
        <textarea
          name="body"
          rows={6}
          maxLength={100000}
          defaultValue={initial?.body}
        />
      </label>
      <label>
        Additional information
        <textarea
          name="moreInfo"
          rows={3}
          maxLength={100000}
          defaultValue={fields.moreInfo}
        />
      </label>
      <details open>
        <summary>Optional mechanics</summary>
        <p className="hint">
          Leave unknown values empty. These describe the item, not an owned
          stack.
        </p>
        <div className="form-grid">
          <label>
            Price
            <input
              name="price"
              type="number"
              min="0"
              max="1000000000"
              step="any"
              defaultValue={fields.price?.amount}
            />
          </label>
          <label>
            Currency
            <input
              name="currency"
              maxLength={40}
              defaultValue={fields.price?.currency ?? "gp"}
            />
          </label>
          <label>
            Inventory slots
            <input
              name="slots"
              type="number"
              min="0"
              max="99999"
              step="any"
              defaultValue={fields.slots}
            />
          </label>
          <label>
            Uses (capacity)
            <input
              name="uses"
              type="number"
              min="0"
              max="99999"
              defaultValue={fields.uses}
            />
          </label>
          <label>
            Damage formula
            <input
              name="damage"
              maxLength={1000}
              defaultValue={fields.damage}
            />
          </label>
          <label>
            Armor information
            <input name="armor" maxLength={160} defaultValue={fields.armor} />
          </label>
        </div>
        <h3>Custom properties</h3>
        {properties.map((property, index) => (
          <div className="item-property-row" key={property.id}>
            <label>
              Property name {index + 1}
              <input
                required
                maxLength={100}
                value={property.key}
                onChange={(e) =>
                  setProperties((rows) =>
                    rows.map((p) =>
                      p.id === property.id ? { ...p, key: e.target.value } : p,
                    ),
                  )
                }
              />
            </label>
            <label>
              Property value {index + 1}
              <input
                maxLength={2000}
                value={property.value}
                onChange={(e) =>
                  setProperties((rows) =>
                    rows.map((p) =>
                      p.id === property.id
                        ? { ...p, value: e.target.value }
                        : p,
                    ),
                  )
                }
              />
            </label>
            <button
              type="button"
              className="quiet danger"
              aria-label={"Remove property " + (index + 1)}
              onClick={() =>
                setProperties((rows) =>
                  rows.filter((p) => p.id !== property.id),
                )
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="secondary"
          disabled={properties.length >= 100}
          onClick={() =>
            setProperties((rows) => [
              ...rows,
              { id: uid(), key: "", value: "" },
            ])
          }
        >
          Add property
        </button>
      </details>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <div className="content-actions">
        <button className="primary">Save item</button>
        <button type="button" className="secondary" onClick={cancel}>
          Cancel
        </button>
        {remove && (
          <button
            type="button"
            className="quiet danger"
            onClick={() => setDeleting(true)}
          >
            Delete item
          </button>
        )}
      </div>
      {deleting && (
        <div className="notice">
          <p>
            Delete this item? Existing references will remain but may be
            unresolved.
          </p>
          <button type="button" className="secondary danger" onClick={remove}>
            Confirm delete item
          </button>
          <button
            type="button"
            className="quiet"
            onClick={() => setDeleting(false)}
          >
            Keep item
          </button>
        </div>
      )}
    </form>
  );
}
