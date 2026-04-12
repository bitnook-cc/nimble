"use client";

import type { AnyMonster, LegendaryMonster, MonsterPassive, MonsterAction, MonsterPhase } from "@/lib/monsters/types";

interface MonsterStatBlockProps {
  monster: AnyMonster;
}

function formatSaves(saves: NonNullable<AnyMonster["saves"]>): string {
  const entries: string[] = [];
  const labels: [string, number | undefined][] = [
    ["STR", saves.strength],
    ["DEX", saves.dexterity],
    ["INT", saves.intelligence],
    ["WIL", saves.will],
  ];

  for (const [label, value] of labels) {
    if (value === undefined || value === 0) continue;
    const abs = Math.abs(value);
    const sign = value > 0 ? "+" : "-";
    if (abs === 1) {
      entries.push(`${label}${sign}`);
    } else {
      entries.push(`${label}(${sign}${abs})`);
    }
  }

  return entries.join("  ");
}

function PassiveBlock({ passive }: { passive: MonsterPassive }) {
  return (
    <blockquote className="border-l-2 border-primary pl-3 py-1">
      <p className="font-semibold text-sm text-foreground">{passive.name}</p>
      {passive.description && (
        <p className="text-sm text-muted-foreground">{passive.description}</p>
      )}
    </blockquote>
  );
}

function ActionBlock({ action }: { action: MonsterAction }) {
  return (
    <li className="text-sm">
      <span className="font-semibold text-foreground">{action.name}</span>
      {action.diceFormula && (
        <span className="text-muted-foreground"> [{action.diceFormula}]</span>
      )}
      {action.reach !== undefined && action.reach !== 1 && (
        <span className="text-muted-foreground"> — Reach {action.reach}</span>
      )}
      {action.description && (
        <span className="text-muted-foreground"> — {action.description}</span>
      )}
    </li>
  );
}

function PhaseSection({
  title,
  phase,
}: {
  title: string;
  phase: MonsterPhase;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-heading font-bold uppercase tracking-wide text-destructive">
        ⚔ {title}
      </h4>
      {phase.description && (
        <p className="text-sm text-muted-foreground italic">
          {phase.description}
        </p>
      )}
      {phase.passives && phase.passives.length > 0 && (
        <div className="space-y-1">
          {phase.passives.map((p, i) => (
            <PassiveBlock key={i} passive={p} />
          ))}
        </div>
      )}
      {phase.actions && phase.actions.length > 0 && (
        <ul className="space-y-1 list-disc list-inside">
          {phase.actions.map((a, i) => (
            <ActionBlock key={i} action={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function MonsterStatBlock({ monster }: MonsterStatBlockProps) {
  const subtitleParts: string[] = [];
  if (monster.kind === "legendary") subtitleParts.push("Legendary");
  subtitleParts.push(`Level ${monster.level}`);
  subtitleParts.push(monster.size);
  if (monster.type) subtitleParts.push(monster.type);
  if (monster.group) subtitleParts.push(monster.group);
  const subtitle = subtitleParts.join(" | ");

  const savesStr =
    monster.saves ? formatSaves(monster.saves) : null;

  const legendary =
    monster.kind === "legendary"
      ? (monster as LegendaryMonster)
      : null;

  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-xl font-heading font-bold text-foreground">
          {monster.name || "Unnamed Monster"}
        </h3>
        <p className="text-sm text-muted-foreground italic">{subtitle}</p>
      </div>

      {/* Core stats */}
      <div className="flex gap-4 text-sm">
        <span>
          <span className="font-semibold">HP</span> {monster.hitPoints}
        </span>
        <span>
          <span className="font-semibold">Armor</span> {monster.armor}
        </span>
        <span>
          <span className="font-semibold">Speed</span> {monster.speed}
        </span>
      </div>

      {/* Saves */}
      {savesStr && (
        <div className="text-sm">
          <span className="font-semibold">Saves:</span>{" "}
          <span className="text-muted-foreground">{savesStr}</span>
        </div>
      )}

      {/* Passives */}
      {monster.passives.length > 0 && (
        <div className="space-y-2">
          {monster.passives.map((p, i) => (
            <PassiveBlock key={i} passive={p} />
          ))}
        </div>
      )}

      {/* Actions */}
      {monster.actions.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-heading font-bold uppercase tracking-wide text-foreground">
            Actions
          </h4>
          <ul className="space-y-1 list-disc list-inside">
            {monster.actions.map((a, i) => (
              <ActionBlock key={i} action={a} />
            ))}
          </ul>
        </div>
      )}

      {/* Legendary Phases */}
      {legendary?.bloodied && (
        <PhaseSection title="Bloodied" phase={legendary.bloodied} />
      )}
      {legendary?.lastStand && (
        <PhaseSection title="Last Stand" phase={legendary.lastStand} />
      )}

      {/* Notes */}
      {monster.notes && (
        <div className="text-sm text-muted-foreground border-t border-border pt-3">
          {monster.notes}
        </div>
      )}
    </div>
  );
}
