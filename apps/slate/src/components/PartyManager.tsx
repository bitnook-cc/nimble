import { useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { Modal } from "./Modal";
import { uid, type Campaign } from "../model";
import { partyCharacterSchema, type PartyCharacter } from "../party";

export function PartyManager({
  campaign,
  update,
  locked,
  onClose,
}: {
  campaign: Campaign;
  update: (fn: (campaign: Campaign) => Campaign) => void;
  locked: boolean;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<PartyCharacter | "new" | null>(null);
  const [removing, setRemoving] = useState<PartyCharacter | null>(null);
  const [error, setError] = useState("");
  const characters = campaign.party.characters;
  return (
    <Modal title="Campaign party" onClose={onClose}>
      <p className="hint">
        {campaign.name} · {characters.length}{" "}
        {characters.length === 1 ? "PC" : "PCs"}. Add these characters to any
        initiative tracker with Add party.
      </p>
      <fieldset className="party-fieldset" disabled={locked}>
        {editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const fields = new FormData(event.currentTarget);
              const result = partyCharacterSchema.safeParse({
                id: editing === "new" ? uid() : editing.id,
                name: String(fields.get("name") ?? ""),
                playerName: String(fields.get("playerName") ?? ""),
                level: Number(fields.get("level")),
                hp: Number(fields.get("hp")),
                maxHp: Number(fields.get("maxHp")),
                notes: String(fields.get("notes") ?? ""),
                source: editing === "new" ? null : editing.source,
              });
              if (!result.success) {
                setError(result.error.issues[0].message);
                return;
              }
              const character = result.data;
              update((current) => ({
                ...current,
                party: {
                  ...current.party,
                  characters:
                    editing === "new"
                      ? [...current.party.characters, character]
                      : current.party.characters.map((pc) =>
                          pc.id === character.id ? character : pc,
                        ),
                },
              }));
              setEditing(null);
              setError("");
            }}
          >
            <h2 className="party-form-title">
              {editing === "new" ? "New character" : `Edit ${editing.name}`}
            </h2>
            <label>
              Character name
              <input
                name="name"
                required
                autoFocus
                maxLength={80}
                defaultValue={editing === "new" ? "" : editing.name}
              />
            </label>
            <label>
              Player name
              <input
                name="playerName"
                maxLength={80}
                placeholder="Optional"
                defaultValue={editing === "new" ? "" : editing.playerName}
              />
            </label>
            <div className="form-grid">
              <label>
                Level
                <input
                  name="level"
                  type="number"
                  required
                  min={1}
                  max={20}
                  defaultValue={editing === "new" ? 1 : editing.level}
                />
              </label>
              <label>
                Maximum HP
                <input
                  name="maxHp"
                  type="number"
                  required
                  min={1}
                  max={99999}
                  defaultValue={editing === "new" ? 20 : editing.maxHp}
                />
              </label>
              <label>
                Current HP
                <input
                  name="hp"
                  type="number"
                  required
                  min={0}
                  max={99999}
                  defaultValue={editing === "new" ? 20 : editing.hp}
                />
              </label>
            </div>
            <label>
              Notes
              <textarea
                name="notes"
                maxLength={500}
                placeholder="A short reminder for combat…"
                defaultValue={editing === "new" ? "" : editing.notes}
              />
            </label>
            <p className="hint">
              Existing encounters keep their own HP, names, and notes. Party
              edits apply when the character is added to a new encounter.
            </p>
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditing(null);
                  setError("");
                }}
              >
                Cancel edit
              </button>
              <button className="primary" type="submit">
                {editing === "new" ? "Save character" : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <>
            {characters.length ? (
              <ul className="party-list" aria-label="Party characters">
                {characters.map((character) => (
                  <li className="party-character" key={character.id}>
                    <div className="party-character-summary">
                      <strong>{character.name}</strong>
                      <small>
                        {character.playerName || "No player set"} · Level{" "}
                        {character.level} · {character.hp}/{character.maxHp} HP
                      </small>
                      {character.notes && <p>{character.notes}</p>}
                      {character.source && <small>Sidekick character</small>}
                    </div>
                    <div className="toolbar-actions">
                      <button
                        className="icon-button"
                        aria-label={`Edit ${character.name}`}
                        onClick={() => {
                          setEditing(character);
                          setError("");
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Remove ${character.name} from party`}
                        onClick={() => setRemoving(character)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="party-empty">
                <Users size={28} strokeWidth={1.3} />
                <h2>Your party is empty.</h2>
                <p>
                  Create simple PCs here to get your encounters started quickly.
                </p>
              </div>
            )}
            <div className="modal-actions">
              <button
                className="primary"
                disabled={characters.length >= 100}
                onClick={() => {
                  setEditing("new");
                  setError("");
                }}
              >
                <Plus size={16} />
                Add character
              </button>
            </div>
          </>
        )}
      </fieldset>
      {removing && (
        <Modal
          title={`Remove ${removing.name} from party?`}
          onClose={() => setRemoving(null)}
        >
          <p>
            This removes the character from the campaign party. Combatants
            already in encounters and their undo history are kept.
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setRemoving(null)}>
              Keep character
            </button>
            <button
              className="primary"
              disabled={locked}
              onClick={() => {
                update((current) => ({
                  ...current,
                  party: {
                    ...current.party,
                    characters: current.party.characters.filter(
                      (pc) => pc.id !== removing.id,
                    ),
                  },
                }));
                setRemoving(null);
              }}
            >
              Remove character
            </button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
