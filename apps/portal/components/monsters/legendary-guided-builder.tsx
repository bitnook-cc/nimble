"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Sword, Shield, Search, X, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { MONSTER_SIZES } from "@/lib/monsters/constants";
import {
  LEGENDARY_TABLE,
  getLegendaryRowByLevel,
  getLegendaryHpForArmor,
} from "@/lib/monsters/legendary-table";
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
  LegendaryMonster,
  BuilderConfig,
  MonsterPassive,
  MonsterAction,
  MonsterPhase,
} from "@/lib/monsters/types";

interface LegendaryGuidedBuilderProps {
  monster: AnyMonster;
  onChange: (monster: AnyMonster) => void;
}

const LEGENDARY_ARMOR_TYPES = ["Medium", "Heavy"] as const;
type LegendaryArmor = (typeof LEGENDARY_ARMOR_TYPES)[number];

const LEVEL_OPTIONS = LEGENDARY_TABLE.map((row) => ({
  value: row.level,
  label: String(row.level),
}));

export function LegendaryGuidedBuilder({ monster, onChange }: LegendaryGuidedBuilderProps) {
  const legendary = monster as LegendaryMonster;

  const [config, setConfig] = useState<BuilderConfig>(() => {
    if (monster.builderConfig) return { ...monster.builderConfig };
    return {
      baseLevel: monster.level || 5,
      hpLevelOffset: 0,
      damageLevelOffset: 0,
      dieSize: 8,
    };
  });

  const row = getLegendaryRowByLevel(config.baseLevel);
  const armor = (monster.armor === "Heavy" ? "Heavy" : "Medium") as LegendaryArmor;
  const hp = row ? getLegendaryHpForArmor(row, armor) : 150;
  const lastStandHp = row?.hpLastStand ?? 50;
  const saveDC = row?.saveDC ?? 12;
  const damageSmall = row?.damageSmall ?? 12;
  const damageBig = row?.damageBig ?? 24;

  const smallFormulas = useMemo(
    () => generateFormulas(damageSmall, config.dieSize),
    [damageSmall, config.dieSize]
  );
  const bigFormulas = useMemo(
    () => generateFormulas(damageBig, config.dieSize),
    [damageBig, config.dieSize]
  );

  const [showSmallTable, setShowSmallTable] = useState(false);
  const [showBigTable, setShowBigTable] = useState(false);
  const [showAbilityBrowser, setShowAbilityBrowser] = useState(false);
  const [abilityFilter, setAbilityFilter] = useState("");
  const [abilityCategoryFilter, setAbilityCategoryFilter] = useState<
    "offensive" | "defensive" | "neutral" | null
  >(null);

  const smallFullTable = useMemo(
    () => (showSmallTable ? generateFullTable(damageSmall) : []),
    [damageSmall, showSmallTable]
  );
  const bigFullTable = useMemo(
    () => (showBigTable ? generateFullTable(damageBig) : []),
    [damageBig, showBigTable]
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

  // --- Sync & update helpers ---

  function syncMonster(newConfig: BuilderConfig, armorOverride?: LegendaryArmor) {
    const newRow = getLegendaryRowByLevel(newConfig.baseLevel);
    const a = armorOverride ?? armor;
    const newHp = newRow ? getLegendaryHpForArmor(newRow, a) : hp;

    setConfig(newConfig);
    onChange({
      ...monster,
      level: newConfig.baseLevel,
      hitPoints: newHp,
      armor: a,
      builderConfig: newConfig,
    } as AnyMonster);
  }

  function handleLevelChange(level: number) {
    syncMonster({ ...config, baseLevel: level });
  }

  function handleArmorChange(a: LegendaryArmor) {
    syncMonster(config, a);
  }

  function update(patch: Partial<AnyMonster>) {
    onChange({ ...monster, ...patch } as AnyMonster);
  }

  function updateLegendary(patch: Partial<LegendaryMonster>) {
    onChange({ ...monster, ...patch } as AnyMonster);
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

  function addAbilityAsPassive(ability: { name: string; description: string }) {
    update({
      passives: [...monster.passives, { name: ability.name, description: ability.description }],
    });
  }

  // Phase helpers (bloodied / lastStand)
  function updatePhase(
    phaseKey: "bloodied" | "lastStand",
    patch: Partial<MonsterPhase>
  ) {
    const current = legendary[phaseKey] ?? { description: "" };
    updateLegendary({ [phaseKey]: { ...current, ...patch } });
  }

  function addPhasePassive(phaseKey: "bloodied" | "lastStand") {
    const current = legendary[phaseKey] ?? { description: "" };
    const passives = [...(current.passives ?? []), { name: "", description: "" }];
    updateLegendary({ [phaseKey]: { ...current, passives } });
  }
  function removePhasePassive(phaseKey: "bloodied" | "lastStand", index: number) {
    const current = legendary[phaseKey] ?? { description: "" };
    const passives = (current.passives ?? []).filter((_, i) => i !== index);
    updateLegendary({ [phaseKey]: { ...current, passives } });
  }
  function updatePhasePassive(
    phaseKey: "bloodied" | "lastStand",
    index: number,
    patch: Partial<MonsterPassive>
  ) {
    const current = legendary[phaseKey] ?? { description: "" };
    const passives = (current.passives ?? []).map((p, i) =>
      i === index ? { ...p, ...patch } : p
    );
    updateLegendary({ [phaseKey]: { ...current, passives } });
  }

  function addPhaseAction(phaseKey: "bloodied" | "lastStand") {
    const current = legendary[phaseKey] ?? { description: "" };
    const actions = [...(current.actions ?? []), { name: "", description: "", reach: 1, diceFormula: "" }];
    updateLegendary({ [phaseKey]: { ...current, actions } });
  }
  function removePhaseAction(phaseKey: "bloodied" | "lastStand", index: number) {
    const current = legendary[phaseKey] ?? { description: "" };
    const actions = (current.actions ?? []).filter((_, i) => i !== index);
    updateLegendary({ [phaseKey]: { ...current, actions } });
  }
  function updatePhaseAction(
    phaseKey: "bloodied" | "lastStand",
    index: number,
    patch: Partial<MonsterAction>
  ) {
    const current = legendary[phaseKey] ?? { description: "" };
    const actions = (current.actions ?? []).map((a, i) =>
      i === index ? { ...a, ...patch } : a
    );
    updateLegendary({ [phaseKey]: { ...current, actions } });
  }

  const labelClass = "block text-sm font-medium text-foreground mb-1";
  const inputClass =
    "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";
  const sectionHeader =
    "text-sm font-heading font-bold text-foreground uppercase tracking-wide";

  // Render a formula table (shared for small and big)
  function renderFormulaTable(
    damageTarget: number,
    fullTable: ReturnType<typeof generateFullTable>,
    showTable: boolean,
    setShowTable: (v: boolean) => void
  ) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showTable ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          {showTable ? "Hide" : "Show"} all combinations
        </button>

        {showTable && fullTable.length > 0 && (
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
                {fullTable.map((tableRow) => (
                  <tr
                    key={tableRow.diceCount}
                    className="border-t border-border hover:bg-muted/50"
                  >
                    <td className="px-2 py-1 text-muted-foreground font-medium">
                      {tableRow.diceCount}
                    </td>
                    {[4, 6, 8, 10, 12, 20].map((die) => {
                      const formula = tableRow.formulas[die];
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
                                  damageTarget,
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
    );
  }

  // Render passives/actions for a phase
  function renderPhaseEditor(phaseKey: "bloodied" | "lastStand", title: string, subtitle?: string) {
    const phase = legendary[phaseKey];
    const phasePassives = phase?.passives ?? [];
    const phaseActions = phase?.actions ?? [];

    return (
      <div>
        <h4 className={sectionHeader}>{title}</h4>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        <div className="mt-2 space-y-3">
          <div>
            <label className={labelClass}>Trigger Description</label>
            <textarea
              value={phase?.description ?? ""}
              onChange={(e) => updatePhase(phaseKey, { description: e.target.value })}
              placeholder={`What happens when this monster becomes ${phaseKey === "bloodied" ? "bloodied" : "enters last stand"}?`}
              rows={2}
              className={inputClass}
            />
          </div>

          {/* Phase Passives */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Phase Passives
              </span>
              <button
                type="button"
                onClick={() => addPhasePassive(phaseKey)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/5 active:scale-95 transition-all"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {phasePassives.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => updatePhasePassive(phaseKey, i, { name: e.target.value })}
                      placeholder="Passive name"
                      className={inputClass}
                    />
                    <textarea
                      value={p.description}
                      onChange={(e) => updatePhasePassive(phaseKey, i, { description: e.target.value })}
                      placeholder="Description"
                      rows={2}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhasePassive(phaseKey, i)}
                    className="self-start p-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/5 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Phase Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Phase Actions
              </span>
              <button
                type="button"
                onClick={() => addPhaseAction(phaseKey)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/5 active:scale-95 transition-all"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {phaseActions.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={a.name}
                      onChange={(e) => updatePhaseAction(phaseKey, i, { name: e.target.value })}
                      placeholder="Action name"
                      className={inputClass}
                    />
                    <textarea
                      value={a.description}
                      onChange={(e) => updatePhaseAction(phaseKey, i, { description: e.target.value })}
                      placeholder="Description"
                      rows={2}
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={a.reach ?? 1}
                        onChange={(e) =>
                          updatePhaseAction(phaseKey, i, {
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
                            updatePhaseAction(phaseKey, i, {
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
                    onClick={() => removePhaseAction(phaseKey, i)}
                    className="self-start p-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/5 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* A. Reference Bar */}
      <div className="bg-muted rounded-md px-4 py-3 flex items-center justify-between gap-4 text-sm">
        <div className="text-center">
          <div className="text-muted-foreground text-xs">Level</div>
          <div className="font-bold">{config.baseLevel}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground text-xs">HP ({armor})</div>
          <div className="font-bold">{hp}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground text-xs">Last Stand</div>
          <div className="font-bold">{lastStandHp}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground text-xs">Save DC</div>
          <div className="font-bold">{saveDC}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground text-xs">Small</div>
          <div className="font-bold">{damageSmall}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground text-xs">Big</div>
          <div className="font-bold">{damageBig}</div>
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
              onChange={(e) => handleLevelChange(parseInt(e.target.value))}
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
              <div
                className="absolute top-1 bottom-1 rounded-md bg-primary shadow-sm transition-all duration-200 ease-in-out"
                style={{
                  width: `calc(${100 / LEGENDARY_ARMOR_TYPES.length}% - 2px)`,
                  left: `calc(${(LEGENDARY_ARMOR_TYPES.indexOf(armor) * 100) / LEGENDARY_ARMOR_TYPES.length}% + 1px)`,
                }}
              />
              {LEGENDARY_ARMOR_TYPES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => handleArmorChange(a)}
                  className={`relative z-10 flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                    armor === a
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

      {/* C. Die Size & Attacks */}
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

        {/* Small Attack formulas */}
        {smallFormulas.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-muted-foreground mb-2">
              Small Attack — avg {damageSmall} (utility / movement)
            </div>
            <div className="flex flex-wrap gap-2">
              {smallFormulas.map((f, i) => (
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
            {renderFormulaTable(damageSmall, smallFullTable, showSmallTable, setShowSmallTable)}
          </div>
        )}

        {/* Big Attack formulas */}
        {bigFormulas.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-muted-foreground mb-2">
              Big Attack — avg {damageBig} (positional damage)
            </div>
            <div className="flex flex-wrap gap-2">
              {bigFormulas.map((f, i) => (
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
            {renderFormulaTable(damageBig, bigFullTable, showBigTable, setShowBigTable)}
          </div>
        )}
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
                Click an ability to add it as a passive.
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
                          <span className="text-sm font-medium text-foreground">
                            {ability.name}
                          </span>
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

      {/* D. Identity */}
      <div>
        <h4 className={sectionHeader}>Identity</h4>
        <div className="mt-2 space-y-3">
          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={monster.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Legendary monster name"
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
                placeholder="e.g. Dragon"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Group</label>
              <input
                type="text"
                value={monster.group ?? ""}
                onChange={(e) => update({ group: e.target.value || undefined })}
                placeholder="e.g. Chromatic"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* E. Passives */}
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

      {/* F. Actions */}
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

      {/* G. Bloodied */}
      {renderPhaseEditor("bloodied", "Bloodied Phase", "Triggered when HP drops to half")}

      {/* H. Last Stand */}
      <div>
        {renderPhaseEditor("lastStand", "Last Stand Phase", `Last Stand HP: ${lastStandHp}`)}
      </div>

      {/* I. Notes */}
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
