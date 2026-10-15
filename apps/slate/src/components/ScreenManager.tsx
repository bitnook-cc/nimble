import { useState } from "react";
import { ArrowUp, ArrowDown, Check } from "lucide-react";
import { Modal } from "./Modal";
import {
  builtInPresets,
  createScreen,
  createWorldScreen,
  duplicateScreen,
  savePreset,
} from "../screens";
import type { Campaign } from "../model";

export function ScreenManager({
  campaign,
  update,
  onClose,
}: {
  campaign: Campaign;
  update: (fn: (c: Campaign) => Campaign) => void;
  onClose: () => void;
}) {
  const current = campaign.screens.find(
    (s) => s.id === campaign.activeScreenId,
  )!;
  const [error, setError] = useState("");
  const [screenType, setScreenType] = useState("grid");
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState("");
  function apply(fn: (c: Campaign) => Campaign, message = "") {
    try {
      update(fn);
      setError("");
      setMessage(message);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    }
  }
  return (
    <Modal title="Campaign screens" onClose={onClose}>
      <p className="hint">
        Dashboards arrange widgets. World-editor tabs explore the campaign's
        shared notes and relationships.
      </p>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <div className="screen-list">
        {campaign.screens.map((s, index) => (
          <div className="campaign-row" key={s.id}>
            <button
              className={s.id === current.id ? "selected" : ""}
              onClick={() => {
                if (apply((c) => ({ ...c, activeScreenId: s.id }))) onClose();
              }}
            >
              {s.name}
              {s.id === current.id && <Check size={15} />}
            </button>
            <button
              className="icon-button"
              aria-label={`Move screen ${s.name} up`}
              disabled={index === 0}
              onClick={() =>
                apply((c) => {
                  const screens = [...c.screens];
                  [screens[index - 1], screens[index]] = [
                    screens[index],
                    screens[index - 1],
                  ];
                  return { ...c, screens };
                })
              }
            >
              <ArrowUp size={15} />
            </button>
            <button
              className="icon-button"
              aria-label={`Move screen ${s.name} down`}
              disabled={index === campaign.screens.length - 1}
              onClick={() =>
                apply((c) => {
                  const screens = [...c.screens];
                  [screens[index + 1], screens[index]] = [
                    screens[index],
                    screens[index + 1],
                  ];
                  return { ...c, screens };
                })
              }
            >
              <ArrowDown size={15} />
            </button>
          </div>
        ))}
      </div>
      <form
        key={current.id}
        onSubmit={(e) => {
          e.preventDefault();
          const name = String(new FormData(e.currentTarget).get("name")).trim();
          if (name)
            apply(
              (c) => ({
                ...c,
                screens: c.screens.map((s) =>
                  s.id === current.id ? { ...s, name } : s,
                ),
              }),
              "Screen renamed.",
            );
        }}
      >
        <label>
          Screen name
          <input
            name="name"
            defaultValue={current.name}
            maxLength={80}
            required
          />
        </label>
        <button className="secondary">Rename screen</button>
      </form>
      <div className="campaign-actions">
        <button
          className="secondary"
          disabled={campaign.screens.length >= 20}
          onClick={() => {
            if (
              apply(
                (c) => duplicateScreen(c, current.id),
                "Screen duplicated; its tools are shared.",
              )
            )
              setRemoving(false);
          }}
        >
          Duplicate screen
        </button>
        <button
          className="quiet danger"
          disabled={campaign.screens.length === 1}
          title="Keep at least one screen"
          onClick={() => setRemoving(true)}
        >
          Delete screen
        </button>
      </div>
      {removing && (
        <div className="confirmation-panel">
          <p>
            Delete “{current.name}”? Its tools remain in the campaign. The
            screen and its layout history will be removed.
          </p>
          <div className="campaign-actions">
            <button className="secondary" onClick={() => setRemoving(false)}>
              Cancel
            </button>
            <button
              className="secondary danger"
              onClick={() => {
                apply((c) => {
                  const screens = c.screens.filter((s) => s.id !== current.id);
                  return { ...c, screens, activeScreenId: screens[0].id };
                }, "Screen removed; its tools are still available.");
                setRemoving(false);
              }}
            >
              Confirm delete screen
            </button>
          </div>
        </div>
      )}
      <form
        className="new-campaign-form"
        onSubmit={(e) => {
          e.preventDefault();
          const fields = new FormData(e.currentTarget);
          const name = String(fields.get("name")).trim();
          const preset = [...builtInPresets, ...campaign.layoutPresets].find(
            (p) => p.id === fields.get("preset"),
          )!;
          if (
            name &&
            apply((c) =>
              screenType === "world"
                ? createWorldScreen(c, name)
                : createScreen(c, name, preset),
            )
          )
            onClose();
        }}
      >
        <label>
          Tab type
          <select
            value={screenType}
            onChange={(event) => setScreenType(event.target.value)}
          >
            <option value="grid">Dashboard</option>
            <option value="world">World editor</option>
          </select>
        </label>
        <label>
          New screen name
          <input
            name="name"
            required
            maxLength={80}
            placeholder="Exploration, Combat, Town…"
          />
        </label>
        {screenType === "grid" && (
          <label>
            Layout preset
            <select name="preset" defaultValue="blank">
              {[...builtInPresets, ...campaign.layoutPresets].map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <p className="hint">
          Presets create fresh tools. Duplicate a screen to reuse its existing
          tools.
        </p>
        <button className="primary" disabled={campaign.screens.length >= 20}>
          Create screen
        </button>
      </form>
      {current.kind !== "world" && (
        <form
          className="new-campaign-form"
          onSubmit={(e) => {
            e.preventDefault();
            const name = String(
              new FormData(e.currentTarget).get("name"),
            ).trim();
            if (
              name &&
              apply(
                (c) => savePreset(c, current.id, name),
                "Layout preset saved without combat or roll history.",
              )
            )
              e.currentTarget.reset();
          }}
        >
          <label>
            Save current layout as preset
            <input
              name="name"
              maxLength={80}
              required
              placeholder="Preset name"
            />
          </label>
          <button
            className="secondary"
            disabled={campaign.layoutPresets.length >= 20}
          >
            Save layout preset
          </button>
        </form>
      )}
      {campaign.layoutPresets.map((p) => (
        <div className="attachment-row" key={p.id}>
          <span>{p.name}</span>
          <button
            className="quiet danger"
            aria-label={`Remove preset ${p.name}`}
            onClick={() =>
              apply((c) => ({
                ...c,
                layoutPresets: c.layoutPresets.filter(
                  (item) => item.id !== p.id,
                ),
              }))
            }
          >
            Remove
          </button>
        </div>
      ))}
    </Modal>
  );
}
