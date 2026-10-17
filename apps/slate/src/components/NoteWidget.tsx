import { useState } from "react";
import type { NoteTool } from "../model";
import { updateNote } from "../notes";
import { useContent } from "./ContentWorkspace";
import { Markdown } from "./Markdown";
import { ReferenceTextarea } from "./ReferenceTextarea";

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
  return (
    <div className="note-widget">
      <div className="content-actions">
        <button
          className="quiet"
          onClick={() => {
            setEditing((v) => !v);
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
          <ReferenceTextarea
            aria-label="Note text"
            value={body}
            onTextChange={updateBody}
            all={all}
            excludeTarget={`local::${tool.noteId}`}
            maxLength={100000}
            placeholder="Write Markdown. Type @ to link a rule, spell, item, monster or note…"
          />
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
