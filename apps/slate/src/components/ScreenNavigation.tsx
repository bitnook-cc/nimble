import { useId, useLayoutEffect, useRef, useState } from "react";
import { PanelsTopLeft } from "lucide-react";
import type { Screen } from "../model";

export function ScreenNavigation({
  screens,
  activeId,
  select,
  manage,
}: {
  screens: Screen[];
  activeId: string;
  select: (id: string) => void;
  manage: () => void;
}) {
  const instanceId = useId();
  const navigation = useRef<HTMLDivElement>(null);
  const measureTabs = useRef<HTMLDivElement>(null);
  const dropdown = useRef<HTMLSelectElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const mode = useRef(false);
  const restoreFocus = useRef(false);
  const [tabsFit, setTabsFit] = useState(false);

  useLayoutEffect(() => {
    const area = navigation.current!;
    const tabs = measureTabs.current!;
    let mounted = true;
    const measure = () => {
      if (!mounted) return;
      const fits =
        window.innerWidth > 600 &&
        Math.ceil(tabs.getBoundingClientRect().width) <= area.clientWidth;
      if (fits === mode.current) return;
      restoreFocus.current = area.contains(document.activeElement);
      mode.current = fits;
      setTabsFit(fits);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    observer.observe(tabs);
    document.fonts.addEventListener("loadingdone", measure);
    void document.fonts.ready.then(measure);
    return () => {
      mounted = false;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", measure);
    };
  }, []);

  useLayoutEffect(() => {
    if (!restoreFocus.current) return;
    restoreFocus.current = false;
    if (tabsFit)
      buttons.current[screens.findIndex((s) => s.id === activeId)]?.focus();
    else dropdown.current?.focus();
  }, [tabsFit, screens, activeId]);

  return (
    <div className="screen-picker">
      <div ref={navigation} className="screen-navigation">
        <div className="screen-measure-clip" aria-hidden="true">
          <div ref={measureTabs} className="screen-tabs">
            {screens.map((screen) => (
              <span className="screen-tab" key={screen.id}>
                {screen.name}
              </span>
            ))}
          </div>
        </div>
        <div
          className="screen-tabs"
          role="tablist"
          aria-label="Campaign screens"
          hidden={!tabsFit}
        >
          {screens.map((screen, index) => (
            <button
              key={screen.id}
              ref={(button) => {
                buttons.current[index] = button;
              }}
              id={`${instanceId}-screen-${index}`}
              className="screen-tab"
              data-screen={screen.id}
              role="tab"
              aria-selected={screen.id === activeId}
              aria-controls="screen-panel"
              tabIndex={screen.id === activeId ? 0 : -1}
              onClick={() => select(screen.id)}
              onKeyDown={(event) => {
                const next =
                  event.key === "ArrowRight"
                    ? (index + 1) % screens.length
                    : event.key === "ArrowLeft"
                      ? (index - 1 + screens.length) % screens.length
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? screens.length - 1
                          : null;
                if (next === null) return;
                event.preventDefault();
                select(screens[next].id);
                buttons.current[next]?.focus();
              }}
            >
              {screen.name}
            </button>
          ))}
        </div>
        <select
          ref={dropdown}
          aria-label="Current screen"
          aria-controls="screen-panel"
          value={activeId}
          hidden={tabsFit}
          onChange={(event) => select(event.target.value)}
        >
          {screens.map((screen) => (
            <option key={screen.id} value={screen.id}>
              {screen.name}
            </option>
          ))}
        </select>
      </div>
      <button
        className="icon-button"
        aria-label="Manage screens"
        title="Manage screens"
        onClick={manage}
      >
        <PanelsTopLeft size={17} />
      </button>
    </div>
  );
}
