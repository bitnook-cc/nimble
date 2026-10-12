"use client";

import { useState } from "react";

import { Character } from "@/lib/schemas/character";

import { Button } from "../ui/button";
import { CampaignProps, Field, Panel, formValues, inputClass, number, string, uid } from "./shared";

export function Inventory({
  view,
  userId,
  busy,
  command,
  characters,
}: CampaignProps & { characters: Character[] }) {
  const me = view.members.find((m) => m.userId === userId);
  const local = characters.find((c) => c.id === me?.characterId);
  const conflict = !!local && (local._inventoryRevision || 0) !== me?.inventoryRevision;
  const [recipient, setRecipient] = useState(userId);
  const target = view.members.find((m) => m.userId === recipient);
  const ownInventory = me?.character?.inventory as Character["inventory"] | undefined;
  const [newIds, setNewIds] = useState(() => ({ entry: uid(), item: uid() }));
  const [editId, setEditId] = useState<string | null>(null);
  const edit = view.state.items.find((i) => i.id === editId);
  return (
    <div className="space-y-6">
      <Panel title="Party treasury">
        <p className="text-2xl font-semibold">
          {view.state.treasury.gold} gold <span className="text-muted-foreground">·</span>{" "}
          {view.state.treasury.silver} silver
        </p>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={async (e) => {
            const d = formValues(e);
            await command({
              type: "currency",
              direction: string(d, "direction") as "claim" | "deposit" | "award",
              userId: recipient,
              currency: string(d, "currency") as "gold" | "silver",
              amount: number(d, "amount"),
              inventoryRevision: target?.inventoryRevision || 0,
            });
          }}
        >
          <Field label="Amount">
            <input
              className={inputClass}
              name="amount"
              type="number"
              min="1"
              max="1000000"
              defaultValue="1"
              required
            />
          </Field>
          <Field label="Currency">
            <select className={inputClass} name="currency">
              <option>gold</option>
              <option>silver</option>
            </select>
          </Field>
          <Field label="Action">
            <select className={inputClass} name="direction">
              <option value="claim">Withdraw to character</option>
              {recipient === userId && <option value="deposit">Deposit from character</option>}
              {view.isGM && <option value="award">GM: add party treasure</option>}
            </select>
          </Field>
          <Button disabled={busy || conflict}>Confirm currency transfer</Button>
        </form>
      </Panel>
      <Panel title="Party stash">
        <p className="text-sm text-muted-foreground">
          Transfers are saved online. A character owner reviews their updated inventory before their
          next sync. The activity log records deposits and claims.
        </p>
        {view.isGM && (
          <Field label="Give items or currency to">
            <select
              className={inputClass}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            >
              {view.members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name}
                  {!m.characterId ? " (no character)" : ""}
                </option>
              ))}
            </select>
          </Field>
        )}
        {!view.state.items.length && (
          <p className="text-sm text-muted-foreground">
            The stash is empty. Deposit a character item or add GM treasure.
          </p>
        )}
        {view.state.items.map((entry) => (
          <div key={entry.id} className="border-t pt-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-40">
              <h3 className="font-medium">
                {entry.item.name} × {entry.quantity}
                {entry.hidden ? " · GM only" : ""}
              </h3>
              <p className="text-sm text-muted-foreground">
                {entry.location} · {entry.item.type} · size {entry.item.size}
              </p>
              <p className="text-sm">{entry.item.description}</p>
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={async (e) => {
                const d = formValues(e);
                await command({
                  type: "transfer",
                  direction: "claim",
                  userId: recipient,
                  itemId: entry.id,
                  quantity: number(d, "quantity"),
                  inventoryRevision: target?.inventoryRevision || 0,
                });
              }}
            >
              <input
                aria-label={`Quantity of ${entry.item.name} to claim`}
                name="quantity"
                type="number"
                min="1"
                max={entry.quantity}
                defaultValue="1"
                className={`${inputClass} max-w-20`}
              />
              <Button disabled={busy || conflict || !target?.characterId}>Claim</Button>
            </form>
            {view.isGM && (
              <>
                <Button variant="outline" onClick={() => setEditId(entry.id)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`Remove ${entry.item.name} from the stash?`))
                      void command({ type: "delete", collection: "items", id: entry.id });
                  }}
                >
                  Remove
                </Button>
              </>
            )}
          </div>
        ))}
      </Panel>
      {ownInventory && (
        <Panel title="Deposit from your character">
          {ownInventory.items.length ? (
            ownInventory.items.map((item) => (
              <form
                key={item.id}
                className="flex flex-wrap gap-3 items-center"
                onSubmit={async (e) => {
                  const d = formValues(e);
                  await command({
                    type: "transfer",
                    direction: "deposit",
                    userId,
                    itemId: item.id,
                    quantity: number(d, "quantity"),
                    inventoryRevision: me!.inventoryRevision,
                  });
                }}
              >
                <span className="flex-1">{item.name}</span>
                <input
                  aria-label={`Quantity of ${item.name} to deposit`}
                  className={`${inputClass} max-w-20`}
                  name="quantity"
                  type="number"
                  min="1"
                  max={"count" in item ? item.count : 1}
                  defaultValue="1"
                />
                <Button variant="outline" disabled={busy || conflict}>
                  Deposit
                </Button>
              </form>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Your synced inventory is empty.</p>
          )}
        </Panel>
      )}
      {view.isGM && (
        <Panel title={edit ? "Edit supplies" : "Add GM treasure"}>
          <form
            key={edit?.id || newIds.entry}
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              const d = formValues(e);
              const type = string(d, "type") as "freeform" | "consumable" | "weapon" | "armor";
              const ok = await command({
                type: "stash",
                entry: {
                  id: edit?.id || newIds.entry,
                  item: {
                    ...edit?.item,
                    id: edit?.item.id || newIds.item,
                    name: string(d, "name"),
                    type,
                    size: number(d, "size"),
                    description: string(d, "description"),
                    ...(type === "weapon" ? { damage: string(d, "damage") } : {}),
                    ...(type === "armor" ? { armor: number(d, "armor") } : {}),
                  },
                  quantity: number(d, "quantity"),
                  location: string(d, "location"),
                  hidden: d.has("hidden"),
                },
              });
              if (ok) {
                setEditId(null);
                setNewIds({ entry: uid(), item: uid() });
              }
            }}
          >
            <Field label="Name">
              <input
                className={inputClass}
                name="name"
                maxLength={120}
                defaultValue={edit?.item.name}
                required
              />
            </Field>
            <Field label="Type">
              <select
                className={inputClass}
                name="type"
                defaultValue={edit?.item.type || "freeform"}
              >
                {["freeform", "consumable", "ammunition", "weapon", "armor"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input
                className={inputClass}
                name="quantity"
                type="number"
                min="1"
                max="999"
                defaultValue={edit?.quantity || 1}
                required
              />
            </Field>
            <Field label="Size per item">
              <input
                className={inputClass}
                name="size"
                type="number"
                min="0"
                max="1000"
                defaultValue={edit?.item.size || 0}
                required
              />
            </Field>
            <Field label="Location or custodian">
              <input
                className={inputClass}
                name="location"
                defaultValue={edit?.location || "Party stash"}
                maxLength={120}
                required
              />
            </Field>
            <Field label="Weapon damage formula">
              <input
                className={inputClass}
                name="damage"
                defaultValue={edit?.item.damage}
                maxLength={100}
                placeholder="For weapons only"
              />
            </Field>
            <Field label="Armor">
              <input
                className={inputClass}
                name="armor"
                type="number"
                min="0"
                max="100"
                defaultValue={edit?.item.armor || 0}
              />
            </Field>
            <Field label="Description">
              <textarea
                className={inputClass}
                name="description"
                defaultValue={edit?.item.description}
                maxLength={10000}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input name="hidden" type="checkbox" defaultChecked={edit?.hidden} />
              GM only until revealed
            </label>
            <div className="flex gap-2">
              <Button disabled={busy}>Save supplies</Button>
              {edit && (
                <Button type="button" variant="outline" onClick={() => setEditId(null)}>
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        </Panel>
      )}
    </div>
  );
}
