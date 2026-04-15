"use client";

import { Plus, Trash2 } from "lucide-react";
import { MONSTER_SIZES, ARMOR_TYPES } from "@/lib/monsters/constants";
import type {
  MonsterPassive,
  MonsterAction,
  MonsterKind,
  AnyMonster,
} from "@/lib/monsters/types";


interface MonsterFormProps {
  monster: AnyMonster;
  onChange: (monster: AnyMonster) => void;
}

export function MonsterForm({ monster, onChange }: MonsterFormProps) {
  function update(patch: Partial<AnyMonster>) {
    onChange({ ...monster, ...patch } as AnyMonster);
  }

  function updateSave(key: string, value: number) {
    update({
      saves: {
        ...monster.saves,
        [key]: value,
      },
    });
  }

  function switchKind(kind: MonsterKind) {
    if (kind === monster.kind) return;
    if (kind === "standard") {
      // Strip legendary fields
      const { ...base } = monster;
      const cleaned = { ...base, kind: "standard" as const };
      if ("bloodied" in cleaned) delete (cleaned as Record<string, unknown>).bloodied;
      if ("lastStand" in cleaned) delete (cleaned as Record<string, unknown>).lastStand;
      onChange(cleaned as AnyMonster);
    } else {
      onChange({
        ...monster,
        kind: "legendary",
      } as AnyMonster);
    }
  }

  // Passive helpers
  function addPassive() {
    update({ passives: [...monster.passives, { name: "", description: "" }] });
  }
  function removePassive(index: number) {
    update({ passives: monster.passives.filter((_, i) => i !== index) });
  }
  function updatePassive(index: number, patch: Partial<MonsterPassive>) {
    update({
      passives: monster.passives.map((p, i) =>
        i === index ? { ...p, ...patch } : p
      ),
    });
  }

  // Action helpers
  function addAction() {
    update({
      actions: [
        ...monster.actions,
        { name: "", description: "", reach: 1, diceFormula: "" },
      ],
    });
  }
  function removeAction(index: number) {
    update({ actions: monster.actions.filter((_, i) => i !== index) });
  }
  function updateAction(index: number, patch: Partial<MonsterAction>) {
    update({
      actions: monster.actions.map((a, i) =>
        i === index ? { ...a, ...patch } : a
      ),
    });
  }

  const labelClass = "block text-sm font-medium text-foreground mb-1";
  const inputClass =
    "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="space-y-6">
      {/* Kind Toggle */}
      <div>
        <label className={labelClass}>Kind</label>
        <div className="flex gap-2">
          {(["standard", "legendary"] as MonsterKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => switchKind(k)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                monster.kind === k
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {k === "standard" ? "Standard" : "Legendary"}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className={labelClass}>Name</label>
        <input
          type="text"
          value={monster.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Monster name"
          className={inputClass}
        />
      </div>

      {/* Level + Size */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Level</label>
          <input
            type="number"
            step={0.01}
            value={monster.level}
            onChange={(e) => update({ level: parseFloat(e.target.value) || 0 })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Size</label>
          <select
            value={monster.size}
            onChange={(e) => update({ size: e.target.value as AnyMonster["size"] })}
            className={inputClass}
          >
            {MONSTER_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Type + Group */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Type</label>
          <input
            type="text"
            value={monster.type ?? ""}
            onChange={(e) => update({ type: e.target.value || undefined })}
            placeholder="e.g. Undead"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Group</label>
          <input
            type="text"
            value={monster.group ?? ""}
            onChange={(e) => update({ group: e.target.value || undefined })}
            placeholder="e.g. Goblinoid"
            className={inputClass}
          />
        </div>
      </div>

      {/* Core Stats */}
      <div>
        <h4 className="text-sm font-heading font-bold text-foreground mb-2">
          Core Stats
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Hit Points</label>
            <input
              type="number"
              value={monster.hitPoints}
              onChange={(e) =>
                update({ hitPoints: parseInt(e.target.value) || 0 })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Armor</label>
            <select
              value={monster.armor}
              onChange={(e) =>
                update({ armor: e.target.value as AnyMonster["armor"] })
              }
              className={inputClass}
            >
              {ARMOR_TYPES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Speed</label>
            <input
              type="number"
              value={monster.speed}
              onChange={(e) =>
                update({ speed: parseInt(e.target.value) || 0 })
              }
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Saves */}
      <div>
        <h4 className="text-sm font-heading font-bold text-foreground mb-2">
          Saves
        </h4>
        <div className="grid grid-cols-4 gap-4">
          {(
            [
              ["strength", "STR"],
              ["dexterity", "DEX"],
              ["intelligence", "INT"],
              ["will", "WIL"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <input
                type="number"
                value={monster.saves?.[key] ?? 0}
                onChange={(e) =>
                  updateSave(key, parseInt(e.target.value) || 0)
                }
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Passives */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-heading font-bold text-foreground">
            Passives
          </h4>
          <button
            type="button"
            onClick={addPassive}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="space-y-3">
          {monster.passives.map((p, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updatePassive(i, { name: e.target.value })}
                  placeholder="Passive name"
                  className={inputClass}
                />
                <textarea
                  value={p.description}
                  onChange={(e) =>
                    updatePassive(i, { description: e.target.value })
                  }
                  placeholder="Description"
                  rows={2}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => removePassive(i)}
                className="self-start p-2 text-destructive hover:text-destructive/80"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-heading font-bold text-foreground">
            Actions
          </h4>
          <button
            type="button"
            onClick={addAction}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="space-y-3">
          {monster.actions.map((a, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={a.name}
                  onChange={(e) => updateAction(i, { name: e.target.value })}
                  placeholder="Action name"
                  className={inputClass}
                />
                <textarea
                  value={a.description}
                  onChange={(e) =>
                    updateAction(i, { description: e.target.value })
                  }
                  placeholder="Description"
                  rows={2}
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={a.reach ?? 1}
                    onChange={(e) =>
                      updateAction(i, {
                        reach: parseInt(e.target.value) || 1,
                      })
                    }
                    placeholder="Reach"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={a.diceFormula ?? ""}
                    onChange={(e) =>
                      updateAction(i, {
                        diceFormula: e.target.value || undefined,
                      })
                    }
                    placeholder="Dice formula"
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeAction(i)}
                className="self-start p-2 text-destructive hover:text-destructive/80"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          value={monster.notes ?? ""}
          onChange={(e) => update({ notes: e.target.value || undefined })}
          placeholder="Additional notes..."
          rows={3}
          className={inputClass}
        />
      </div>
    </div>
  );
}
