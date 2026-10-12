import { WidgetIcon } from "./WidgetIcon";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "./Modal";
import { widgetTypes } from "../widgets";
import type { Campaign, Tool, Widget } from "../model";

export function WidgetCatalogue({
  campaign,
  origin,
  error,
  add,
  onClose,
}: {
  campaign: Campaign;
  origin: { x: number; y: number } | null;
  error: string;
  add: (kind: Widget["kind"], existing?: Tool) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const query = search.trim().toLowerCase();
  const matches = (text: string) => text.toLowerCase().includes(query);
  const kinds = (Object.keys(widgetTypes) as Widget["kind"][]).filter((kind) =>
    matches(
      [
        widgetTypes[kind].title,
        widgetTypes[kind].description,
        widgetTypes[kind].keywords,
      ].join(" "),
    ),
  );
  const saved = campaign.tools.filter((t) =>
    matches(
      `${t.name} ${widgetTypes[t.kind].title} ${t.kind === "initiative" ? t.run.name : ""}`,
    ),
  );
  const visibleNew = filter !== "saved" && kinds.length > 0;
  const visibleSaved = filter !== "new" && saved.length > 0;
  return (
    <Modal title="Add a widget" onClose={onClose}>
      <p className="hint">
        {origin
          ? `Start at column ${origin.x + 1}, row ${origin.y + 1}.`
          : "Choose a tool for the next free cells."}{" "}
        New tools start empty; saved tools share their state across views.
      </p>
      <label className="field-label">
        Search widgets
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, type or purpose…"
          autoFocus
        />
      </label>
      <div className="campaign-tabs" role="group" aria-label="Catalogue filter">
        {[
          ["all", "All"],
          ["new", "New tools"],
          ["saved", "Saved tools"],
        ].map(([value, label]) => (
          <button
            key={value}
            className="secondary"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {visibleNew &&
        ["Combat", "Content", "Generators", "Utilities"].map((category) => {
          const entries = kinds.filter(
            (kind) => widgetTypes[kind].category === category,
          );
          return (
            entries.length > 0 && (
              <section key={category}>
                <h3>{category}</h3>
                <div className="widget-catalog">
                  {entries.map((kind) => (
                    <button key={kind} onClick={() => add(kind)}>
                      <WidgetIcon kind={kind} size={22} />
                      <span>
                        <strong>{widgetTypes[kind].title}</strong>
                        <small>{widgetTypes[kind].description}</small>
                      </span>
                      <Plus size={16} />
                    </button>
                  ))}
                </div>
              </section>
            )
          );
        })}
      {visibleSaved && (
        <section>
          <h3>Saved tools</h3>
          <p className="hint">
            Add another view of an existing tool. Changes appear everywhere it
            is used.
          </p>
          {saved.map((t) => (
            <button
              className="saved-tool"
              key={t.id}
              onClick={() => add(t.kind, t)}
            >
              <span>
                {t.name}
                {t.kind === "dice"
                  ? ` · ${t.rolls.length} rolls`
                  : t.kind === "initiative"
                    ? ` · ${t.run.name}`
                    : ""}
                <small>
                  {
                    campaign.screens.filter((s) =>
                      s.widgets.some((w) => w.toolId === t.id),
                    ).length
                  }{" "}
                  screens · {widgetTypes[t.kind].title}
                </small>
              </span>
              <Plus size={16} />
            </button>
          ))}
        </section>
      )}
      {!visibleNew && !visibleSaved && (
        <p role="status" className="hint">
          No matching tools. Try a different search.
        </p>
      )}
    </Modal>
  );
}
