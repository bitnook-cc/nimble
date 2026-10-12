import { useEffect, useState } from "react";
import {
  Clock3,
  Timer,
  TimerReset,
  Play,
  Pause,
  RotateCcw,
  Check,
} from "lucide-react";
import type { TimeTool } from "../utility-schema";
import {
  clockText,
  elapsed,
  remaining,
  timeText,
  toggleStopwatch,
  toggleTimer,
} from "../utilities";

function useNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const tick = setInterval(refresh, 250);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);
  return now;
}

export function TimeWidget({
  tool,
  update,
}: {
  tool: TimeTool;
  update: (fn: (tool: TimeTool) => TimeTool) => void;
}) {
  const now = useNow();
  const left = remaining(tool.timer, now);
  const expired = left === 0 && tool.timer.deadline !== null;
  const pending = expired && !tool.timer.acknowledged;
  const running =
    tool.mode === "timer"
      ? tool.timer.deadline !== null && !expired
      : tool.stopwatch.startedAt !== null;
  const action =
    tool.mode === "timer" && expired
      ? "Restart"
      : running
        ? "Pause"
        : "Start / resume";
  const modeStatus =
    tool.mode === "clock"
      ? "Local time"
      : tool.mode === "timer" && expired
        ? tool.timer.acknowledged
          ? "Time is up · acknowledged"
          : "Time is up"
        : running
          ? "Running"
          : "Paused";
  const status =
    tool.mode !== "timer" && pending
      ? modeStatus + " · timer finished"
      : modeStatus;
  const toggle = () =>
    update((t) => {
      const at = Date.now();
      if (t.mode === "stopwatch")
        return { ...t, stopwatch: toggleStopwatch(t.stopwatch, at) };
      if (t.mode !== "timer") return t;
      const done = remaining(t.timer, at) === 0 && t.timer.deadline !== null;
      return {
        ...t,
        timer: done
          ? {
              ...t.timer,
              deadline: at + t.timer.durationMs,
              remainingMs: t.timer.durationMs,
              acknowledged: false,
            }
          : toggleTimer(t.timer, at),
      };
    });
  const reset = () =>
    update((t) =>
      t.mode === "stopwatch"
        ? { ...t, stopwatch: { elapsedMs: 0, startedAt: null } }
        : t.mode === "timer"
          ? {
              ...t,
              timer: {
                ...t.timer,
                remainingMs: t.timer.durationMs,
                deadline: null,
                acknowledged: false,
              },
            }
          : t,
    );
  const extend = () =>
    update((t) => {
      const at = Date.now(),
        left = remaining(t.timer, at);
      if (left + 60000 > 604800000) return t;
      return {
        ...t,
        timer: {
          ...t.timer,
          remainingMs: left + 60000,
          deadline:
            t.timer.deadline === null
              ? null
              : Math.max(at, t.timer.deadline) + 60000,
          acknowledged: false,
        },
      };
    });
  return (
    <div className="time-widget">
      <div className="time-controls">
        <div className="time-modes" role="group" aria-label="Time modes">
          {(
            [
              ["clock", "Clock", Clock3],
              ["timer", "Timer", TimerReset],
              ["stopwatch", "Stopwatch", Timer],
            ] as const
          ).map(([mode, label, Icon]) => (
            <button
              key={mode}
              className="quiet time-button"
              aria-label={label + " mode"}
              title={
                label + (mode === "timer" && pending ? " · time is up" : "")
              }
              aria-pressed={tool.mode === mode}
              onClick={() => update((t) => ({ ...t, mode }))}
            >
              <Icon size={16} />
              {mode === "timer" &&
                (pending || (tool.timer.deadline !== null && !expired)) && (
                  <span
                    className={pending ? "time-dot expired" : "time-dot"}
                    aria-hidden="true"
                  />
                )}
              {mode === "stopwatch" && tool.stopwatch.startedAt !== null && (
                <span className="time-dot" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="time-face">
        <output
          className="time-display"
          role="timer"
          aria-live="off"
          aria-label={
            tool.mode === "clock"
              ? "Current time"
              : tool.mode === "timer"
                ? "Time remaining"
                : "Elapsed time"
          }
        >
          {tool.mode === "clock"
            ? clockText(now, tool.clockFormat)
            : timeText(
                tool.mode === "timer" ? left : elapsed(tool.stopwatch, now),
              )}
        </output>
        <span
          className={
            pending ? "time-status utility-complete" : "time-status hint"
          }
          role="status"
        >
          {status}
        </span>
      </div>
      {tool.mode !== "clock" && (
        <div className="time-actions">
          <button
            className="primary time-button"
            aria-label={action}
            title={action}
            onClick={toggle}
          >
            {action === "Restart" ? (
              <RotateCcw size={16} />
            ) : running ? (
              <Pause size={16} />
            ) : (
              <Play size={16} />
            )}
          </button>
          <button
            className="quiet time-button"
            aria-label="Reset"
            title="Reset"
            onClick={reset}
          >
            <RotateCcw size={16} />
          </button>
          {tool.mode === "timer" && (
            <button
              className="quiet time-button"
              aria-label="+1 minute"
              title="Add one minute"
              disabled={left + 60000 > 604800000}
              onClick={extend}
            >
              +1m
            </button>
          )}
          {tool.mode === "timer" && pending && (
            <button
              className="quiet time-button"
              aria-label="Acknowledge"
              title="Acknowledge expiry"
              onClick={() =>
                update((t) => ({
                  ...t,
                  timer: { ...t.timer, acknowledged: true },
                }))
              }
            >
              <Check size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
