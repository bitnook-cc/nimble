import { useState } from "react";
import { Settings2 } from "lucide-react";
import { TableSettings } from "./TableWidget";
import { UtilityEditor } from "./UtilityWidget";
import { utilitySchema } from "../utility-schema";
import { Modal } from "./Modal";
import { widgetTypes } from "../widgets";
import { changeRun, type Tool } from "../model";
import { setInitiativeMode, type InitiativeMode } from "../initiative";

export function ConfigureButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="icon-button configure-tool"
      aria-label="Configure tool"
      title="Configure"
      disabled={disabled}
      onClick={onClick}
    >
      <Settings2 size={15} aria-hidden="true" />
    </button>
  );
}

export function ToolSettings({
  tool,
  save,
  onClose,
}: {
  tool: Tool;
  save: (tool: Tool) => void;
  onClose: () => void;
}) {
  const utility = utilitySchema.safeParse(tool);
  if (tool.kind === "table")
    return <TableSettings tool={tool} save={save} onClose={onClose} />;
  return utility.success ? (
    <UtilityEditor tool={utility.data} save={save} onClose={onClose} />
  ) : (
    <ToolNameSettings tool={tool} save={save} onClose={onClose} />
  );
}

function ToolNameSettings({
  tool,
  save,
  onClose,
}: {
  tool: Tool;
  save: (tool: Tool) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(tool.name);
  const [mode, setMode] = useState<InitiativeMode>(
    tool.kind === "initiative" ? tool.run.mode : "nimble",
  );
  return (
    <Modal
      title={"Configure " + widgetTypes[tool.kind].title}
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          const next = { ...tool, name: name.trim() };
          save(
            next.kind === "initiative" && next.run.mode !== mode
              ? changeRun(next, setInitiativeMode(next.run, mode))
              : next,
          );
        }}
      >
        <label>
          Tool name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={80}
          />
        </label>
        {tool.kind === "initiative" && (
          <>
            <label>
              Initiative mode
              <select
                value={mode}
                onChange={(event) =>
                  setMode(event.target.value as InitiativeMode)
                }
              >
                <option value="nimble">Nimble</option>
                <option value="classic">D&D classic</option>
              </select>
            </label>
            <p className="hint">
              {mode === "nimble"
                ? "Heroes go first, then ordinary monsters. Legendary monsters act after each hero."
                : "Enter initiative totals before combat. All combatants, including legendary monsters, take turns in descending order."}
            </p>
            {mode !== tool.run.mode && (
              <p className="hint">
                Saving restarts turn progress and keeps combatants and HP. You
                can undo this change in the tracker.
              </p>
            )}
          </>
        )}
        <p className="hint">
          The name is shared by all widgets using this saved tool.
        </p>
        <button className="primary">Save tool</button>
      </form>
    </Modal>
  );
}
