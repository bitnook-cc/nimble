import { migrateLegendaryCampaign } from "./legendary";
import { migrateInitiativeCampaign } from "./initiative";
import { migrateTableContent } from "./table-content";
import {
  campaignSchema as v3CampaignSchema,
  appSchema as v3AppSchema,
} from "./model-v3";
import { migrateCounters, migrateTimeTools } from "./utility-migrations";
import { z } from "zod";
import {
  starterPack,
  monsterPack,
  legacyOfficialKeys,
  remapOfficialReference,
  officialReplacements,
} from "./starter-pack";
import { packKey } from "./content-schema";
import {
  appSchema,
  SCHEMA_VERSION,
  legacyAppSchema,
  v2AppSchema,
  v2CampaignSchema,
  campaignSchema,
  type AppData,
  type Campaign,
} from "./model";

export function migrateCampaign(
  raw: unknown,
  version:
    2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17,
): Campaign {
  if (version >= 4 && version < 11) raw = migrateCounters(raw);
  if (version >= 4 && version < 12) raw = migrateTimeTools(raw);
  if (version >= 4 && version < 13) raw = migrateLegendaryCampaign(raw);
  if (version >= 4 && version < 16) raw = migrateTableContent(raw);
  if (version < 17) raw = migrateInitiativeCampaign(raw);
  if (
    version === 7 ||
    version === 8 ||
    version === 9 ||
    version === 10 ||
    version === 11 ||
    version === 12 ||
    version === 13 ||
    version === 14 ||
    version === 15 ||
    version === 16 ||
    version === SCHEMA_VERSION
  )
    return campaignSchema.parse(raw);
  if (version === 4 || version === 5 || version === 6) {
    if (!raw || typeof raw !== "object")
      throw new Error("Invalid campaign data.");
    return campaignSchema.parse({ party: { characters: [] }, ...raw });
  }
  if (version === 3)
    return campaignSchema.parse({
      ...v3CampaignSchema.parse(raw),
      party: { characters: [] },
      content: [],
      packRefs: [packKey(starterPack)],
    });
  const old = v2CampaignSchema.parse(raw);
  const { grid, widgets, tools, ...rest } = old;
  const screenId = `${old.id}:screen`;
  return campaignSchema.parse({
    ...rest,
    party: { characters: [] },
    content: [],
    packRefs: [packKey(starterPack)],
    activeScreenId: screenId,
    layoutPresets: [],
    tools: tools.map((t) => ({
      ...t,
      name: t.kind === "dice" ? "Dice roller" : "Initiative tracker",
    })),
    screens: [
      {
        id: screenId,
        name: "Session screen",
        grid,
        widgets: widgets.map((w) => ({ ...w, title: "" })),
        undo: [],
        redo: [],
      },
    ],
  });
}
function migrateAppData(raw: unknown): AppData {
  if (!raw || typeof raw !== "object" || !("version" in raw))
    throw new Error("Saved data has no supported schema version.");
  if (raw.version === 1) {
    const old = legacyAppSchema.parse(raw);
    return migrateApp({
      ...old,
      version: 2,
      campaigns: old.campaigns.map((c) => ({
        ...c,
        archivedAt: null,
        assets: [],
      })),
    });
  }
  if (raw.version === 2) {
    const old = v2AppSchema.parse(raw);
    return appSchema.parse({
      ...old,
      version: SCHEMA_VERSION,
      packs: [starterPack],
      campaigns: old.campaigns.map((c) => migrateCampaign(c, 2)),
    });
  }
  if (raw.version === 3) {
    const old = v3AppSchema.parse(raw);
    return appSchema.parse({
      ...old,
      version: SCHEMA_VERSION,
      packs: [starterPack],
      campaigns: old.campaigns.map((c) => migrateCampaign(c, 3)),
    });
  }
  if (
    raw.version === 4 ||
    raw.version === 5 ||
    raw.version === 6 ||
    raw.version === 7 ||
    raw.version === 8 ||
    raw.version === 9 ||
    raw.version === 10 ||
    raw.version === 11 ||
    raw.version === 12 ||
    raw.version === 13 ||
    raw.version === 14 ||
    raw.version === 15 ||
    raw.version === 16
  ) {
    const version = raw.version;
    const previous = z.object({ campaigns: z.array(z.unknown()) }).parse(raw);
    return appSchema.parse({
      ...raw,
      version: SCHEMA_VERSION,
      campaigns: previous.campaigns.map((c) => migrateCampaign(c, version)),
    });
  }
  if (raw.version === SCHEMA_VERSION) return appSchema.parse(raw);
  throw new Error(
    "This data needs a different version of Slate. The original has been kept.",
  );
}

export function migrateApp(raw: unknown): AppData {
  const saved = z
    .object({ version: z.number(), campaigns: z.array(z.unknown()) })
    .safeParse(raw);
  const input =
    saved.success && saved.data.version < 17
      ? {
          ...(raw as Record<string, unknown>),
          campaigns: saved.data.campaigns.map(migrateInitiativeCampaign),
        }
      : raw;
  let data = migrateAppData(input);
  const previousVersion = (raw as { version: number }).version;
  if (previousVersion >= 7)
    return previousVersion < SCHEMA_VERSION
      ? upgradeOfficialContent(data)
      : data;
  const key = packKey(monsterPack);
  const installed = data.packs.some((pack) => packKey(pack) === key);
  // Preserve a full library instead of making its upgrade fail at the pack limit.
  if (!installed && data.packs.length >= 20)
    return upgradeOfficialContent(data);
  data = appSchema.parse({
    ...data,
    packs: installed ? data.packs : [...data.packs, monsterPack],
    campaigns: data.campaigns.map((campaign) => ({
      ...campaign,
      packRefs:
        campaign.packRefs.includes(key) || campaign.packRefs.length >= 20
          ? campaign.packRefs
          : [...campaign.packRefs, key],
    })),
  });
  return upgradeOfficialContent(data);
}

// Split known bundles by book, preserving edits and disabled sources.
export function upgradeOfficialContent<
  T extends Pick<AppData, "packs" | "campaigns">,
>(data: T): T {
  if (!data.packs.some((pack) => legacyOfficialKeys.includes(packKey(pack))))
    return data;
  const added = new Set(
    data.packs
      .filter((pack) => !legacyOfficialKeys.includes(packKey(pack)))
      .map(packKey),
  );
  const packs = data.packs.flatMap((pack) => {
    if (!legacyOfficialKeys.includes(packKey(pack))) return [pack];
    return officialReplacements(packKey(pack)).filter((next) => {
      if (added.has(packKey(next))) return false;
      added.add(packKey(next));
      return true;
    });
  });
  return {
    ...data,
    packs,
    campaigns: data.campaigns.map((c) => {
      const updated = JSON.parse(JSON.stringify(c), (_, value) =>
        typeof value === "string" ? remapOfficialReference(value) : value,
      ) as Campaign;
      return campaignSchema.parse({
        ...updated,
        packRefs: [
          ...new Set(
            c.packRefs.flatMap((key) =>
              legacyOfficialKeys.includes(key)
                ? officialReplacements(key).map(packKey)
                : [key],
            ),
          ),
        ],
      });
    }),
  };
}
