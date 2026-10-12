import { useState } from "react";
import { Settings2 } from "lucide-react";
import { TableSettings } from "./TableWidget";
import { UtilityEditor } from "./UtilityWidget";
import { utilitySchema } from "../utility-schema";
import { Modal } from "./Modal";
import { widgetTypes } from "../widgets";
import type { Tool } from "../model";

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
  return (
    <Modal
      title={"Configure " + widgetTypes[tool.kind].title}
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          save({ ...tool, name: name.trim() });
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
        <p className="hint">
          The name is shared by all widgets using this saved tool.
        </p>
        <button className="primary">Save tool</button>
      </form>
    </Modal>
  );
}
