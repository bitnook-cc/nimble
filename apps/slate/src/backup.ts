import { Capacitor } from "@capacitor/core";
import { shareFile } from "./native-files";
import { packSchema, packKey, type ContentPack } from "./content-schema";
import { starterPack, officialPacks } from "./starter-pack";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { z } from "zod";
import { migrateCampaign, upgradeOfficialContent } from "./migrations";
import {
  campaignSchema,
  SCHEMA_VERSION,
  MAX_ASSET_BYTES,
  type Campaign,
} from "./model";

export type StoredAsset = { campaignId: string; id: string; blob: Blob };
export type CampaignBundle = {
  campaign: Campaign;
  assets: StoredAsset[];
  packs?: ContentPack[];
};
export const MAX_BACKUP_BYTES = 128 * 1024 * 1024;
const MAX_RECORD_BYTES = 20 * 1024 * 1024;
const manifestSchema = z.strictObject({
  format: z.literal("slate-campaign"),
  version: z.literal(1),
  schemaVersion: z.union([
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
    z.literal(8),
    z.literal(9),
    z.literal(10),
    z.literal(11),
    z.literal(12),
    z.literal(13),
    z.literal(14),
    z.literal(15),
    z.literal(16),
    z.literal(SCHEMA_VERSION),
  ]),
  createdAt: z.iso.datetime(),
  packsSha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  campaignId: z.string().min(1),
  campaignSha256: z.string().regex(/^[a-f0-9]{64}$/),
  assets: z
    .array(
      z.strictObject({
        id: z.string().min(1),
        path: z.string().regex(/^assets\/\d+$/),
      }),
    )
    .max(100),
});
export async function digest(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  return Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
export async function validateBundle(bundle: CampaignBundle) {
  const campaign = campaignSchema.parse(bundle.campaign);
  const packs = bundle.packs ?? officialPacks;
  for (const pack of packs) packSchema.parse(pack);
  if (
    new Set(packs.map(packKey)).size !== packs.length ||
    campaign.packRefs.some((ref) => !packs.some((p) => packKey(p) === ref))
  )
    throw new Error("A campaign content pack is missing or duplicated.");
  if (bundle.assets.length !== campaign.assets.length)
    throw new Error("Attachments are missing or unexpected.");
  const seen = new Set<string>();
  for (const meta of campaign.assets) {
    const asset = bundle.assets.find(
      (a) => a.id === meta.id && a.campaignId === campaign.id,
    );
    if (
      !asset ||
      seen.has(asset.id) ||
      !(asset.blob instanceof Blob) ||
      asset.blob.size !== meta.size
    )
      throw new Error(
        `Attachment is missing or has the wrong size: ${meta.name}`,
      );
    seen.add(asset.id);
    if (
      (await digest(new Uint8Array(await asset.blob.arrayBuffer()))) !==
      meta.sha256
    )
      throw new Error(`Attachment checksum failed: ${meta.name}`);
  }
  return campaign;
}
export async function encodeBackup(
  bundle: CampaignBundle,
): Promise<Uint8Array<ArrayBuffer>> {
  const campaign = await validateBundle(bundle);
  const records = strToU8(JSON.stringify(campaign));
  if (records.length > MAX_RECORD_BYTES)
    throw new Error("Campaign records exceed the 20 MiB backup limit.");
  const files: Record<string, Uint8Array> = { "campaign.json": records };
  const packBytes = strToU8(
    JSON.stringify(
      (bundle.packs ?? officialPacks).filter((p) =>
        campaign.packRefs.includes(packKey(p)),
      ),
    ),
  );
  if (packBytes.length > MAX_RECORD_BYTES)
    throw new Error("Content packs exceed 20 MiB.");
  files["packs.json"] = packBytes;
  const assets = [];
  for (const [index, meta] of campaign.assets.entries()) {
    const path = `assets/${index}`;
    files[path] = new Uint8Array(
      await bundle.assets.find((a) => a.id === meta.id)!.blob.arrayBuffer(),
    );
    assets.push({ id: meta.id, path });
  }
  files["manifest.json"] = strToU8(
    JSON.stringify({
      format: "slate-campaign",
      version: 1,
      schemaVersion: SCHEMA_VERSION,
      packsSha256: await digest(packBytes),
      createdAt: new Date().toISOString(),
      campaignId: campaign.id,
      campaignSha256: await digest(records),
      assets,
    }),
  );
  // Stored ZIP entries avoid recompressing media and keep exports predictable on tablets.
  return zipSync(files, { level: 0 });
}
export async function decodeBackup(bytes: Uint8Array): Promise<CampaignBundle> {
  try {
    return await parseBackup(bytes);
  } catch (e) {
    if (e instanceof z.ZodError)
      throw new Error(
        "This backup uses an unsupported version or contains invalid campaign data.",
      );
    if (e instanceof SyntaxError)
      throw new Error("This backup contains unreadable campaign data.");
    throw e;
  }
}
async function parseBackup(bytes: Uint8Array): Promise<CampaignBundle> {
  if (bytes.length > MAX_BACKUP_BYTES)
    throw new Error("Backup exceeds 128 MiB.");
  const seen = new Set<string>();
  let total = 0;
  const files = unzipSync(bytes, {
    filter: (file) => {
      if (
        !/^(manifest\.json|campaign\.json|packs\.json|assets\/\d+)$/.test(
          file.name,
        ) ||
        seen.has(file.name)
      )
        throw new Error("Backup contains unexpected or duplicate paths.");
      seen.add(file.name);
      const limit =
        file.name === "manifest.json"
          ? 65536
          : file.name === "campaign.json" || file.name === "packs.json"
            ? MAX_RECORD_BYTES
            : MAX_ASSET_BYTES;
      total += file.originalSize;
      if (
        file.originalSize > limit ||
        total > MAX_BACKUP_BYTES ||
        seen.size > 103
      )
        throw new Error("Expanded backup exceeds safe limits.");
      return true;
    },
  });
  if (!files["manifest.json"] || !files["campaign.json"])
    throw new Error("Not a Slate campaign backup.");
  const manifest = manifestSchema.parse(
    JSON.parse(strFromU8(files["manifest.json"])),
  );
  if ((await digest(files["campaign.json"])) !== manifest.campaignSha256)
    throw new Error("Campaign checksum failed.");
  let packs: ContentPack[];
  if (manifest.schemaVersion >= 4) {
    if (
      !files["packs.json"] ||
      !manifest.packsSha256 ||
      (await digest(files["packs.json"])) !== manifest.packsSha256
    )
      throw new Error("Content pack checksum failed.");
    packs = z
      .array(packSchema)
      .max(24)
      .parse(JSON.parse(strFromU8(files["packs.json"])));
  } else packs = [starterPack];
  const campaign = migrateCampaign(
    JSON.parse(strFromU8(files["campaign.json"])),
    manifest.schemaVersion,
  );
  if (
    campaign.id !== manifest.campaignId ||
    manifest.assets.length !== campaign.assets.length ||
    new Set(manifest.assets.map((a) => a.id)).size !== manifest.assets.length ||
    new Set(manifest.assets.map((a) => a.path)).size !==
      manifest.assets.length ||
    Object.keys(files).length !==
      manifest.assets.length + (manifest.schemaVersion >= 4 ? 3 : 2)
  )
    throw new Error("Backup manifest does not match its content.");
  const assets = manifest.assets.map((entry) => {
    const meta = campaign.assets.find((a) => a.id === entry.id);
    const content = files[entry.path];
    if (!meta || !content || content.length !== meta.size)
      throw new Error("An attachment is missing or damaged.");
    return {
      campaignId: campaign.id,
      id: meta.id,
      blob: new Blob([new Uint8Array(content)], { type: meta.mime }),
    };
  });
  const bundle = { campaign, assets, packs };
  await validateBundle(bundle);
  if (manifest.schemaVersion < SCHEMA_VERSION) {
    const upgraded = upgradeOfficialContent({ campaigns: [campaign], packs });
    return { campaign: upgraded.campaigns[0], assets, packs: upgraded.packs };
  }
  return bundle;
}
export async function download(blob: Blob, filename: string) {
  try {
    if (Capacitor.isNativePlatform()) {
      await shareFile(blob, filename);
    } else {
      const url = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
      }
    }
    return true;
  } catch (error) {
    window.dispatchEvent(
      new CustomEvent("slate-file-error", {
        detail:
          error instanceof Error
            ? error.message
            : "Unable to save or share this export.",
      }),
    );
    return false;
  }
}

export function backupFilename(name: string) {
  return `${name.replace(/[^a-z0-9_-]/gi, "-").slice(0, 80) || "campaign"}-${new Date().toISOString().slice(0, 10)}.slate.zip`;
}
export async function encodeRecovery(raw: {
  data: unknown;
  packs?: ContentPack[];
  assets: StoredAsset[];
}) {
  const files: Record<string, Uint8Array> = {
    "original-state.json": strToU8(JSON.stringify(raw.data ?? null)),
    "original-packs.json": strToU8(JSON.stringify(raw.packs ?? [])),
  };
  const entries = [];
  for (const [index, asset] of raw.assets.entries()) {
    const path = `assets/${index}`;
    files[path] = new Uint8Array(await asset.blob.arrayBuffer());
    entries.push({
      path,
      campaignId: asset.campaignId,
      id: asset.id,
      mime: asset.blob.type,
    });
  }
  files["recovery-manifest.json"] = strToU8(
    JSON.stringify({
      format: "slate-raw-recovery",
      version: 1,
      assets: entries,
    }),
  );
  return zipSync(files, { level: 0 });
}
