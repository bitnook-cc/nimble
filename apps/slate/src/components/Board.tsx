import { ConfigureButton } from "./ToolSettings";
import { WidgetIcon } from "./WidgetIcon";
import {
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Ellipsis, Expand, Grip, Maximize2, Plus, X } from "lucide-react";
import {
  canPlace,
  type Screen,
  type Tool,
  type Placement,
  type Widget,
} from "../model";
import { widgetTypes } from "../widgets";
import { widgetTitle } from "../screens";
import { Modal } from "./Modal";

type BoardProps = {
  screen: Screen;
  tools: Tool[];
  configure: (toolId: string) => void;
  arranging: boolean;
  place: (id: string, rect: Placement) => void;
  remove: (id: string) => void;
  addAt: (x: number, y: number) => void;
  renderTool: (widget: Widget) => ReactNode;
};
function Card({
  widget,
  screen,
  tools,
  configure,
  arranging,
  place,
  remove,
  renderTool,
  geometry,
  announce,
}: BoardProps & {
  widget: Widget;
  geometry: () => { stepX: number; stepY: number };
  announce: (message: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: widget.id, disabled: !arranging });
  const card = useRef<HTMLElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const observeCard = useCallback(
    (element: HTMLElement | null) => {
      card.current = element;
      setNodeRef(element);
    },
    [setNodeRef],
  );
  useLayoutEffect(() => {
    const element = card.current!;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setSize((previous) =>
        previous?.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const minimum = widgetTypes[widget.kind].minimumPixels;
  const undersized =
    !!size && (size.width < minimum.width || size.height < minimum.height);
  const tiny = !!size && (size.width < 100 || size.height < 70);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuPopup = useRef<HTMLDivElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    if (!menu) return;
    function dismiss(event: PointerEvent) {
      if (
        event.isPrimary &&
        event.button === 0 &&
        event.target instanceof Node &&
        !menuPopup.current?.contains(event.target) &&
        !menuButton.current?.contains(event.target)
      )
        setMenu(false);
    }
    document.addEventListener("pointerdown", dismiss, true);
    return () => document.removeEventListener("pointerdown", dismiss, true);
  }, [menu]);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<Placement | null>(null);
  const resizeStart = useRef<{
    x: number;
    y: number;
    rect: Placement;
    stepX: number;
    stepY: number;
  } | null>(null);
  const title = widgetTitle(widget, tools);
  const bounds = draft ?? widget;
  const invalid = draft && !canPlace(screen, draft, widget.id);
  function nudge(event: KeyboardEvent<HTMLButtonElement>, resizing = false) {
    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (!arranging || !direction) return;
    event.preventDefault();
    event.stopPropagation();
    const [x, y] = direction;
    const rect = resizing
      ? { ...widget, w: widget.w + x, h: widget.h + y }
      : { ...widget, x: widget.x + x, y: widget.y + y };
    if (canPlace(screen, rect, widget.id)) {
      place(widget.id, rect);
      announce(resizing ? "Widget resized." : "Widget moved.");
    } else
      announce(
        "Cannot place there. The widget overlaps another widget or extends beyond the grid.",
      );
  }
  const moveWithKeys = (event: KeyboardEvent<HTMLButtonElement>) =>
    nudge(event);
  function positionMenu(anchor: { bottom: number; right: number }) {
    setMenuPosition({
      top: Math.max(8, Math.min(anchor.bottom + 4, window.innerHeight - 128)),
      left: Math.max(8, Math.min(anchor.right - 200, window.innerWidth - 208)),
    });
  }
  const menuControl = (
    <button
      className="icon-button widget-menu-button"
      ref={menuButton}
      aria-label={"Widget menu " + title}
      aria-expanded={menu}
      onClick={(event) => {
        positionMenu(event.currentTarget.getBoundingClientRect());
        setMenu(!menu);
      }}
    >
      <Ellipsis size={15} />
    </button>
  );
  return (
    <>
      <section
        ref={observeCard}
        className={`widget-card ${undersized ? "is-undersized" : ""} ${tiny ? "is-tiny" : ""} ${isDragging ? "dragging" : ""} ${invalid ? "invalid-placement" : ""}`}
        aria-label={title}
        data-widget={widget.id}
        data-placeholder={undersized ? "true" : undefined}
        onContextMenu={(event) => {
          if (!undersized) return;
          event.preventDefault();
          positionMenu({ bottom: event.clientY, right: event.clientX + 200 });
          setMenu(true);
        }}
        style={{
          gridColumn: `${bounds.x + 1} / span ${bounds.w}`,
          gridRow: `${bounds.y + 1} / span ${bounds.h}`,
          transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        }}
      >
        {!undersized && (
          <header className="widget-header">
            <div className="widget-title">
              {arranging && (
                <button
                  className="icon-button drag-handle"
                  title="Drag to move; arrow keys move one cell"
                  onKeyDown={moveWithKeys}
                  {...listeners}
                  {...attributes}
                  aria-label={`Drag ${title}`}
                >
                  <Grip size={16} />
                </button>
              )}
              <WidgetIcon kind={widget.kind} />
              <h2>{title}</h2>
            </div>
            <div className="toolbar-actions">
              <ConfigureButton onClick={() => configure(widget.toolId)} />
              {menuControl}
              {arranging ? (
                <>
                  <span className="span-label">
                    {bounds.w} × {bounds.h}
                  </span>
                  <button
                    className="icon-button"
                    aria-label={`Remove ${title} from screen`}
                    onClick={() => remove(widget.id)}
                  >
                    <X size={15} />
                  </button>
                </>
              ) : (
                <button
                  className="icon-button"
                  ref={expandButton}
                  aria-label={`Expand ${title}`}
                  onClick={() => setExpanded(true)}
                >
                  <Maximize2 size={15} />
                </button>
              )}
            </div>
          </header>
        )}
        {menu && (
          <div
            className="widget-menu"
            ref={menuPopup}
            style={menuPosition}
            role="group"
            aria-label={title + " actions"}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                setMenu(false);
                menuButton.current?.focus();
              }
            }}
          >
            <button className="danger" onClick={() => remove(widget.id)}>
              Remove from screen
            </button>
          </div>
        )}
        {undersized && (
          <>
            <button
              className="widget-placeholder"
              ref={expandButton}
              {...(arranging ? { ...listeners, ...attributes } : {})}
              aria-label={arranging ? "Arrange " + title : "Expand " + title}
              title={
                title +
                " · Needs " +
                minimum.width +
                " × " +
                minimum.height +
                " px. Enlarge the tile or open the tool."
              }
              onClick={() => {
                if (!arranging) setExpanded(true);
              }}
              onKeyDown={moveWithKeys}
            >
              <WidgetIcon kind={widget.kind} />
              <span className="placeholder-title">{title}</span>
              <small>{arranging ? "Drag or resize" : "Expand to use"}</small>
            </button>
            {size && size.width >= 64 && size.height >= 60 && (
              <header className="placeholder-actions widget-header">
                {arranging && size.width >= 180 && (
                  <button
                    className="icon-button drag-handle"
                    title="Drag to move; arrow keys move one cell"
                    onKeyDown={moveWithKeys}
                    {...listeners}
                    {...attributes}
                    aria-label={"Drag " + title}
                  >
                    <Grip size={16} />
                  </button>
                )}
                {size.width >= 100 && size.height >= 100 && (
                  <ConfigureButton onClick={() => configure(widget.toolId)} />
                )}
                {menuControl}
              </header>
            )}
          </>
        )}
        <div className="widget-content" hidden={undersized}>
          {renderTool(widget)}
        </div>
        {arranging && (
          <button
            className="resize-handle"
            aria-label={`Resize ${title}`}
            title="Drag to resize; arrow keys resize one cell"
            onKeyDown={(event) => nudge(event, true)}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              resizeStart.current = {
                x: e.clientX,
                y: e.clientY,
                rect: widget,
                ...geometry(),
              };
              setDraft(widget);
            }}
            onPointerMove={(e) => {
              const start = resizeStart.current;
              if (!start) return;
              setDraft({
                ...start.rect,
                w: Math.max(
                  1,
                  start.rect.w +
                    Math.round((e.clientX - start.x) / start.stepX),
                ),
                h: Math.max(
                  1,
                  start.rect.h +
                    Math.round((e.clientY - start.y) / start.stepY),
                ),
              });
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              const start = resizeStart.current;
              if (start) {
                // React may not have rendered the final pointermove yet.
                const final = {
                  ...start.rect,
                  w: Math.max(
                    1,
                    start.rect.w +
                      Math.round((e.clientX - start.x) / start.stepX),
                  ),
                  h: Math.max(
                    1,
                    start.rect.h +
                      Math.round((e.clientY - start.y) / start.stepY),
                  ),
                };
                if (canPlace(screen, final, widget.id)) place(widget.id, final);
              }
              resizeStart.current = null;
              setDraft(null);
            }}
            onPointerCancel={() => {
              resizeStart.current = null;
              setDraft(null);
            }}
          >
            <Expand size={14} />
          </button>
        )}
      </section>
      {expanded && (
        <Modal
          title={title}
          wide
          actions={<ConfigureButton onClick={() => configure(widget.toolId)} />}
          onClose={() => {
            setExpanded(false);
            requestAnimationFrame(() => expandButton.current?.focus());
          }}
        >
          {renderTool(widget)}
        </Modal>
      )}
    </>
  );
}
export function Board(props: BoardProps) {
  const board = useRef<HTMLDivElement>(null);
  const dragPointer = useRef<{
    id: number;
    x: number;
    y: number;
    endX?: number;
    endY?: number;
  } | null>(null);
  useEffect(() => {
    const finish = (event: PointerEvent) => {
      const start = dragPointer.current;
      if (start?.id === event.pointerId) {
        start.endX = event.clientX;
        start.endY = event.clientY;
      }
    };
    // Capture the release before the sensor's end handler. Its rendered delta
    // can lag the last pointermove in WebKit or during a busy frame.
    document.addEventListener("pointerup", finish, true);
    return () => document.removeEventListener("pointerup", finish, true);
  }, []);
  const [announcement, setAnnouncement] = useState("");
  const { screen, arranging } = props;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const geometry = () => {
    const element = board.current!;
    return {
      stepX:
        (element.clientWidth +
          Math.min(12, (element.clientWidth * 0.25) / screen.grid.columns)) /
        screen.grid.columns,
      stepY:
        (element.clientHeight +
          Math.min(12, (element.clientHeight * 0.25) / screen.grid.rows)) /
        screen.grid.rows,
    };
  };
  return (
    <>
      <p className="sr-only" role="status">
        {announcement}
      </p>
      <div className="board-scroll">
        <DndContext
          sensors={sensors}
          onDragStart={(event) => {
            const pointer = event.activatorEvent;
            dragPointer.current =
              pointer instanceof PointerEvent
                ? {
                    id: pointer.pointerId,
                    x: pointer.clientX,
                    y: pointer.clientY,
                  }
                : null;
          }}
          onDragCancel={() => {
            dragPointer.current = null;
          }}
          accessibility={{
            screenReaderInstructions: {
              draggable:
                "In Arrange mode, use arrow keys to move one cell at a time, or drag this handle. Resize using the handle in the widget's lower corner.",
            },
          }}
          onDragEnd={(event) => {
            const pointer = dragPointer.current;
            dragPointer.current = null;
            const delta =
              pointer?.endX !== undefined && pointer.endY !== undefined
                ? { x: pointer.endX - pointer.x, y: pointer.endY - pointer.y }
                : event.delta;
            const widget = screen.widgets.find((w) => w.id === event.active.id);
            if (!widget) return;
            const steps = geometry();
            const rect = {
              ...widget,
              x: widget.x + Math.round(delta.x / steps.stepX),
              y: widget.y + Math.round(delta.y / steps.stepY),
            };
            if (canPlace(screen, rect, widget.id)) {
              props.place(widget.id, rect);
              setAnnouncement("Widget moved.");
            } else {
              setAnnouncement(
                "Cannot place there. The widget was returned to its original cells.",
              );
            }
          }}
        >
          <div
            ref={board}
            className={`board ${arranging ? "arranging" : ""}`}
            style={{
              gridTemplateColumns: `repeat(${screen.grid.columns}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${screen.grid.rows}, minmax(0, 1fr))`,
              // Keep gaps proportional on dense grids and short viewports.
              columnGap: `min(12px, ${25 / screen.grid.columns}%)`,
              rowGap: `min(12px, ${25 / screen.grid.rows}%)`,
            }}
          >
            {Array.from(
              { length: screen.grid.rows * screen.grid.columns },
              (_, index) => {
                const x = index % screen.grid.columns;
                const y = Math.floor(index / screen.grid.columns);
                if (!canPlace(screen, { x, y, w: 1, h: 1 })) return null;
                return (
                  <button
                    key={`cell-${index}`}
                    className="empty-cell"
                    style={{ gridColumn: x + 1, gridRow: y + 1 }}
                    aria-label={`Add widget at column ${x + 1}, row ${y + 1}`}
                    onClick={() => props.addAt(x, y)}
                  >
                    <Plus size={16} />
                  </button>
                );
              },
            )}
            {screen.widgets.map((widget) => (
              <Card
                key={widget.id}
                {...props}
                widget={widget}
                geometry={geometry}
                announce={setAnnouncement}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </>
  );
}
