import { useLayoutEffect, useRef, useState } from "react";
import {
  Compartment,
  EditorState,
  StateEffect,
  StateField,
  Transaction,
} from "@codemirror/state";
import {
  Decoration,
  EditorView,
  WidgetType,
  keymap,
  placeholder,
  tooltips,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  acceptCompletion,
  autocompletion,
  closeCompletion,
  completionKeymap,
} from "@codemirror/autocomplete";
import {
  contentKind,
  resolveEntry,
  searchContent,
  type Entry,
} from "../content";
import {
  documentReferences,
  type RelationshipReference,
} from "../document-markdown";
import { mentionParts, referenceHref, referenceMarkdown } from "../references";

export type DocumentSelection = {
  start: number;
  end: number;
  text: string;
  body: string;
};
export type ReferenceAction = "open" | "edit" | "replace" | "tags" | "unlink";
type Props = {
  value: string;
  source: string;
  all: Entry[];
  disabled: boolean;
  onTextChange: (text: string) => boolean;
  onSelection: (selection: DocumentSelection | null) => void;
  onReference: (
    action: ReferenceAction,
    reference: RelationshipReference,
  ) => void;
  onCreateNote: (selection: DocumentSelection) => void;
  onLinkSelection: (selection: DocumentSelection) => void;
};
const refreshLinks = StateEffect.define<void>();
class ReferenceLink extends WidgetType {
  constructor(
    readonly reference: RelationshipReference,
    readonly missing: boolean,
  ) {
    super();
  }
  eq(other: ReferenceLink) {
    return (
      JSON.stringify(this.reference) === JSON.stringify(other.reference) &&
      this.missing === other.missing
    );
  }
  toDOM() {
    const link = document.createElement("a");
    link.href = referenceHref(this.reference.target, this.reference.tags);
    link.textContent = this.reference.label;
    link.className =
      "editor-reference" + (this.missing ? " missing-reference" : "");
    link.dataset.referenceStart = String(this.reference.start);
    link.title =
      (this.missing ? "Missing reference" : "Open reference") +
      (this.reference.tags.length
        ? " · " + this.reference.tags.join(", ")
        : "");
    return link;
  }
  ignoreEvent() {
    return false;
  }
}
function selection(view: EditorView): DocumentSelection {
  const range = view.state.selection.main;
  return {
    start: range.from,
    end: range.to,
    text: view.state.sliceDoc(range.from, range.to),
    body: view.state.doc.toString(),
  };
}
function mentionAt(state: EditorState) {
  const range = state.selection.main;
  if (!range.empty) return null;
  const match = /(?:^|\s)@([^\n@]{0,160})$/.exec(
    state.sliceDoc(Math.max(0, range.head - 162), range.head),
  );
  return match
    ? {
        from: range.head - match[1].length - 1,
        to: range.head,
        ...mentionParts(match[1]),
      }
    : null;
}

export function WorldMarkdownEditor(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const latest = useRef(props);
  const external = useRef(false);
  const permissions = useRef(new Compartment());
  const targets = useRef("");
  const [noMatches, setNoMatches] = useState(false);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    selection: DocumentSelection;
    reference?: RelationshipReference;
  } | null>(null);

  useLayoutEffect(() => {
    latest.current = props;
    const view = editor.current;
    if (!view) return;
    external.current = true;
    try {
      if (view.state.doc.toString() !== props.value)
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: props.value },
          userEvent: "input.external",
        });
      if (view.state.readOnly !== props.disabled)
        view.dispatch({
          effects: permissions.current.reconfigure([
            EditorState.readOnly.of(props.disabled),
            EditorView.editable.of(!props.disabled),
          ]),
        });
      const available = props.all.map((entry) => entry.target).join("\n");
      if (available !== targets.current) {
        targets.current = available;
        view.dispatch({ effects: refreshLinks.of() });
      }
    } finally {
      external.current = false;
    }
  });

  useLayoutEffect(() => {
    function links(state: EditorState) {
      const mention = mentionAt(state);
      const references = documentReferences(
        state.doc.toString(),
        latest.current.source,
      ).references.filter(
        (ref) =>
          ref.origin === "inline" &&
          (ref.href !== undefined || ref.start !== mention?.from) &&
          !state.sliceDoc(ref.start, ref.end).includes("\n"),
      );
      return Decoration.set(
        references.map((ref) =>
          Decoration.replace({
            widget: new ReferenceLink(
              ref,
              !resolveEntry(latest.current.all, ref.target),
            ),
          }).range(ref.start, ref.end),
        ),
        true,
      );
    }
    const decorations = StateField.define({
      create: links,
      update: (value, transaction) =>
        transaction.docChanged ||
        transaction.selection !== undefined ||
        transaction.effects.some((effect) => effect.is(refreshLinks))
          ? links(transaction.state)
          : value,
      provide: (field) => [
        EditorView.decorations.from(field),
        EditorView.atomicRanges.of((view) => view.state.field(field)),
      ],
    });
    const findLink = (event: Event, view: EditorView) => {
      const element =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[data-reference-start]")
          : null;
      if (!element) return;
      return documentReferences(
        view.state.doc.toString(),
        latest.current.source,
      ).references.find(
        (ref) =>
          ref.origin === "inline" &&
          ref.start === Number(element.dataset.referenceStart),
      );
    };
    function showMenu(
      view: EditorView,
      x: number,
      y: number,
      reference?: RelationshipReference,
    ) {
      if (view.state.readOnly) return;
      closeCompletion(view);
      setMenu({ x, y, reference, selection: selection(view) });
    }
    const view = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: latest.current.value,
        extensions: [
          history(),
          keymap.of([
            ...completionKeymap,
            { key: "Tab", run: acceptCompletion },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.lineWrapping,
          tooltips({
            parent: document.body,
            position: "fixed",
            tooltipSpace: () => ({
              top: 8,
              left: 8,
              right: innerWidth - 8,
              bottom: innerHeight - 8,
            }),
          }),
          placeholder(
            "Write about your world. Type @ to find a reference, or select a passage and right-click.",
          ),
          EditorView.contentAttributes.of({
            "aria-label": "Document text",
            "aria-multiline": "true",
            spellcheck: "true",
          }),
          permissions.current.of([
            EditorState.readOnly.of(latest.current.disabled),
            EditorView.editable.of(!latest.current.disabled),
          ]),
          EditorState.transactionFilter.of((transaction) =>
            transaction.newDoc.length > 100000 ? [] : transaction,
          ),
          decorations,
          autocompletion({
            activateOnTypingDelay: 0,
            interactionDelay: 0,
            icons: false,
            override: [
              (context) => {
                const mention = mentionAt(context.state);
                if (!mention) return null;
                const options = searchContent(
                  latest.current.all.filter(
                    (entry) => entry.target !== latest.current.source,
                  ),
                  mention.query,
                ).slice(0, 8);
                return {
                  from: mention.from,
                  to: mention.to,
                  filter: false,
                  options: options.map((entry) => ({
                    label: entry.title,
                    detail: ` ${contentKind(entry)} · ${entry.pack?.name ?? "Campaign"}`,
                    apply(
                      view: EditorView,
                      _completion: unknown,
                      from: number,
                      to: number,
                    ) {
                      const text = referenceMarkdown(
                        entry.title,
                        entry.target,
                        mention.tags,
                      );
                      view.dispatch({
                        changes: { from, to, insert: text },
                        selection: { anchor: from + text.length },
                        userEvent: "input.complete",
                      });
                      view.focus();
                    },
                  })),
                };
              },
            ],
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !external.current) {
              const body = update.state.doc.toString();
              if (!latest.current.onTextChange(body))
                queueMicrotask(() => {
                  if (editor.current?.state === update.state)
                    editor.current.dispatch({
                      changes: {
                        from: 0,
                        to: body.length,
                        insert: latest.current.value,
                      },
                      annotations: Transaction.addToHistory.of(false),
                    });
                });
            }
            if (update.docChanged || update.selectionSet) {
              const range = selection(update.view);
              latest.current.onSelection(
                range.start === range.end ? null : range,
              );
              const mention = mentionAt(update.state);
              setNoMatches(
                !!mention &&
                  !searchContent(
                    latest.current.all.filter(
                      (entry) => entry.target !== latest.current.source,
                    ),
                    mention.query,
                  ).length,
              );
            }
          }),
          EditorView.domEventHandlers({
            mousedown(event, view) {
              if (event.button === 0 && findLink(event, view)) {
                event.preventDefault();
                return true;
              }
              return false;
            },
            click(event, view) {
              const reference = findLink(event, view);
              if (!reference) return false;
              event.preventDefault();
              latest.current.onReference("open", reference);
              return true;
            },
            keydown(event, view) {
              if (event.key === "Escape") setNoMatches(false);
              const reference = findLink(event, view);
              if (event.key === "Enter" && reference) {
                event.preventDefault();
                latest.current.onReference("open", reference);
                return true;
              }
              if (
                event.key === "ContextMenu" ||
                (event.key === "F10" && event.shiftKey)
              ) {
                const coordinates = view.coordsAtPos(
                  view.state.selection.main.head,
                );
                showMenu(
                  view,
                  coordinates?.left ?? 0,
                  coordinates?.bottom ?? 0,
                  reference,
                );
                event.preventDefault();
                return true;
              }
              return false;
            },
            contextmenu(event, view) {
              if (view.state.readOnly) return false;
              event.preventDefault();
              event.stopPropagation();
              const reference = findLink(event, view);
              if (!reference && view.state.selection.main.empty) {
                const at = view.posAtCoords({
                  x: event.clientX,
                  y: event.clientY,
                });
                if (at !== null) view.dispatch({ selection: { anchor: at } });
              }
              showMenu(view, event.clientX, event.clientY, reference);
              return true;
            },
          }),
        ],
      }),
    });
    editor.current = view;
    return () => {
      editor.current = null;
      view.destroy();
    };
  }, []);

  function closeMenu(restoreFocus = true) {
    setMenu(null);
    if (restoreFocus) editor.current?.focus();
  }
  function action(run: () => void) {
    closeMenu();
    run();
  }
  async function clipboard(kind: "copy" | "cut" | "paste" | "address") {
    if (!menu || !editor.current) return;
    const saved = menu,
      view = editor.current;
    closeMenu();
    try {
      if (kind === "address")
        await navigator.clipboard.writeText(
          referenceHref(saved.reference!.target, saved.reference!.tags),
        );
      else if (kind === "copy" || kind === "cut") {
        await navigator.clipboard.writeText(saved.selection.text);
        if (kind === "cut") {
          if (view.state.doc.toString() !== saved.selection.body)
            throw new Error("The document changed. Select the passage again.");
          view.dispatch({
            changes: { from: saved.selection.start, to: saved.selection.end },
            userEvent: "delete.cut",
          });
        }
      } else {
        const text = await navigator.clipboard.readText();
        if (view.state.doc.toString() !== saved.selection.body)
          throw new Error("The document changed. Select the passage again.");
        view.dispatch({
          changes: {
            from: saved.selection.start,
            to: saved.selection.end,
            insert: text,
          },
          userEvent: "input.paste",
        });
      }
      setError("");
    } catch {
      setError(
        "Clipboard access is unavailable. Use the keyboard copy, cut or paste shortcuts instead.",
      );
    }
  }
  return (
    <>
      <div className="world-markdown-editor" ref={host} />
      {noMatches && (
        <p className="hint" role="status">
          No matching content.
        </p>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {menu && (
        <EditorContextMenu x={menu.x} y={menu.y} close={closeMenu}>
          {menu.reference ? (
            <>
              <button
                role="menuitem"
                onClick={() =>
                  action(() => props.onReference("open", menu.reference!))
                }
              >
                Open reference
              </button>
              <button
                role="menuitem"
                onClick={() =>
                  action(() => props.onReference("edit", menu.reference!))
                }
              >
                Edit link text
              </button>
              <button
                role="menuitem"
                onClick={() =>
                  action(() => props.onReference("replace", menu.reference!))
                }
              >
                Change reference
              </button>
              <button
                role="menuitem"
                onClick={() =>
                  action(() => props.onReference("tags", menu.reference!))
                }
              >
                Edit relationship tags
              </button>
              <button role="menuitem" onClick={() => clipboard("address")}>
                Copy link address
              </button>
              <button
                role="menuitem"
                onClick={() =>
                  action(() => props.onReference("unlink", menu.reference!))
                }
              >
                Remove link
              </button>
            </>
          ) : (
            <>
              <button
                role="menuitem"
                disabled={!menu.selection.text.trim()}
                onClick={() => action(() => props.onCreateNote(menu.selection))}
              >
                Create linked note
              </button>
              <button
                role="menuitem"
                disabled={!menu.selection.text.trim()}
                onClick={() =>
                  action(() => props.onLinkSelection(menu.selection))
                }
              >
                Add reference
              </button>
              <button
                role="menuitem"
                disabled={!menu.selection.text}
                onClick={() => clipboard("copy")}
              >
                Copy
              </button>
              <button
                role="menuitem"
                disabled={!menu.selection.text}
                onClick={() => clipboard("cut")}
              >
                Cut
              </button>
              <button role="menuitem" onClick={() => clipboard("paste")}>
                Paste
              </button>
              <button
                role="menuitem"
                onClick={() =>
                  action(() => {
                    const view = editor.current!;
                    view.dispatch({
                      selection: { anchor: 0, head: view.state.doc.length },
                    });
                    view.focus();
                  })
                }
              >
                Select all
              </button>
            </>
          )}
        </EditorContextMenu>
      )}
    </>
  );
}

function EditorContextMenu({
  x,
  y,
  close,
  children,
}: {
  x: number;
  y: number;
  close: (restoreFocus?: boolean) => void;
  children: React.ReactNode;
}) {
  const menu = useRef<HTMLDivElement>(null);
  const dismiss = useRef(close);
  useLayoutEffect(() => {
    dismiss.current = close;
  });
  useLayoutEffect(() => {
    const element = menu.current!;
    element.showPopover();
    const bounds = element.getBoundingClientRect();
    element.style.left =
      Math.max(8, Math.min(x, innerWidth - bounds.width - 8)) + "px";
    element.style.top =
      Math.max(8, Math.min(y, innerHeight - bounds.height - 8)) + "px";
    element.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    const outside = (event: PointerEvent) => {
      if (!element.contains(event.target as Node)) dismiss.current(false);
    };
    const moved = (event: Event) => {
      if (!(event.target instanceof Node) || !element.contains(event.target))
        dismiss.current(false);
    };
    document.addEventListener("pointerdown", outside, true);
    window.addEventListener("resize", moved);
    window.addEventListener("scroll", moved, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("resize", moved);
      window.removeEventListener("scroll", moved, true);
      element.hidePopover();
    };
  }, [x, y]);
  return (
    <div
      ref={menu}
      popover="manual"
      className="editor-context-menu"
      role="menu"
      aria-label="Edit document"
      onKeyDown={(event) => {
        const items = [
          ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ),
        ];
        const current = items.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? items.length - 1
                : (current +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    items.length) %
                  items.length;
          items[next]?.focus();
        } else if (event.key === "Escape" || event.key === "Tab") {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      {children}
    </div>
  );
}
