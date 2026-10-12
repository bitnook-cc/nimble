"use client";

import { campaigns } from "@nimble/shared";

import { useState } from "react";

import { Character } from "@/lib/schemas/character";

import { Button } from "../ui/button";
import { CampaignProps, Field, Panel, describe, formValues, inputClass, string } from "./shared";

export function Party({
  view,
  userId,
  command,
  busy,
  characters,
  sync,
}: CampaignProps & { characters: Character[]; sync: () => Promise<void> }) {
  const me = view.members.find((m) => m.userId === userId);
  const [selected, setSelected] = useState<string | null>(null);
  const member = view.members.find((m) => m.userId === selected);
  return (
    <div className="space-y-6">
      <Panel title="Your character">
        <p className="text-sm text-muted-foreground">
          Attach a synced character. GMs can read your sheet; other players see your name, level,
          health, and class. Your notes stay private unless you share them below.
        </p>
        <form
          key={`${me?.characterId}-${me?.shareNotes}`}
          className="flex flex-wrap items-end gap-3"
          onSubmit={async (e) => {
            const data = formValues(e);
            await command({
              type: "attach",
              characterId: string(data, "character") || null,
              shareNotes: data.has("notes"),
            });
          }}
        >
          <Field label="Character">
            <select name="character" className={inputClass} defaultValue={me?.characterId || ""}>
              <option value="">No character</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 py-2 text-sm">
            <input type="checkbox" name="notes" defaultChecked={me?.shareNotes} />
            Share character notes with GMs
          </label>
          <Button disabled={busy}>Save sharing</Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void sync()}>
            Sync characters
          </Button>
        </form>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {view.members.map((m) => (
          <MemberCard
            key={m.userId}
            member={m}
            ownerId={view.ownerId}
            canView={view.isGM || m.userId === userId}
            select={() => setSelected(m.userId)}
          />
        ))}
      </div>
      {member?.character && (view.isGM || member.userId === userId) && (
        <Panel title={`${describe(member.character.name)} — character sheet`}>
          <Button variant="ghost" onClick={() => setSelected(null)}>
            Close sheet
          </Button>
          <p className="text-sm text-muted-foreground">
            Read only · Last synced{" "}
            {member.syncedAt ? new Date(member.syncedAt).toLocaleString() : "never"}. Player edits
            appear after they sync.
          </p>
          <dl className="grid gap-4 md:grid-cols-2">
            {Object.entries(member.character)
              .filter(([key]) => !["id", "timestamps"].includes(key))
              .map(([key, value]) => (
                <div key={key} className="min-w-0 rounded-md bg-muted/40 p-3">
                  <dt className="text-sm font-semibold capitalize">
                    {key.replace(/^_/, "").replace(/([A-Z])/g, " $1")}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words text-sm">
                    {describe(value)}
                  </dd>
                </div>
              ))}
          </dl>
        </Panel>
      )}
      {(view.isGM || view.ownerId !== userId) && (
        <Panel title="Membership">
          {view.members
            .filter((m) => m.userId !== view.ownerId && (view.isGM || m.userId === userId))
            .map((m) => (
              <div key={m.userId} className="flex flex-wrap items-center gap-3">
                <span className="mr-auto">
                  {m.name} · {m.role === "GM" ? "GM" : "Player"}
                </span>
                {view.ownerId === userId && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void command({
                        type: "member",
                        userId: m.userId,
                        action: m.role === "GM" ? "PLAYER" : "GM",
                      })
                    }
                  >
                    {m.role === "GM" ? "Make player" : "Make GM"}
                  </Button>
                )}
                {(m.role !== "GM" || view.ownerId === userId || m.userId === userId) && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          m.userId === userId
                            ? "Leave this campaign? You will need an invite to return."
                            : `Remove ${m.name} from this campaign?`,
                        )
                      )
                        void command({ type: "member", userId: m.userId, action: "remove" });
                    }}
                  >
                    {m.userId === userId ? "Leave campaign" : "Remove member"}
                  </Button>
                )}
              </div>
            ))}
        </Panel>
      )}
    </div>
  );
}
function MemberCard({
  member: m,
  ownerId,
  canView,
  select,
}: {
  member: campaigns.MemberView;
  ownerId: string;
  canView: boolean;
  select: () => void;
}) {
  const stale = m.syncedAt && Date.now() - new Date(m.syncedAt).getTime() > 300000;
  return (
    <Panel title={m.character ? describe(m.character.name) : m.name}>
      <p className="text-sm">
        {m.name} · {m.userId === ownerId ? "Owner / GM" : m.role === "GM" ? "GM" : "Player"}
      </p>
      {m.character ? (
        <>
          <p>
            Level {describe(m.character.level)} · {describe(m.character.classId)}
          </p>
          <p className="text-sm">Health: {describe(m.character.hitPoints)}</p>
          <p className="text-xs text-muted-foreground">
            {stale ? "May be out of date · " : ""}Synced{" "}
            {m.syncedAt ? new Date(m.syncedAt).toLocaleString() : "never"}
          </p>
          {canView && (
            <Button variant="outline" onClick={select}>
              View character
            </Button>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No synced character attached.</p>
      )}
    </Panel>
  );
}
