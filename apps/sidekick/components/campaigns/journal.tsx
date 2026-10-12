"use client";

import { useState } from "react";

import { Button } from "../ui/button";
import { CampaignProps, Field, Panel, formValues, inputClass, string, uid } from "./shared";

export function Journal({ view, command, busy }: CampaignProps) {
  const [newId, setNewId] = useState(uid);
  const [editing, setEditing] = useState<string | null>(null);
  const entry = view.state.journal.find((j) => j.id === editing);
  return (
    <div className="space-y-6">
      {!view.state.journal.length && (
        <Panel title="Campaign journal">
          <p className="text-sm text-muted-foreground">
            Keep quests, discoveries, and handouts together. Your GM can share an entry when it is
            ready for the party.
          </p>
        </Panel>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {view.state.journal.map((j) => (
          <Panel key={j.id} title={j.title}>
            <p className="text-xs uppercase text-muted-foreground">
              {j.kind} · {j.visibility === "gm" ? "GM only" : "Shared with party"}
              {j.completed ? " · Completed" : ""}
            </p>
            <p className="whitespace-pre-wrap break-words text-sm">{j.body}</p>
            {view.isGM && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setEditing(j.id)}>
                  Edit
                </Button>
                {j.kind === "quest" && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void command({ type: "journal", entry: { ...j, completed: !j.completed } })
                    }
                  >
                    {j.completed ? "Reopen quest" : "Complete quest"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void command({
                      type: "journal",
                      entry: { ...j, visibility: j.visibility === "gm" ? "party" : "gm" },
                    })
                  }
                >
                  {j.visibility === "gm" ? "Reveal to party" : "Make GM only"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`Delete ${j.title}?`))
                      void command({ type: "delete", collection: "journal", id: j.id });
                  }}
                >
                  Delete
                </Button>
              </div>
            )}
          </Panel>
        ))}
      </div>
      {view.isGM && (
        <Panel title={entry ? "Edit journal entry" : "New journal entry"}>
          <form
            key={entry?.id || "new"}
            className="grid gap-4"
            onSubmit={async (e) => {
              const form = e.currentTarget;
              const d = formValues(e);
              const ok = await command({
                type: "journal",
                entry: {
                  id: entry?.id || newId,
                  title: string(d, "title"),
                  body: string(d, "body"),
                  kind: string(d, "kind") as "note" | "quest" | "handout",
                  visibility: string(d, "visibility") as "gm" | "party",
                  completed: entry?.completed || false,
                },
              });
              if (ok) {
                setEditing(null);
                setNewId(uid());
                form.reset();
              }
            }}
          >
            <Field label="Title">
              <input
                className={inputClass}
                name="title"
                maxLength={120}
                required
                defaultValue={entry?.title}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <select className={inputClass} name="kind" defaultValue={entry?.kind || "note"}>
                  <option value="note">Note</option>
                  <option value="quest">Quest</option>
                  <option value="handout">Handout</option>
                </select>
              </Field>
              <Field label="Who can see this?">
                <select
                  className={inputClass}
                  name="visibility"
                  defaultValue={entry?.visibility || "gm"}
                >
                  <option value="gm">GM only</option>
                  <option value="party">Entire party</option>
                </select>
              </Field>
            </div>
            <Field label="Content">
              <textarea
                className={inputClass}
                name="body"
                rows={7}
                maxLength={10000}
                defaultValue={entry?.body}
              />
            </Field>
            <div className="flex gap-2">
              <Button disabled={busy}>Save entry</Button>
              {entry && (
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        </Panel>
      )}
    </div>
  );
}

export function Sessions({ view, command, busy }: CampaignProps) {
  const [newId, setNewId] = useState(uid);
  const [editing, setEditing] = useState<string | null>(null);
  const entry = view.state.sessions.find((s) => s.id === editing);
  return (
    <div className="space-y-6">
      {!view.state.sessions.length && (
        <Panel title="Session history">
          <p className="text-sm text-muted-foreground">
            Plan your next game and keep a recap of each adventure here.
          </p>
        </Panel>
      )}
      {view.state.sessions.map((s) => (
        <Panel key={s.id} title={s.title}>
          <p className="text-sm text-muted-foreground">
            {s.status} · {s.scheduledFor || "Date to be arranged"}
          </p>
          <p className="text-sm whitespace-pre-wrap">{s.summary || "No recap yet."}</p>
          {view.isGM && s.gmNotes && (
            <div className="border-l-2 pl-3">
              <h3 className="text-sm font-semibold">GM notes</h3>
              <p className="text-sm whitespace-pre-wrap">{s.gmNotes}</p>
            </div>
          )}
          <div className="text-sm">
            {view.state.runs
              .filter((r) => r.sessionId === s.id)
              .map((r) => (
                <p key={r.id}>
                  {r.name} · {r.status} · {r.round} rounds
                </p>
              ))}
          </div>
          {view.isGM && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(s.id)}>
                Edit session
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Delete ${s.title}?`))
                    void command({ type: "delete", collection: "sessions", id: s.id });
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </Panel>
      ))}
      {view.isGM && (
        <Panel title={entry ? "Edit session" : "Plan a session"}>
          <form
            key={entry?.id || "new"}
            className="grid gap-4"
            onSubmit={async (e) => {
              const form = e.currentTarget;
              const d = formValues(e);
              if (
                await command({
                  type: "session",
                  entry: {
                    id: entry?.id || newId,
                    title: string(d, "title"),
                    scheduledFor: string(d, "date"),
                    status: string(d, "status") as "planned" | "active" | "completed",
                    summary: string(d, "summary"),
                    gmNotes: string(d, "gmNotes"),
                  },
                })
              ) {
                setEditing(null);
                setNewId(uid());
                form.reset();
              }
            }}
          >
            <Field label="Session title">
              <input
                className={inputClass}
                name="title"
                maxLength={120}
                required
                defaultValue={entry?.title}
              />
            </Field>
            <Field label="Date and time (include timezone)">
              <input
                className={inputClass}
                name="date"
                maxLength={100}
                defaultValue={entry?.scheduledFor}
                placeholder="Saturday 7pm Sydney"
              />
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                name="status"
                defaultValue={entry?.status || "planned"}
              >
                <option value="planned">Planned</option>
                <option value="active">Playing now</option>
                <option value="completed">Completed</option>
              </select>
            </Field>
            <Field label="Party recap">
              <textarea
                className={inputClass}
                name="summary"
                maxLength={10000}
                rows={4}
                defaultValue={entry?.summary}
              />
            </Field>
            <Field label="Private GM notes">
              <textarea
                className={inputClass}
                name="gmNotes"
                maxLength={10000}
                rows={4}
                defaultValue={entry?.gmNotes}
              />
            </Field>
            <div className="flex gap-2">
              <Button disabled={busy}>Save session</Button>
              {entry && (
                <Button variant="outline" type="button" onClick={() => setEditing(null)}>
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        </Panel>
      )}
    </div>
  );
}
