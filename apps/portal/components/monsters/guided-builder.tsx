"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Minus } from "lucide-react";
import { MONSTER_SIZES, ARMOR_TYPES } from "@/lib/monsters/constants";
import {
  MONSTER_TABLE,
  getRowByIndex,
  getLevelIndex,
  getHpForArmor,
} from "@/lib/monsters/monster-table";
import {
  generateFormulas,
  DIE_THEMES,
  type AttackFormula,
} from "@/lib/monsters/formula-generator";
import type {
  AnyMonster,
  ArmorType,
  BuilderConfig,
  MonsterPassive,
  MonsterAction,
} from "@/lib/monsters/types";

interface GuidedBuilderProps {
  monster: AnyMonster;
  onChange: (monster: AnyMonster) => void;
}

function formatLevel(level: number): string {
  if (level === 0.25) return "1/4";
  if (level === 0.33) return "1/3";
  if (level === 0.5) return "1/2";
  return String(level);
}

const LEVEL_OPTIONS = MONSTER_TABLE.map((row) => ({
  value: row.level,
  label: formatLevel(row.level),
}));

export function GuidedBuilder({ monster, onChange }: GuidedBuilderProps) {
  const [config, setConfig] = useState<BuilderConfig>(() => {
    if (monster.builderConfig) return { ...monster.builderConfig };
    return {
      baseLevel: monster.level || 1,
      hpLevelOffset: 0,
      damageLevelOffset: 0,
      dieSize: 8,
    };
  });

  const baseIndex = getLevelIndex(config.baseLevel);
  const hpIndex = Math.max(
    0,
    Math.min(baseIndex + config.hpLevelOffset, MONSTER_TABLE.length - 1)
  );
  const dmgIndex = Math.max(
    0,
    Math.min(baseIndex + config.damageLevelOffset, MONSTER_TABLE.length - 1)
  );

  const baseRow = getRowByIndex(baseIndex);
  const hpRow = getRowByIndex(hpIndex);
  const dmgRow = getRowByIndex(dmgIndex);

  const hp = getHpForArmor(hpRow, monster.armor as "None" | "Medium" | "Heavy");
  const damagePerRound = dmgRow.damagePerRound;
  const saveDC = baseRow.saveDC;

  const formulas = useMemo(
    () => generateFormulas(damagePerRound, config.dieSize),
    [damagePerRound, config.dieSize]
  );

  function syncMonster(newConfig: BuilderConfig, armorOverride?: ArmorType) {
    const newBaseIndex = getLevelIndex(newConfig.baseLevel);
    const newHpIndex = Math.max(
      0,
      Math.min(newBaseIndex + newConfig.hpLevelOffset, MONSTER_TABLE.length - 1)
    );
    const newHpRow = getRowByIndex(newHpIndex);
    const armor = armorOverride ?? monster.armor;
    const newHp = getHpForArmor(
      newHpRow,
      armor as "None" | "Medium" | "Heavy"
    );

    setConfig(newConfig);
    onChange({
      ...monster,
      level: newConfig.baseLevel,
      hitPoints: newHp,
      armor,
      builderConfig: newConfig,
    } as AnyMonster);
  }

  function handleLevelChange(level: number) {
    const newConfig: BuilderConfig = {
      ...config,
      baseLevel: level,
      hpLevelOffset: 0,
      damageLevelOffset: 0,
    };
    syncMonster(newConfig);
  }

  function handleArmorChange(armor: ArmorType) {
    syncMonster(config, armor);
  }

  function shiftBalance(direction: number) {
    // +1 = more survivability (hp up, damage down)
    // -1 = more damage (damage up, hp down)
    const newHpOffset = config.hpLevelOffset + direction;
    const newDmgOffset = config.damageLevelOffset - direction;

    const newHpIndex = baseIndex + newHpOffset;
    const newDmgIndex = baseIndex + newDmgOffset;
    if (
      newHpIndex < 0 ||
      newHpIndex >= MONSTER_TABLE.length ||
      newDmgIndex < 0 ||
      newDmgIndex >= MONSTER_TABLE.length
    )
      return;

    syncMonster({
      ...config,
      hpLevelOffset: newHpOffset,
      damageLevelOffset: newDmgOffset,
    });
  }

  function addSuggestedAttack(f: AttackFormula) {
    const isMulti = f.attacks > 1;
    const cleanFormula = f.formula.replace(/^\(2×\)\s*/, "");
    const name = isMulti ? "Multiattack" : "Attack";
    const desc = isMulti
      ? `Makes 2 attacks. Each: ${cleanFormula} damage.`
      : `${f.formula} damage.`;
    const action: MonsterAction = {
      name,
      description: desc,
      reach: 1,
      diceFormula: cleanFormula,
    };
    onChange({
      ...monster,
      actions: [...monster.actions, action],
    } as AnyMonster);
  }

  function update(patch: Partial<AnyMonster>) {
    onChange({ ...monster, ...patch } as AnyMonster);
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
  const sectionHeader =
    "text-sm font-heading font-bold text-foreground uppercase tracking-wide";

  // Balance bar: range -5 to +5 mapped visually
  const balanceRange = 5;
  const balanceValue = config.hpLevelOffset; // positive = more HP
  const barPercent =
    ((balanceValue + balanceRange) / (balanceRange * 2)) * 100;

  return (
    <div className="space-y-6">
      {/* A. Reference Bar */}
      <div className="bg-muted rounded-md px-4 py-3 flex items-center justify-between gap-4 text-sm">
        <div className="text-center">
          <div className="text-muted-foreground text-xs">Level</div>
          <div className="font-bold">{formatLevel(config.baseLevel)}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground text-xs">HP ({monster.armor})</div>
          <div className="font-bold">{hp}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground text-xs">Dmg/Round</div>
          <div className="font-bold">{damagePerRound}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground text-xs">Save DC</div>
          <div className="font-bold">{saveDC}</div>
        </div>
      </div>

      {/* B. Level & Armor */}
      <div>
        <h4 className={sectionHeader}>Level & Armor</h4>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Level</label>
            <select
              value={config.baseLevel}
              onChange={(e) => handleLevelChange(parseFloat(e.target.value))}
              className={inputClass}
            >
              {LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Armor</label>
            <div className="flex gap-1">
              {ARMOR_TYPES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => handleArmorChange(a)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    monster.armor === a
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* C. Balance Dial */}
      <div>
        <h4 className={sectionHeader}>Balance</h4>
        <div className="mt-2 text-xs text-muted-foreground text-center mb-2">
          More Damage ← → More Survivability
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => shiftBalance(-1)}
            className="p-2 rounded-md bg-muted text-muted-foreground hover:text-foreground"
            title="More damage, less HP"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Dmg {damagePerRound}
                {config.damageLevelOffset !== 0 && (
                  <span className="text-primary ml-1">
                    ({config.damageLevelOffset > 0 ? "+" : ""}
                    {config.damageLevelOffset})
                  </span>
                )}
              </span>
              <span>
                HP {hp}
                {config.hpLevelOffset !== 0 && (
                  <span className="text-primary ml-1">
                    ({config.hpLevelOffset > 0 ? "+" : ""}
                    {config.hpLevelOffset})
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.max(5, Math.min(95, barPercent))}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => shiftBalance(1)}
            className="p-2 rounded-md bg-muted text-muted-foreground hover:text-foreground"
            title="More HP, less damage"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* D. Die Size & Attacks */}
      <div>
        <h4 className={sectionHeader}>Die Size & Attacks</h4>
        <div className="mt-2">
          <label className={labelClass}>Die Size</label>
          <select
            value={config.dieSize}
            onChange={(e) => {
              const newConfig = { ...config, dieSize: parseInt(e.target.value) };
              setConfig(newConfig);
              onChange({
                ...monster,
                builderConfig: newConfig,
              } as AnyMonster);
            }}
            className={inputClass}
          >
            {DIE_THEMES.map((d) => (
              <option key={d.size} value={d.size}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        {formulas.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-muted-foreground mb-2">
              Suggested Attacks (click to add)
            </div>
            <div className="flex flex-wrap gap-2">
              {formulas.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => addSuggestedAttack(f)}
                  className="px-3 py-1.5 text-xs rounded-md bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {f.formula}{" "}
                  <span className="text-muted-foreground">
                    (avg {f.averageDamage})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* E. Identity */}
      <div>
        <h4 className={sectionHeader}>Identity</h4>
        <div className="mt-2 space-y-3">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Size</label>
              <select
                value={monster.size}
                onChange={(e) =>
                  update({ size: e.target.value as AnyMonster["size"] })
                }
                className={inputClass}
              >
                {MONSTER_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
        </div>
      </div>

      {/* F. Passives */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className={sectionHeader}>Passives</h4>
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

      {/* G. Actions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className={sectionHeader}>Actions</h4>
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

      {/* H. Notes */}
      <div>
        <h4 className={sectionHeader}>Notes</h4>
        <textarea
          value={monster.notes ?? ""}
          onChange={(e) => update({ notes: e.target.value || undefined })}
          placeholder="Additional notes..."
          rows={3}
          className={`mt-2 ${inputClass}`}
        />
      </div>
    </div>
  );
}
