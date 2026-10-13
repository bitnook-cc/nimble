import {
  ContentProvider,
  ReferenceWidget,
} from "./components/ContentWorkspace";
import { CommandPalette } from "./components/CommandPalette";
import { WorkspaceStatus } from "./components/WorkspaceStatus";
import { NpcGenerator } from "./components/NpcGenerator";
import { NoteWidget } from "./components/NoteWidget";
import { UtilityWidget } from "./components/UtilityWidget";
import { utilityKinds } from "./utility-schema";
import { applyToolUpdate, advanceCampaign } from "./utilities";
import { ItemLibrary } from "./components/ItemLibrary";
import { ContentLibrary } from "./components/ContentLibrary";
import { EncounterLibrary } from "./components/EncounterLibrary";
import type { Entry } from "./content";
import { BookOpen } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { registerSW } from "virtual:pwa-register";
import { Capacitor } from "@capacitor/core";
import {
  Check,
  ChevronDown,
  Download,
  Grid2X2,
  Monitor,
  Moon,
  Settings2,
  Sun,
  X,
  Undo2,
  Redo2,
  Search,
  Users,
  Swords,
} from "lucide-react";
import { CampaignManager } from "./components/CampaignManager";
import { PartyManager } from "./components/PartyManager";
import { LocalDataRecovery } from "./components/LocalDataRecovery";
import { appStore } from "./storage";
import {
  canPlace,
  defaultSpan,
  gridSchema,
  newTool,
  uid,
  type Campaign,
  type DiceTool,
  type InitiativeTool,
  type Tool,
  type Widget,
} from "./model";
import { ScreenManager } from "./components/ScreenManager";
import { ScreenNavigation } from "./components/ScreenNavigation";
import { fitWidget } from "./widgets";
import { WidgetCatalogue } from "./components/WidgetCatalogue";
import { ToolSettings } from "./components/ToolSettings";
import { editScreen, undoLayout } from "./screens";
import type { Layout } from "./model";
import { Board } from "./components/Board";
import { Modal } from "./components/Modal";
import { DiceRoller } from "./components/DiceRoller";
import { getDialogOpener } from "./dialog-focus";
import { InitiativeTracker } from "./components/InitiativeTracker";

function exportData(data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `slate-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const snapshot = useSyncExternalStore(
    appStore.subscribe,
    appStore.getSnapshot,
  );
  const [arranging, setArranging] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteOpener = useRef<HTMLElement | null>(null);
  function openPalette() {
    paletteOpener.current = getDialogOpener();
    setPaletteOpen(true);
  }
  function closePalette() {
    setPaletteOpen(false);
    requestAnimationFrame(() => {
      if (paletteOpener.current?.isConnected) paletteOpener.current.focus();
    });
  }
  const [dialog, setDialog] = useState<
    | "add"
    | "grid"
    | "campaign"
    | "appearance"
    | "screens"
    | "library"
    | "party"
    | "encounters"
    | null
  >(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [configureId, setConfigureId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState("");
  const [offlineReady, setOfflineReady] = useState(
    Capacitor.isNativePlatform(),
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [applyUpdate, setApplyUpdate] = useState<
    ((reload?: boolean) => Promise<void>) | null
  >(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    void appStore.init();
  }, []);
  useEffect(() => {
    if (import.meta.env.PROD && !Capacitor.isNativePlatform()) {
      const update = registerSW({
        onOfflineReady: () => setOfflineReady(true),
        onNeedRefresh: () => setUpdateAvailable(true),
        onRegisteredSW: (_url, registration) => {
          if (registration?.active) setOfflineReady(true);
        },
        onRegisterError: () =>
          setNotice(
            "Offline installation is unavailable. Local data still saves; keep this tab open until you can install the app.",
          ),
      });
      setApplyUpdate(() => update);
    }
  }, []);
  const data = snapshot.data;
  const activeCampaignId = data?.activeCampaignId;
  useEffect(() => {
    setPaletteOpen(false);
    setConfigureId(null);
  }, [activeCampaignId]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const isP = event.code === "KeyP" || event.key.toLowerCase() === "p";
      const modifier =
        (event.altKey && !event.metaKey && !event.ctrlKey) ||
        (event.metaKey && !event.altKey && !event.ctrlKey);
      if (
        !activeCampaignId ||
        !isP ||
        !modifier ||
        event.shiftKey ||
        event.isComposing
      )
        return;
      event.preventDefault();
      if (event.repeat) return;
      if (paletteOpen) closePalette();
      else if (!snapshot.busy && !snapshot.conflict) openPalette();
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [activeCampaignId, paletteOpen, snapshot.busy, snapshot.conflict]);
  useEffect(() => {
    if (!data) return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        data.appearance === "system"
          ? media.matches
            ? "dark"
            : "light"
          : data.appearance;
      document.documentElement.dataset.palette = data.palette;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [data?.appearance, data?.palette]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      const state = appStore.getSnapshot();
      if (state.busy || (state.data && state.status !== "saved"))
        event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  if (!data)
    return <LocalDataRecovery error={snapshot.error} busy={snapshot.busy} />;
  const campaign = data.campaigns.find((c) => c.id === data.activeCampaignId)!;
  if (!campaign)
    return (
      <main className="loading-screen" aria-label="Campaigns">
        <h1>Choose your next adventure</h1>
        <p>Create a campaign, restore an archived one, or import a backup.</p>
        <button className="primary" onClick={() => setDialog("campaign")}>
          Manage campaigns
        </button>
        {snapshot.error && <p role="alert">{snapshot.error}</p>}
        {dialog === "campaign" && (
          <CampaignManager
            data={data}
            locked={snapshot.busy || snapshot.conflict}
            onClose={() => setDialog(null)}
          />
        )}
      </main>
    );
  const changeCampaign = (fn: (campaign: Campaign) => Campaign) =>
    appStore.update((current) => ({
      ...current,
      campaigns: current.campaigns.map((c) =>
        c.id === campaign.id ? fn(c) : c,
      ),
    }));
  const screen = campaign.screens.find(
    (s) => s.id === campaign.activeScreenId,
  )!;
  const changeLayout = (fn: (layout: Layout) => Layout) =>
    changeCampaign((c) => editScreen(c, screen.id, fn));
  function updateTool(id: string, fn: (tool: Tool) => Tool) {
    changeCampaign((c) => applyToolUpdate(c, id, fn));
  }
  function renderTool(tool: Tool) {
    if (utilityKinds.includes(tool.kind as (typeof utilityKinds)[number]))
      return (
        <UtilityWidget tool={tool} update={(fn) => updateTool(tool.id, fn)} />
      );
    if (tool.kind === "dice")
      return (
        <DiceRoller
          tool={tool}
          update={(fn) =>
            updateTool(tool.id, (t) =>
              t.kind === "dice" ? fn(t as DiceTool) : t,
            )
          }
        />
      );
    if (tool.kind === "npc")
      return (
        <NpcGenerator
          tool={tool}
          update={(fn) =>
            updateTool(tool.id, (t) => (t.kind === "npc" ? fn(t) : t))
          }
          canSaveNote={campaign.tools.length < 1000}
          saveNote={(note) =>
            changeCampaign((c) => ({ ...c, tools: [...c.tools, note] }))
          }
        />
      );
    if (tool.kind === "note")
      return (
        <NoteWidget
          tool={tool}
          update={(fn) =>
            updateTool(tool.id, (t) => (t.kind === "note" ? fn(t) : t))
          }
        />
      );
    if (tool.kind === "items")
      return (
        <ItemLibrary
          tool={tool}
          updateTool={(fn) =>
            updateTool(tool.id, (t) => (t.kind === "items" ? fn(t) : t))
          }
        />
      );
    if (tool.kind === "reference")
      return (
        <ReferenceWidget
          tool={tool}
          choose={() => {
            setReferenceId(tool.id);
            setDialog("library");
          }}
        />
      );
    return (
      <InitiativeTracker
        onAdvance={(prepare) =>
          changeCampaign((c) => advanceCampaign(c, tool.id, prepare))
        }
        party={campaign.party}
        manageParty={() => setDialog("party")}
        tool={tool as InitiativeTool}
        update={(fn) =>
          updateTool(tool.id, (t) =>
            t.kind === "initiative" ? fn(t as InitiativeTool) : t,
          )
        }
      />
    );
  }
  function addWidget(kind: Widget["kind"], existing?: Tool, reference?: Entry) {
    const defaultSize = {
      w: Math.min(defaultSpan[kind].w, screen.grid.columns),
      h: Math.min(defaultSpan[kind].h, screen.grid.rows),
    };
    const rect = fitWidget(screen, defaultSize, origin);
    if (!rect) {
      setNotice(
        "There is not enough free space. Enlarge the grid or move a widget.",
      );
      setError(
        "There is not enough free space here. Choose another cell, move a widget, or enlarge the grid.",
      );
      return;
    }
    const tool = existing ?? newTool(kind);
    if (reference && (tool.kind === "reference" || tool.kind === "table")) {
      tool.target = reference.target;
      tool.name = reference.title.slice(0, 80);
    }
    const widget: Widget = {
      id: uid(),
      toolId: tool.id,
      kind,
      ...rect,
      title: "",
    };
    changeCampaign((c) =>
      editScreen(
        { ...c, tools: existing ? c.tools : [...c.tools, tool] },
        screen.id,
        (layout) => ({ ...layout, widgets: [...layout.widgets, widget] }),
      ),
    );
    setDialog(null);
    setOrigin(null);
  }
  function openAdd(x: number, y: number) {
    setOrigin({ x, y });
    setError("");
    setDialog("add");
  }
  const pin = (entry: Entry) => {
    if (entry.kind === "note")
      addWidget(
        "note",
        campaign.tools.find((t) => t.id === entry.id),
      );
    else
      addWidget(
        entry.kind === "table" ? "table" : "reference",
        undefined,
        entry,
      );
  };
  return (
    <ContentProvider
      campaign={campaign}
      packs={data.packs}
      update={changeCampaign}
      pin={pin}
    >
      <div className="app-shell">
        <header className="app-toolbar" aria-label="Screen controls">
          <a href="#main" className="brand" aria-label="Slate GM screen">
            <img src={import.meta.env.BASE_URL + "slate.svg"} alt="" />
            <span>slate</span>
          </a>
          <button
            className="campaign-switch"
            aria-label={"Switch campaign: " + campaign.name}
            onClick={() => setDialog("campaign")}
          >
            <span>{campaign.name}</span>
            <ChevronDown size={14} />
          </button>
          <ScreenNavigation
            screens={campaign.screens}
            activeId={screen.id}
            select={(id) => {
              changeCampaign((c) => ({ ...c, activeScreenId: id }));
              setArranging(false);
              setNotice("");
            }}
            manage={() => setDialog("screens")}
          />
          <div className="screen-actions">
            <button
              className="icon-button"
              aria-label="Campaign party"
              title={`Campaign party · ${campaign.party.characters.length} PCs`}
              onClick={() => setDialog("party")}
            >
              <Users size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Encounter manager"
              title="Encounter manager"
              aria-haspopup="dialog"
              aria-expanded={dialog === "encounters"}
              disabled={snapshot.busy || snapshot.conflict}
              onClick={() => setDialog("encounters")}
            >
              <Swords size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Campaign library"
              title="Campaign library"
              onClick={() => {
                setReferenceId(null);
                setDialog("library");
              }}
            >
              <BookOpen size={17} />
            </button>
            {arranging && (
              <>
                <button
                  className="icon-button"
                  aria-label="Undo layout change"
                  title="Undo layout change"
                  disabled={!screen.undo.length}
                  onClick={() =>
                    changeCampaign((c) => undoLayout(c, screen.id))
                  }
                >
                  <Undo2 size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Redo layout change"
                  title="Redo layout change"
                  disabled={!screen.redo.length}
                  onClick={() =>
                    changeCampaign((c) => undoLayout(c, screen.id, true))
                  }
                >
                  <Redo2 size={16} />
                </button>
              </>
            )}
            <button
              aria-label={`${screen.grid.columns} × ${screen.grid.rows} grid`}
              className="quiet"
              onClick={() => {
                setError("");
                setDialog("grid");
              }}
            >
              <Grid2X2 size={15} />
              <span className="responsive-label">
                {screen.grid.columns} × {screen.grid.rows} grid
              </span>
            </button>
            <button
              className={"secondary " + (arranging ? "arrange-active" : "")}
              aria-label={arranging ? "Done arranging" : "Arrange"}
              aria-pressed={arranging}
              onClick={() => setArranging(!arranging)}
            >
              {arranging ? <Check size={15} /> : <Settings2 size={15} />}
              <span className="responsive-label">
                {arranging ? "Done arranging" : "Arrange"}
              </span>
            </button>
            <button
              className="icon-button"
              aria-label="Command palette"
              aria-haspopup="dialog"
              aria-expanded={paletteOpen}
              aria-keyshortcuts="Alt+P Meta+P"
              title="Command palette · Alt+P / ⌘P"
              disabled={snapshot.busy || snapshot.conflict}
              onClick={openPalette}
            >
              <Search size={17} />
            </button>
            <button
              className="icon-button appearance-button"
              aria-label="Appearance"
              title="Appearance"
              onClick={() => setDialog("appearance")}
            >
              <Sun size={17} />
            </button>
          </div>
          <span
            className={
              "save-status " + (snapshot.status === "error" ? "unsaved" : "")
            }
            role="status"
            title="Stored on this device"
          >
            <i />
            {snapshot.busy ? (
              "Working…"
            ) : snapshot.status === "saved" ? (
              <>
                Saved<span className="sr-only"> on this device</span>
              </>
            ) : snapshot.status === "saving" ? (
              "Saving…"
            ) : (
              "Not saved"
            )}
          </span>
        </header>
        <main id="main" aria-label="GM screen">
          <div className="workspace-notices">
            {snapshot.error && (
              <div className="notice error" role="alert">
                <p>{snapshot.error}</p>
                <button className="secondary" onClick={() => exportData(data)}>
                  <Download size={15} />
                  Export unsaved copy
                </button>
                {snapshot.conflict ? (
                  <button
                    className="secondary"
                    onClick={() => location.reload()}
                  >
                    Reload saved data
                  </button>
                ) : (
                  <button className="secondary" onClick={appStore.retry}>
                    Retry save
                  </button>
                )}
              </div>
            )}
            {notice && (
              <div className="notice" role="status">
                {notice}
                <button
                  className="icon-button"
                  aria-label="Dismiss message"
                  onClick={() => setNotice("")}
                >
                  <X size={15} />
                </button>
              </div>
            )}
            {updateAvailable && (
              <div className="notice">
                <p>
                  A new version is ready. Finish your turn, then update when
                  you’re ready.
                </p>
                <button
                  className="secondary"
                  disabled={snapshot.status !== "saved" || snapshot.busy}
                  onClick={() => {
                    if (
                      appStore.getSnapshot().status === "saved" &&
                      !appStore.getSnapshot().busy
                    )
                      void applyUpdate?.(true).catch(() =>
                        setNotice(
                          "The update could not be applied. Your saved campaign is safe; try again when the app is ready.",
                        ),
                      );
                  }}
                >
                  Update Slate
                </button>
              </div>
            )}
          </div>
          <div
            id="screen-panel"
            role="tabpanel"
            aria-label={screen.name}
            tabIndex={0}
            className="screen-panel"
          >
            <fieldset
              className="board-fieldset"
              disabled={snapshot.conflict || snapshot.busy}
            >
              <Board
                key={campaign.id + screen.id}
                screen={screen}
                tools={campaign.tools}
                configure={setConfigureId}
                arranging={arranging}
                renderTool={(widget) =>
                  renderTool(
                    campaign.tools.find((tool) => tool.id === widget.toolId)!,
                  )
                }
                addAt={openAdd}
                place={(id, rect) =>
                  changeLayout((c) =>
                    canPlace(c, rect, id)
                      ? {
                          ...c,
                          widgets: c.widgets.map((w) =>
                            w.id === id
                              ? {
                                  ...w,
                                  ...rect,
                                  id: w.id,
                                  toolId: w.toolId,
                                  kind: w.kind,
                                }
                              : w,
                          ),
                        }
                      : c,
                  )
                }
                remove={(id) => {
                  changeLayout((c) => ({
                    ...c,
                    widgets: c.widgets.filter((w) => w.id !== id),
                  }));
                  setNotice(
                    "Widget removed from the screen. Click an empty cell, then Saved tools, to restore it.",
                  );
                }}
              />
            </fieldset>
          </div>
          <WorkspaceStatus offlineReady={offlineReady} arranging={arranging} />
        </main>
        <footer className="app-disclaimer">
          Slate is an independent product published under the Nimble 3rd Party
          Creator License and is not affiliated with Nimble Co.
        </footer>
        {paletteOpen && (
          <CommandPalette
            key={campaign.id}
            campaign={campaign}
            locked={snapshot.busy || snapshot.conflict}
            renderTool={renderTool}
            configure={setConfigureId}
            onClose={closePalette}
            createTool={(kind) => {
              if (campaign.tools.length >= 1000)
                throw new Error(
                  "This campaign has reached its tool limit. Open a saved tool instead.",
                );
              const tool = newTool(kind);
              changeCampaign((c) => ({ ...c, tools: [...c.tools, tool] }));
              return tool;
            }}
          />
        )}
        {configureId &&
          campaign.tools.some((tool) => tool.id === configureId) && (
            <ToolSettings
              key={campaign.id + configureId}
              tool={campaign.tools.find((tool) => tool.id === configureId)!}
              onClose={() => setConfigureId(null)}
              save={(next) => {
                updateTool(configureId, (current) =>
                  current.kind === next.kind ? next : current,
                );
                setConfigureId(null);
              }}
            />
          )}
        {dialog === "party" && (
          <PartyManager
            key={campaign.id}
            campaign={campaign}
            update={changeCampaign}
            locked={snapshot.busy || snapshot.conflict}
            onClose={() => setDialog(null)}
          />
        )}
        {dialog === "encounters" && (
          <EncounterLibrary key={campaign.id} onClose={() => setDialog(null)} />
        )}
        {dialog === "library" && (
          <ContentLibrary
            onClose={() => {
              setDialog(null);
              setReferenceId(null);
            }}
            choose={
              referenceId
                ? (entry) => {
                    updateTool(referenceId, (t) =>
                      t.kind === "reference"
                        ? {
                            ...t,
                            target: entry.target,
                            name: entry.title.slice(0, 80),
                          }
                        : t,
                    );
                  }
                : undefined
            }
          />
        )}
        {dialog === "add" && (
          <WidgetCatalogue
            campaign={campaign}
            origin={origin}
            error={error}
            add={addWidget}
            onClose={() => {
              setDialog(null);
              setOrigin(null);
            }}
          />
        )}
        {dialog === "screens" && (
          <ScreenManager
            campaign={campaign}
            update={changeCampaign}
            onClose={() => {
              setDialog(null);
              setArranging(false);
            }}
          />
        )}
        {dialog === "grid" && (
          <Modal title="Configure your grid" onClose={() => setDialog(null)}>
            <p className="hint">
              Columns and rows set the grid resolution. They always divide the
              full space below the title bar. Widgets keep their cell positions
              and spans as the screen size changes.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fields = new FormData(e.currentTarget);
                const grid = gridSchema.parse({
                  columns: Number(fields.get("columns")),
                  rows: Number(fields.get("rows")),
                });
                if (
                  screen.widgets.some(
                    (w) => w.x + w.w > grid.columns || w.y + w.h > grid.rows,
                  )
                ) {
                  setError(
                    "Move or resize widgets before making the grid smaller. No widgets have been removed.",
                  );
                  return;
                }
                changeLayout((c) => ({ ...c, grid }));
                setDialog(null);
              }}
            >
              <div className="form-grid">
                <label>
                  Columns
                  <input
                    name="columns"
                    type="number"
                    min={4}
                    max={24}
                    required
                    defaultValue={screen.grid.columns}
                  />
                </label>
                <label>
                  Rows
                  <input
                    name="rows"
                    type="number"
                    min={4}
                    max={30}
                    required
                    defaultValue={screen.grid.rows}
                  />
                </label>
              </div>
              <p className="hint">
                Content scrolls inside each widget. Expand a widget for more
                room without changing your layout.
              </p>
              {error && (
                <p className="inline-error" role="alert">
                  {error}
                </p>
              )}
              <button className="primary">Save grid</button>
            </form>
          </Modal>
        )}
        {dialog === "campaign" && (
          <CampaignManager
            data={data}
            locked={snapshot.busy || snapshot.conflict}
            onClose={() => {
              setDialog(null);
              setArranging(false);
            }}
          />
        )}
        {dialog === "appearance" && (
          <Modal title="Set the mood" onClose={() => setDialog(null)}>
            <p className="hint">A comfortable table, in any light.</p>
            <div className="appearance-options">
              {(
                [
                  { id: "light", label: "Light", Icon: Sun },
                  { id: "dark", label: "Dark", Icon: Moon },
                  { id: "system", label: "System", Icon: Monitor },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={data.appearance === id ? "selected" : ""}
                  aria-pressed={data.appearance === id}
                  onClick={() =>
                    appStore.update((d) => ({ ...d, appearance: id }))
                  }
                >
                  <Icon size={23} />
                  {label}
                </button>
              ))}
            </div>
            <label>
              Palette
              <select
                aria-label="Palette"
                value={data.palette}
                onChange={(e) => {
                  const palette = e.target.value as "parchment" | "stone";
                  appStore.update((d) => ({ ...d, palette }));
                }}
              >
                <option value="parchment">
                  Parchment · Sidekick Nimble Classic
                </option>
                <option value="stone">Stone · Sidekick Modern</option>
              </select>
            </label>
            <p className="hint">
              Appearance applies to this device. Campaigns keep their own tools
              and layouts.
            </p>
          </Modal>
        )}
      </div>
    </ContentProvider>
  );
}
