"use client";

import { useState, useMemo, useRef } from "react";
import { Plus, Trash2, Sword, Shield, ChevronDown, ChevronUp, Zap, X, Search } from "lucide-react";
import { MONSTER_SIZES, ARMOR_TYPES } from "@/lib/monsters/constants";
import {
  MONSTER_TABLE,
  getRowByIndex,
  getLevelIndex,
  getHpForArmor,
} from "@/lib/monsters/monster-table";
import {
  generateFormulas,
  generateFullTable,
  calculateAverageDamage,
  DIE_THEMES,
  type AttackFormula,
} from "@/lib/monsters/formula-generator";
import { MONSTER_ABILITIES } from "@/lib/monsters/abilities";
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

  const [showFullTable, setShowFullTable] = useState(false);
  const [showAbilityBrowser, setShowAbilityBrowser] = useState(false);
  const [abilityFilter, setAbilityFilter] = useState("");
  const [abilityCategoryFilter, setAbilityCategoryFilter] = useState<
    "offensive" | "defensive" | "neutral" | null
  >(null);
  const fullTable = useMemo(
    () => (showFullTable ? generateFullTable(damagePerRound) : []),
    [damagePerRound, showFullTable]
  );

  const filteredAbilities = useMemo(() => {
    return MONSTER_ABILITIES.filter((a) => {
      if (abilityCategoryFilter && a.category !== abilityCategoryFilter)
        return false;
      if (
        abilityFilter &&
        !a.name.toLowerCase().includes(abilityFilter.toLowerCase()) &&
        !a.description.toLowerCase().includes(abilityFilter.toLowerCase())
      )
        return false;
      return true;
    });
  }, [abilityFilter, abilityCategoryFilter]);

  function addAbilityAsPassive(ability: { name: string; description: string }) {
    update({
      passives: [...monster.passives, { name: ability.name, description: ability.description }],
    });
  }

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

  // Max offsets clamped by table bounds
  const maxPositiveOffset = Math.min(
    MONSTER_TABLE.length - 1 - baseIndex,
    baseIndex
  );
  const maxNegativeOffset = -maxPositiveOffset;

  // Drag handling for the balance indicator
  const barRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  // Store latest values in refs so drag handler doesn't need callback deps
  const configRef = useRef(config);
  configRef.current = config;
  const baseIndexRef = useRef(baseIndex);
  baseIndexRef.current = baseIndex;
  const maxOffsetsRef = useRef({ min: maxNegativeOffset, max: maxPositiveOffset });
  maxOffsetsRef.current = { min: maxNegativeOffset, max: maxPositiveOffset };

  function handleDrag(clientX: number) {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const { min, max } = maxOffsetsRef.current;
    const range = max - min;
    const offset = Math.round(min + percent * range);
    const clamped = Math.max(min, Math.min(max, offset));
    const bi = baseIndexRef.current;
    const newHpIndex = bi + clamped;
    const newDmgIndex = bi - clamped;
    if (
      newHpIndex < 0 || newHpIndex >= MONSTER_TABLE.length ||
      newDmgIndex < 0 || newDmgIndex >= MONSTER_TABLE.length
    ) return;
    syncMonster({
      ...configRef.current,
      hpLevelOffset: clamped,
      damageLevelOffset: -clamped,
    });
  }

  function handlePointerDown(e: React.PointerEvent) {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleDrag(e.clientX);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return;
    handleDrag(e.clientX);
  }

  function handlePointerUp() {
    isDragging.current = false;
  }

  function addSuggestedAttack(f: AttackFormula) {
    const cleanFormula = f.formula.replace(/^\(2×\)\s*/, "");
    const action: MonsterAction = {
      name: "",
      description: "",
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

  // Balance bar: use full available range
  const balanceValue = config.hpLevelOffset; // positive = more HP
  const barPercent = maxPositiveOffset === 0
    ? 50
    : ((balanceValue - maxNegativeOffset) / (maxPositiveOffset - maxNegativeOffset)) * 100;

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
            <div className="relative flex bg-muted rounded-lg p-1">
              {/* Sliding indicator */}
              <div
                className="absolute top-1 bottom-1 rounded-md bg-primary shadow-sm transition-all duration-200 ease-in-out"
                style={{
                  width: `calc(${100 / ARMOR_TYPES.length}% - 2px)`,
                  left: `calc(${(ARMOR_TYPES.indexOf(monster.armor as (typeof ARMOR_TYPES)[number]) * 100) / ARMOR_TYPES.length}% + 1px)`,
                }}
              />
              {ARMOR_TYPES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => handleArmorChange(a)}
                  className={`relative z-10 flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                    monster.armor === a
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
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
        <div className="mt-3 bg-card border border-border rounded-lg p-4 space-y-3">
          {/* Stats row */}
          <div className="flex justify-between text-sm">
            <div>
              <span className="font-semibold text-red-500">Dmg</span>{" "}
              <span className="text-foreground">{damagePerRound}/round</span>
              {config.damageLevelOffset > 0 && (
                <span className="text-red-400 text-xs ml-1">
                  +{config.damageLevelOffset} {config.damageLevelOffset === 1 ? "level" : "levels"}
                </span>
              )}
            </div>
            <div>
              {config.hpLevelOffset > 0 && (
                <span className="text-blue-400 text-xs mr-1">
                  +{config.hpLevelOffset} {config.hpLevelOffset === 1 ? "level" : "levels"}
                </span>
              )}
              <span className="font-semibold text-blue-500">HP</span>{" "}
              <span className="text-foreground">{hp}</span>
            </div>
          </div>

          {/* Gradient bar with draggable indicator */}
          <div
            ref={barRef}
            className="relative cursor-pointer select-none touch-none py-2"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div
              className="h-3 rounded-full"
              style={{
                background: "linear-gradient(to right, #ef4444, #f59e0b, #22c55e, #3b82f6)",
              }}
            />
            {/* Draggable indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-foreground shadow-md"
              style={{
                left: `calc(${Math.max(2, Math.min(98, barPercent))}% - 10px)`,
                transition: isDragging.current ? "none" : "left 0.2s ease",
              }}
            />
          </div>

          {/* Labels */}
          <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
            <span>Glass Cannon</span>
            <span>Balanced</span>
            <span>Tank</span>
          </div>

          {/* Sword / Reset / Shield buttons */}
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => shiftBalance(-1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card shadow-sm hover:bg-muted active:scale-95 transition-all"
              title="More damage, less HP"
            >
              <Sword className="w-3.5 h-3.5 text-red-500" />
              <span className="text-red-500">Damage</span>
            </button>
            {(config.damageLevelOffset !== 0 || config.hpLevelOffset !== 0) && (
              <button
                type="button"
                onClick={() =>
                  syncMonster({
                    ...config,
                    hpLevelOffset: 0,
                    damageLevelOffset: 0,
                  })
                }
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card shadow-sm hover:bg-muted active:scale-95 transition-all text-muted-foreground"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => shiftBalance(1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card shadow-sm hover:bg-muted active:scale-95 transition-all"
              title="More HP, less damage"
            >
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-blue-500">Survivability</span>
            </button>
          </div>
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
                  className="px-3 py-2 text-sm font-mono rounded-lg border border-border bg-card shadow-sm hover:border-primary hover:bg-primary/5 active:scale-95 transition-all cursor-pointer"
                >
                  {f.formula}
                  <span className="text-muted-foreground text-xs ml-1.5">
                    avg {f.averageDamage}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Expand full table */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowFullTable(!showFullTable)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showFullTable ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {showFullTable ? "Hide" : "Show"} all combinations
          </button>

          {showFullTable && fullTable.length > 0 && (
            <div className="mt-2 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                      #
                    </th>
                    {[4, 6, 8, 10, 12, 20].map((die) => (
                      <th
                        key={die}
                        className="px-2 py-1.5 text-center font-medium text-muted-foreground"
                      >
                        d{die}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fullTable.map((row) => (
                    <tr
                      key={row.diceCount}
                      className="border-t border-border hover:bg-muted/50"
                    >
                      <td className="px-2 py-1 text-muted-foreground font-medium">
                        {row.diceCount}
                      </td>
                      {[4, 6, 8, 10, 12, 20].map((die) => {
                        const formula = row.formulas[die];
                        if (!formula) {
                          return (
                            <td
                              key={die}
                              className="px-2 py-1 text-center text-muted-foreground/30"
                            >
                              —
                            </td>
                          );
                        }
                        return (
                          <td key={die} className="px-2 py-1 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                addSuggestedAttack({
                                  formula,
                                  averageDamage:
                                    calculateAverageDamage(formula) ??
                                    damagePerRound,
                                  attacks: 1,
                                })
                              }
                              className="font-mono text-foreground hover:text-primary hover:underline cursor-pointer"
                            >
                              {formula}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Ability Ideas Modal */}
      {showAbilityBrowser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAbilityBrowser(false);
          }}
        >
          <div className="rounded-xl shadow-xl border border-border w-full max-w-lg max-h-[80vh] flex flex-col mx-4" style={{ backgroundColor: "hsl(var(--color-card))" }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-heading font-bold text-foreground">
                Ability Ideas
              </h3>
              <button
                type="button"
                onClick={() => setShowAbilityBrowser(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter bar */}
            <div className="px-4 py-3 border-b border-border space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={abilityFilter}
                  onChange={(e) => setAbilityFilter(e.target.value)}
                  placeholder="Search abilities..."
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div className="flex gap-1.5">
                {(["all", "offensive", "defensive", "neutral"] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setAbilityCategoryFilter(
                          cat === "all" ? null : cat
                        )
                      }
                      className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                        (cat === "all" && abilityCategoryFilter === null) ||
                        abilityCategoryFilter === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {cat === "all"
                        ? "All"
                        : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Ability list */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <p className="text-xs text-muted-foreground mb-3">
                Click an ability to add it as a passive. Each offensive ability counts as +1 damage level, each defensive as +1 HP level.
              </p>
              {filteredAbilities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No abilities match your search.
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredAbilities.map((ability) => {
                    const iconColor =
                      ability.category === "offensive"
                        ? "text-red-500"
                        : ability.category === "defensive"
                          ? "text-blue-500"
                          : "text-muted-foreground";
                    const hoverClass =
                      ability.category === "offensive"
                        ? "hover:border-red-300 hover:bg-red-50"
                        : ability.category === "defensive"
                          ? "hover:border-blue-300 hover:bg-blue-50"
                          : "hover:border-muted-foreground hover:bg-muted/50";
                    const costLabel =
                      ability.category === "offensive"
                        ? "+1 dmg level"
                        : ability.category === "defensive"
                          ? "+1 HP level"
                          : "no cost";
                    return (
                      <button
                        key={ability.id}
                        type="button"
                        onClick={() => {
                          addAbilityAsPassive(ability);
                          setShowAbilityBrowser(false);
                        }}
                        className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border transition-all cursor-pointer ${hoverClass}`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {ability.category === "offensive" ? (
                            <Sword className={`w-4 h-4 ${iconColor}`} />
                          ) : ability.category === "defensive" ? (
                            <Shield className={`w-4 h-4 ${iconColor}`} />
                          ) : (
                            <Zap className={`w-4 h-4 ${iconColor}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {ability.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {costLabel}
                            </span>
                          </div>
                          <p className="text-xs mt-0.5 text-muted-foreground">
                            {ability.description}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 shrink-0 mt-1 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-4 py-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setShowAbilityBrowser(false)}
                className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F. Identity */}
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAbilityBrowser(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted active:scale-95 transition-all"
            >
              <Search className="w-3.5 h-3.5" /> Ideas
            </button>
            <button
              type="button"
              onClick={addPassive}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
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
                className="self-start p-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/5 active:scale-95 transition-all"
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
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 active:scale-95 transition-all"
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
                  <div className="relative">
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
                    {a.diceFormula && calculateAverageDamage(a.diceFormula) !== null && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        avg {calculateAverageDamage(a.diceFormula)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeAction(i)}
                className="self-start p-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/5 active:scale-95 transition-all"
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
