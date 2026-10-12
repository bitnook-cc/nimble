import { ConfigureButton } from "./ToolSettings";
import { trapDialogFocus, useDialogDismiss } from "./Modal";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { widgetCommands, type WidgetCommand } from "../commands";
import type { Campaign, Tool, Widget } from "../model";
import { WidgetIcon } from "./WidgetIcon";

export function CommandPalette({
  campaign,
  createTool,
  renderTool,
  configure,
  locked,
  onClose,
}: {
  campaign: Campaign;
  createTool: (kind: Widget["kind"]) => Tool;
  renderTool: (tool: Tool) => ReactNode;
  configure: (toolId: string) => void;
  locked: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const dismiss = useDialogDismiss(onClose);
  const input = useRef<HTMLInputElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const titleId = useId(),
    listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [toolId, setToolId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const tool = campaign.tools.find((entry) => entry.id === toolId);
  const results = widgetCommands(campaign, query);
  const visible = results.slice(0, 50);
  const selected = Math.max(0, Math.min(active, visible.length - 1));
  useEffect(() => {
    const popup = dialog.current!;
    popup.showModal();
    input.current?.focus();
    return () => popup.close();
  }, []);
  useEffect(() => {
    if (toolId)
      body.current
        ?.querySelector<HTMLElement>("input, select, textarea, button")
        ?.focus();
    else input.current?.focus();
  }, [toolId]);
  useEffect(() => {
    if (!toolId)
      document
        .getElementById(`${listId}-${selected}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [listId, selected, toolId]);
  function select(command: WidgetCommand) {
    if (locked) return;
    try {
      setToolId(command.toolId ?? createTool(command.kind).id);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to open this tool.");
    }
  }
  return (
    <dialog
      {...dismiss}
      onKeyDown={trapDialogFocus}
      ref={dialog}
      className={`command-palette ${tool ? "command-widget" : ""}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        if (e.target === dialog.current) {
          e.preventDefault();
          onClose();
        }
      }}
      onClose={(e) => {
        if (e.target === dialog.current && !e.currentTarget.open) onClose();
      }}
    >
      <header className="command-heading">
        {tool ? (
          <>
            <button
              className="icon-button"
              aria-label="Back to command palette"
              onClick={() => setToolId(null)}
            >
              <ArrowLeft size={17} />
            </button>
            <WidgetIcon kind={tool.kind} />
          </>
        ) : (
          <Search size={18} />
        )}
        <h2 id={titleId}>{tool ? tool.name : "Command palette"}</h2>
        {tool && (
          <ConfigureButton
            disabled={locked}
            onClick={() => configure(tool.id)}
          />
        )}
        <button
          className="icon-button"
          aria-label="Close command palette"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </header>
      {tool ? (
        <>
          <div ref={body} className="command-widget-body">
            <fieldset className="board-fieldset" disabled={locked}>
              {renderTool(tool)}
            </fieldset>
          </div>
          <p className="command-footer">
            Tool data saves to this campaign. Your grid stays as it is.
          </p>
        </>
      ) : (
        <>
          <div className="command-search">
            <input
              ref={input}
              type="text"
              role="combobox"
              aria-label="Search widgets"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={
                visible[selected] ? `${listId}-${selected}` : undefined
              }
              placeholder="Search widgets or saved tools…"
              autoComplete="off"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  if (visible.length)
                    setActive(
                      (selected +
                        (e.key === "ArrowDown" ? 1 : -1) +
                        visible.length) %
                        visible.length,
                    );
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (visible[selected]) select(visible[selected]);
                }
              }}
            />
          </div>
          <div
            className="command-results"
            id={listId}
            role="listbox"
            aria-label="Widgets"
          >
            {visible.map((command, index) => (
              <button
                type="button"
                role="option"
                tabIndex={-1}
                id={`${listId}-${index}`}
                key={command.id}
                aria-label={command.title}
                aria-describedby={`${listId}-${index}-description`}
                aria-selected={selected === index}
                disabled={locked}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(command)}
              >
                <WidgetIcon kind={command.kind} size={19} />
                <span>
                  <strong>{command.title}</strong>
                  <small id={`${listId}-${index}-description`}>
                    {command.description}
                  </small>
                </span>
                <span className="command-enter" aria-hidden="true">
                  ↵
                </span>
              </button>
            ))}
            {!visible.length && (
              <p className="hint" role="status">
                No matching widgets. Try a name, type or purpose.
              </p>
            )}
          </div>
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <p className="command-footer">
            {results.length > visible.length
              ? `Showing ${visible.length} of ${results.length} tools. Refine your search. `
              : ""}
            <kbd>↑</kbd> <kbd>↓</kbd> to choose · <kbd>Enter</kbd> to open ·{" "}
            <kbd>Esc</kbd> to close
          </p>
        </>
      )}
    </dialog>
  );
}
