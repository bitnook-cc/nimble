import { remapTableContent } from "./table-content";
import { encounterFieldsSchema } from "./encounter-schema";
import { remapReferences } from "./content-schema";
import { campaignSchema, uid, type AppData, type Campaign } from "./model";

export function selectAfterRemoval(
  data: AppData,
  campaigns: Campaign[],
  removedId: string,
): AppData {
  return {
    ...data,
    campaigns,
    activeCampaignId:
      data.activeCampaignId === removedId
        ? (campaigns.find((c) => !c.archivedAt)?.id ?? null)
        : data.activeCampaignId,
  };
}

// One mapping per ID space preserves references shared by current and undo states.
export function copyCampaign(
  source: Campaign,
  name = `${source.name.slice(0, 73)} (copy)`,
): Campaign {
  const map = new Map<string, string>();
  const remap = (id: string) => {
    if (!map.has(id)) map.set(id, uid());
    return map.get(id)!;
  };
  const copy = structuredClone(source);
  copy.id = uid();
  copy.name = name;
  copy.archivedAt = null;
  copy.party.characters = copy.party.characters.map((character) => ({
    ...character,
    id: remap(character.id),
  }));
  copy.assets = copy.assets.map((a) => ({ ...a, id: remap(a.id) }));
  copy.activeScreenId = remap(copy.activeScreenId);
  for (const screen of copy.screens) {
    screen.id = remap(screen.id);
    for (const layout of [screen, ...screen.undo, ...screen.redo])
      layout.widgets = layout.widgets.map((w) => ({
        ...w,
        id: remap(w.id),
        toolId: remap(w.toolId),
      }));
  }
  for (const preset of copy.layoutPresets) {
    preset.id = remap(preset.id);
    preset.widgets = preset.widgets.map((w) => ({
      ...w,
      id: remap(w.id),
      toolId: remap(w.toolId),
    }));
    preset.tools = preset.tools.map((t) => ({ ...t, id: remap(t.id) }));
  }
  const localIds = new Set([
    ...source.content.map((r) => r.id),
    ...source.tools.filter((t) => t.kind === "note").map((t) => t.id),
  ]);
  const localRemap = (id: string) => (localIds.has(id) ? remap(id) : id);
  const targetRemap = (target: string) =>
    target.startsWith("local::")
      ? "local::" +
        target
          .slice(7)
          .split("#")
          .map((part, i) => (i === 0 ? localRemap(part) : part))
          .join("#")
      : target;
  copy.itemFavourites = copy.itemFavourites.map(targetRemap);
  copy.content = copy.content.map((r) => ({
    ...r,
    id: remap(r.id),
    body: remapReferences(r.body, localRemap),
    related: r.related.map(targetRemap),
    ...(r.kind === "item" && typeof r.fields.moreInfo === "string"
      ? {
          fields: {
            ...r.fields,
            moreInfo: remapReferences(r.fields.moreInfo, localRemap),
          },
        }
      : {}),
    ...(r.kind === "encounter"
      ? {
          fields: {
            ...r.fields,
            ...encounterFieldsSchema.parse(r.fields),
            entries: encounterFieldsSchema.parse(r.fields).entries.map((e) => ({
              ...e,
              id: remap(e.id),
              target: targetRemap(e.target),
            })),
          },
        }
      : {}),
  }));
  copy.content = copy.content.map((record) =>
    record.kind === "table"
      ? remapTableContent(record, targetRemap, localRemap)
      : record,
  );
  copy.tools = copy.tools.map((t) => {
    t.id = remap(t.id);
    if (t.kind === "counter" && t.link)
      t.link.trackerId = remap(t.link.trackerId);
    if (t.kind === "image" && t.assetId) t.assetId = remap(t.assetId);
    if (t.kind === "checklist")
      t.entries = t.entries.map((e) => ({ ...e, id: remap(e.id) }));
    if (t.kind === "table") {
      if (t.target) t.target = targetRemap(t.target);
      t.history = t.history.map((result) => ({
        ...result,
        id: remap(result.id),
        steps: result.steps.map((s) => ({
          ...s,
          tableId: targetRemap(s.tableId),
          rowId: remap(s.rowId),
          body: remapReferences(s.body, localRemap),
        })),
      }));
    }
    if (t.kind === "dice") {
      t.rolls = t.rolls.map((r) => ({ ...r, id: remap(r.id) }));
      t.presets = t.presets.map((p) => ({ ...p, id: remap(p.id) }));
    } else if (t.kind === "npc") {
      t.options.style = targetRemap(t.options.style);
      const copyNpc = (npc: NonNullable<typeof t.current>) => ({
        ...npc,
        id: remap(npc.id),
        style: targetRemap(npc.style),
      });
      if (t.current) t.current = copyNpc(t.current);
      t.history = t.history.map(copyNpc);
      t.saved = t.saved.map(copyNpc);
    } else if (t.kind === "note") {
      t.body = remapReferences(t.body, localRemap);
    } else if (t.kind === "reference") {
      t.target = targetRemap(t.target);
    } else if (t.kind === "initiative") {
      if (t.utilityHistory)
        t.utilityHistory = t.utilityHistory.map((changes) =>
          changes.map((d) => ({ ...d, toolId: remap(d.toolId) })),
        );
      for (const run of [t.run, ...t.history]) {
        if (run.hazards)
          run.hazards = run.hazards.map((h) => ({
            ...h,
            id: remap(h.id),
            target: targetRemap(h.target),
            record: {
              ...h.record,
              id: localRemap(h.record.id),
              body: remapReferences(h.record.body, localRemap),
              related: h.record.related.map(targetRemap),
            },
          }));
        if (run.activeId) run.activeId = remap(run.activeId);
        if (run.legendaryTurn)
          run.legendaryTurn = {
            ...run.legendaryTurn,
            afterId: remap(run.legendaryTurn.afterId),
            groups: run.legendaryTurn.groups.map(remap),
            resumeId: run.legendaryTurn.resumeId
              ? remap(run.legendaryTurn.resumeId)
              : null,
          };
        run.combatants = run.combatants.map((c) => ({
          ...c,
          id: remap(c.id),
          ...(c.legendary?.groupId
            ? {
                legendary: {
                  ...c.legendary,
                  groupId: remap(c.legendary.groupId),
                },
              }
            : {}),
          ...(c.monster
            ? {
                monster: {
                  target: targetRemap(c.monster.target),
                  record: {
                    ...c.monster.record,
                    id: localRemap(c.monster.record.id),
                    body: remapReferences(c.monster.record.body, localRemap),
                    related: c.monster.record.related.map(targetRemap),
                  },
                },
              }
            : {}),
          ...(c.partyCharacterId
            ? { partyCharacterId: remap(c.partyCharacterId) }
            : {}),
        }));
      }
    }
    return t;
  });
  return campaignSchema.parse(copy);
}
