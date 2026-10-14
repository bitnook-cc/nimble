import { useId, useLayoutEffect, useRef, useState } from "react";
import type { NoteTool } from "../model";
import { searchContent, contentKind } from "../content";
import { referenceMarkdown } from "../content-schema";
import { updateNote } from "../notes";
import { useContent } from "./ContentWorkspace";
import { Markdown } from "./Markdown";

// A textarea has no DOM caret to measure. Mirror its wrapping and typography,
// then subtract its scroll offsets to locate the caret in the viewport.
function caretRect(editor: HTMLTextAreaElement, caret: number) {
  const bounds = editor.getBoundingClientRect();
  const style = getComputedStyle(editor);
  const mirror = document.createElement("div");
  for (const property of [
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "line-height",
    "letter-spacing",
    "text-indent",
    "text-transform",
    "text-align",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "border-top-width",
    "border-right-width",
    "border-bottom-width",
    "border-left-width",
    "direction",
    "tab-size",
  ])
    mirror.style.setProperty(property, style.getPropertyValue(property));
  Object.assign(mirror.style, {
    position: "fixed",
    visibility: "hidden",
    pointerEvents: "none",
    boxSizing: "border-box",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    borderStyle: "solid",
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${editor.clientWidth + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth)}px`,
  });
  mirror.textContent = editor.value.slice(0, caret);
  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  mirror.append(marker, document.createTextNode(editor.value.slice(caret)));
  document.body.append(mirror);
  const rect = marker.getBoundingClientRect();
  const lineHeight = parseFloat(style.lineHeight) || rect.height;
  const top = rect.top - editor.scrollTop - (lineHeight - rect.height) / 2;
  mirror.remove();
  return { left: rect.left - editor.scrollLeft, top, bottom: top + lineHeight };
}

export function NoteWidget({ tool }: { tool: NoteTool }) {
  const {
    all,
    open,
    rollFormula,
    campaign,
    update: changeCampaign,
  } = useContent();
  const note = campaign.content.find(
    (record) => record.id === tool.noteId && record.kind === "note",
  );
  const body = note?.body ?? "";
  const updateBody = (body: string) =>
    changeCampaign((c) =>
      updateNote(c, tool.noteId, (note) => ({ ...note, body })),
    );
  const [editing, setEditing] = useState(!body);
  const input = useRef<HTMLTextAreaElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [mention, setMention] = useState<{
    start: number;
    end: number;
    query: string;
  } | null>(null);
  const [active, setActive] = useState(0);
  const matches = mention
    ? searchContent(
        all.filter((entry) => entry.target !== `local::${tool.noteId}`),
        mention.query,
      ).slice(0, 8)
    : [];

  useLayoutEffect(() => {
    const list = results.current;
    const editor = input.current;
    if (!mention || !list || !editor) return;
    function position() {
      if (!list || !editor || !mention) return;
      const caret = caretRect(editor, mention.end);
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft ?? 0;
      const top = viewport?.offsetTop ?? 0;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const gutter = 8;
      list.style.width = `${Math.min(340, width - gutter * 2)}px`;
      const below = Math.max(0, top + height - gutter - caret.bottom - 5);
      const above = Math.max(0, caret.top - 5 - top - gutter);
      const upwards = below < Math.min(230, list.scrollHeight) && above > below;
      list.style.maxHeight = `${Math.min(230, height - gutter * 2, upwards ? above : below)}px`;
      const bounds = list.getBoundingClientRect();
      list.style.left = `${Math.max(left + gutter, Math.min(caret.left, left + width - bounds.width - gutter))}px`;
      list.style.top = `${Math.max(top + gutter, Math.min(upwards ? caret.top - bounds.height - 5 : caret.bottom + 5, top + height - bounds.height - gutter))}px`;
    }
    // Keep the dropdown in the top layer so tile scrolling and modal dialogs
    // cannot clip or cover it. It stays in this note's DOM/accessibility tree.
    list.showPopover();
    position();
    const observer = new ResizeObserver(position);
    observer.observe(editor);
    window.addEventListener("resize", position);
    document.addEventListener("scroll", position, true);
    window.visualViewport?.addEventListener("resize", position);
    window.visualViewport?.addEventListener("scroll", position);
    function outside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !list?.contains(event.target) &&
        event.target !== editor
      )
        setMention(null);
    }
    document.addEventListener("pointerdown", outside, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
      document.removeEventListener("scroll", position, true);
      window.visualViewport?.removeEventListener("resize", position);
      window.visualViewport?.removeEventListener("scroll", position);
      document.removeEventListener("pointerdown", outside, true);
      list.hidePopover();
    };
  }, [mention, matches.length]);

  useLayoutEffect(() => {
    const list = results.current;
    const option = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !option) return;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (
      option.offsetTop + option.offsetHeight >
      list.scrollTop + list.clientHeight
    )
      list.scrollTop =
        option.offsetTop + option.offsetHeight - list.clientHeight;
  }, [active, mention]);

  function detect(editor: HTMLTextAreaElement) {
    const caret = editor.selectionStart;
    const match =
      editor.selectionEnd === caret
        ? /(?:^|\s)@([^\n@]{0,60})$/.exec(editor.value.slice(0, caret))
        : null;
    const next = match
      ? { start: caret - match[1].length - 1, end: caret, query: match[1] }
      : null;
    if (
      next?.start === mention?.start &&
      next?.end === mention?.end &&
      next?.query === mention?.query
    )
      return;
    setMention(next);
    setActive(0);
  }
  function insert(index: number) {
    if (!mention || !matches[index]) return;
    const r = matches[index],
      text = referenceMarkdown(r.title, r.target),
      nextBody = body.slice(0, mention.start) + text + body.slice(mention.end);
    updateBody(nextBody);
    const caret = mention.start + text.length;
    setMention(null);
    requestAnimationFrame(() => {
      input.current?.focus();
      input.current?.setSelectionRange(caret, caret);
    });
  }
  return (
    <div className="note-widget">
      <div className="content-actions">
        <button
          className="quiet"
          onClick={() => {
            setEditing((v) => !v);
            setMention(null);
          }}
        >
          {editing ? "Read note" : "Edit note"}
        </button>
        <button className="quiet" onClick={() => open(`local::${tool.noteId}`)}>
          Note details
        </button>
      </div>
      {editing ? (
        <>
          <label className="sr-only" htmlFor={listId + "-editor"}>
            Note text
          </label>
          <textarea
            ref={input}
            id={listId + "-editor"}
            value={body}
            maxLength={100000}
            placeholder="Write Markdown. Type @ to link a rule, spell, item, monster or note…"
            aria-autocomplete="list"
            aria-controls={mention ? listId : undefined}
            aria-activedescendant={
              mention && matches.length ? `${listId}-${active}` : undefined
            }
            onChange={(e) => {
              const body = e.currentTarget.value;
              updateBody(body);
              if (!(e.nativeEvent as InputEvent).isComposing)
                detect(e.currentTarget);
            }}
            onClick={(e) => detect(e.currentTarget)}
            onSelect={(e) => detect(e.currentTarget)}
            onBlur={() => setMention(null)}
            onCompositionStart={() => setMention(null)}
            onCompositionEnd={(e) => detect(e.currentTarget)}
            onKeyDown={(e) => {
              if (!mention || e.nativeEvent.isComposing) return;
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                setMention(null);
              }
              if (matches.length && ["ArrowDown", "ArrowUp"].includes(e.key)) {
                e.preventDefault();
                setActive(
                  (a) =>
                    (a + (e.key === "ArrowDown" ? 1 : -1) + matches.length) %
                    matches.length,
                );
              }
              if (matches.length && ["Enter", "Tab"].includes(e.key)) {
                e.preventDefault();
                insert(active);
              }
            }}
          />
          {mention && (
            <div
              ref={results}
              popover="manual"
              className="mention-results"
              id={listId}
              role="listbox"
              aria-label="Reference suggestions"
            >
              {matches.map((r, i) => (
                <button
                  key={r.target}
                  id={`${listId}-${i}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={i === active}
                  className={i === active ? "selected" : ""}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => insert(i)}
                >
                  <span>{r.title}</span>
                  <small>
                    {contentKind(r)} ·{" "}
                    {r.pack
                      ? r.pack.system
                        ? r.pack.name
                        : "Nexus"
                      : "Campaign"}
                  </small>
                </button>
              ))}
              {!matches.length && (
                <p className="hint" role="status">
                  No matching content.
                </p>
              )}
            </div>
          )}
          <p className="hint">Markdown · @ references · saved automatically</p>
        </>
      ) : body ? (
        <Markdown onRoll={rollFormula} body={body} all={all} open={open} />
      ) : (
        <p className="hint">This note is empty.</p>
      )}
    </div>
  );
}
