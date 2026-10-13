import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { Minus, Plus } from "lucide-react";
import type { Utility } from "../utility-schema";

type ImageTool = Extract<Utility, { kind: "image" }>;
type View = Pick<ImageTool, "zoom" | "panX" | "panY">;
type Point = { x: number; y: number };
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
const position = (points: Map<number, Point>) => {
  const [a, b] = [...points.values()];
  return {
    center: b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : a,
    distance: b ? Math.hypot(b.x - a.x, b.y - a.y) : 0,
  };
};

// Pan is stored in the existing campaign units: 200 units = one viewport width.
function zoomAt(
  view: View,
  zoom: number,
  anchor: Point,
  width: number,
  height: number,
): View {
  zoom = clamp(zoom, 1, 4);
  const ratio = zoom / view.zoom;
  return {
    zoom,
    panX: clamp(
      view.panX * ratio + (anchor.x / width) * 200 * (1 - ratio),
      -300,
      300,
    ),
    panY: clamp(
      view.panY * ratio + (anchor.y / height) * 200 * (1 - ratio),
      -300,
      300,
    ),
  };
}

export function ImageViewport({
  tool,
  src,
  onError,
  update,
}: {
  tool: ImageTool;
  src: string;
  onError: () => void;
  update: (fn: (tool: ImageTool) => ImageTool) => void;
}) {
  const [view, setView] = useState<View>({
    zoom: tool.zoom,
    panX: tool.panX,
    panY: tool.panY,
  });
  const helpId = useId();
  const [dragging, setDragging] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const current = useRef<View>(view);
  const points = useRef(new Map<number, Point>());
  const start = useRef<{ view: View; center: Point; distance: number } | null>(
    null,
  );
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const latestUpdate = useRef(update);
  latestUpdate.current = update;
  const show = useCallback((next: View) => {
    current.current = next;
    setView(next);
  }, []);
  const commit = useCallback(() => {
    clearTimeout(wheelTimer.current);
    wheelTimer.current = undefined;
    const next = current.current;
    latestUpdate.current((t) => ({ ...t, ...next }));
  }, []);
  useEffect(() => {
    if (!points.current.size && !wheelTimer.current)
      show({ zoom: tool.zoom, panX: tool.panX, panY: tool.panY });
  }, [tool.zoom, tool.panX, tool.panY, show]);
  useEffect(() => {
    const element = viewport.current!;
    function wheel(e: WheelEvent) {
      e.preventDefault();
      if (points.current.size) return;
      const box = element.getBoundingClientRect();
      const delta =
        e.deltaY *
        (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? box.height : 1);
      show(
        zoomAt(
          current.current,
          current.current.zoom * Math.exp(-delta * 0.002),
          {
            x: e.clientX - box.left - box.width / 2,
            y: e.clientY - box.top - box.height / 2,
          },
          box.width,
          box.height,
        ),
      );
      clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(commit, 150);
    }
    // A non-passive listener lets wheel/trackpad zoom stay inside the card.
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", wheel);
      if (wheelTimer.current) commit();
    };
  }, [show, commit]);

  function rebase() {
    start.current = points.current.size
      ? { view: current.current, ...position(points.current) }
      : null;
  }
  function finish(e: PointerEvent<HTMLDivElement>) {
    if (!points.current.delete(e.pointerId)) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    rebase();
    if (!points.current.size) {
      setDragging(false);
      commit();
    }
  }
  function zoomBy(factor: number) {
    const box = viewport.current!.getBoundingClientRect();
    show(
      zoomAt(
        current.current,
        current.current.zoom * factor,
        { x: 0, y: 0 },
        box.width,
        box.height,
      ),
    );
    commit();
  }
  function fit() {
    clearTimeout(wheelTimer.current);
    wheelTimer.current = undefined;
    show({ zoom: 1, panX: 0, panY: 0 });
    latestUpdate.current((t) => ({
      ...t,
      zoom: 1,
      panX: 0,
      panY: 0,
      fit: "contain",
    }));
  }
  return (
    <>
      <div
        ref={viewport}
        className={`image-viewport${dragging ? " image-dragging" : ""}`}
        role="region"
        aria-label="Interactive image"
        aria-describedby={helpId}
        tabIndex={0}
        onPointerDown={(e) => {
          if (e.button !== 0 || points.current.size >= 2) return;
          e.preventDefault();
          e.currentTarget.focus({ preventScroll: true });
          clearTimeout(wheelTimer.current);
          wheelTimer.current = undefined;
          e.currentTarget.setPointerCapture(e.pointerId);
          points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          rebase();
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (!points.current.has(e.pointerId) || !start.current) return;
          points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          const { center, distance } = position(points.current);
          const initial = start.current;
          const box = e.currentTarget.getBoundingClientRect();
          const next = zoomAt(
            initial.view,
            initial.distance > 0
              ? (initial.view.zoom * distance) / initial.distance
              : initial.view.zoom,
            {
              x: initial.center.x - box.left - box.width / 2,
              y: initial.center.y - box.top - box.height / 2,
            },
            box.width,
            box.height,
          );
          show({
            ...next,
            panX: clamp(
              next.panX + ((center.x - initial.center.x) / box.width) * 200,
              -300,
              300,
            ),
            panY: clamp(
              next.panY + ((center.y - initial.center.y) / box.height) * 200,
              -300,
              300,
            ),
          });
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={finish}
        onKeyDown={(e) => {
          const directions: Record<string, Point> = {
            ArrowLeft: { x: -10, y: 0 },
            ArrowRight: { x: 10, y: 0 },
            ArrowUp: { x: 0, y: -10 },
            ArrowDown: { x: 0, y: 10 },
          };
          const direction = directions[e.key];
          if (direction) {
            e.preventDefault();
            show({
              ...current.current,
              panX: clamp(current.current.panX + direction.x, -300, 300),
              panY: clamp(current.current.panY + direction.y, -300, 300),
            });
            commit();
          } else if (["+", "=", "-", "0"].includes(e.key)) {
            e.preventDefault();
            if (e.key === "0") fit();
            else zoomBy(e.key === "-" ? 1 / 1.25 : 1.25);
          }
        }}
      >
        <img
          src={src}
          alt={tool.caption || "Campaign image"}
          draggable={false}
          style={{
            objectFit: tool.fit,
            transform: `translate(${view.panX / 2}%,${view.panY / 2}%) scale(${view.zoom})`,
          }}
          onError={onError}
        />
      </div>
      <div className="image-controls">
        <button
          className="icon-button"
          aria-label="Zoom out"
          disabled={view.zoom <= 1}
          onClick={() => zoomBy(1 / 1.25)}
        >
          <Minus size={15} />
        </button>
        <output aria-label="Image zoom">{Math.round(view.zoom * 100)}%</output>
        <button
          className="icon-button"
          aria-label="Zoom in"
          disabled={view.zoom >= 4}
          onClick={() => zoomBy(1.25)}
        >
          <Plus size={15} />
        </button>
        <button className="quiet" onClick={fit}>
          Fit image
        </button>
        <span className="sr-only" id={helpId}>
          Drag to pan. Scroll or pinch to zoom. Use arrow keys to pan, plus and
          minus to zoom, and zero to fit.
        </span>
      </div>
    </>
  );
}
