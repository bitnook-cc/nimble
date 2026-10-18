import { z } from "zod";
import { parsePack, packKey, type ContentPack } from "./content-schema";
import { digest } from "./backup";
import { Capacitor } from "@capacitor/core";

const key = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9_./-]+$/);
export const catalogSchema = z
  .object({
    format: z.literal("slate-pack-catalog"),
    version: z.literal(1),
    packs: z
      .array(
        z.object({
          id: key,
          version: key,
          name: z.string().min(1).max(160),
          system: key,
          description: z.string().max(1000),
          url: z.string().min(1).max(1000),
          bytes: z
            .number()
            .int()
            .positive()
            .max(8 * 1024 * 1024),
          sha256: z.string().regex(/^[a-f0-9]{64}$/),
          records: z.number().int().min(1).max(3000),
          source: z.object({
            url: z.url().refine((url) => /^https?:\/\//i.test(url)),
            revision: z.string().max(100),
            license: z.string().max(500),
          }),
        }),
      )
      .max(100),
  })
  .superRefine((catalog, ctx) => {
    const keys = catalog.packs.map((p) => p.id + "@" + p.version);
    if (new Set(keys).size !== keys.length)
      ctx.addIssue({ code: "custom", message: "Duplicate catalog versions" });
  });
export type CatalogPack = z.infer<typeof catalogSchema>["packs"][number];

// Pack versions can also be opaque revision IDs. Only comparable numeric
// releases (including the SRD's four-part versions) imply an upgrade.
export function comparePackVersions(
  left: string,
  right: string,
): number | null {
  if (left === right) return 0;
  const parse = (value: string) =>
    /^v?(\d+(?:\.\d+)*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(value);
  const a = parse(left),
    b = parse(right);
  if (!a || !b) return null;
  const numbers = (x: string, y: string) =>
    BigInt(x) > BigInt(y) ? 1 : BigInt(x) < BigInt(y) ? -1 : 0;
  const av = a[1].split("."),
    bv = b[1].split(".");
  for (let index = 0; index < Math.max(av.length, bv.length); index++) {
    const result = numbers(av[index] ?? "0", bv[index] ?? "0");
    if (result) return result;
  }
  if (!a[2] || !b[2]) return a[2] ? -1 : b[2] ? 1 : 0;
  const ap = a[2].split("."),
    bp = b[2].split(".");
  for (let index = 0; index < Math.max(ap.length, bp.length); index++) {
    const x = ap[index],
      y = bp[index];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    if (x === y) continue;
    const xn = /^\d+$/.test(x),
      yn = /^\d+$/.test(y);
    if (xn && yn) {
      const result = numbers(x, y);
      if (result) return result;
    } else return xn !== yn ? (xn ? -1 : 1) : x > y ? 1 : -1;
  }
  return 0;
}

export function catalogUpgrades(
  catalog: CatalogPack[],
  installed: Pick<ContentPack, "id" | "version">[],
) {
  const upgrades = new Map<string, CatalogPack>();
  for (const entry of catalog) {
    const family = installed.filter((pack) => pack.id === entry.id);
    if (
      !family.length ||
      !family.every(
        (pack) => comparePackVersions(entry.version, pack.version) === 1,
      )
    )
      continue;
    const latest = family.reduce((a, b) =>
      comparePackVersions(a.version, b.version) === -1 ? b : a,
    );
    const current = upgrades.get(packKey(latest));
    if (!current || comparePackVersions(entry.version, current.version) === 1)
      upgrades.set(packKey(latest), entry);
  }
  return upgrades;
}

function safeURL(input: string, base?: string) {
  const url = new URL(input, base);
  if (
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      )) ||
    url.username ||
    url.password
  )
    throw new Error("Use an HTTPS content-pack server.");
  return url;
}
export function catalogLocation() {
  const configured = import.meta.env.VITE_CONTENT_PACK_CATALOG_URL as
    string | undefined;
  if (Capacitor.isNativePlatform() && !configured)
    throw new Error(
      "Content-pack downloads are not configured for this build. Import a pack JSON file instead.",
    );
  return safeURL(configured || "content-packs/catalog.json", document.baseURI)
    .href;
}
export async function boundedDownload(
  url: string,
  limit: number,
  signal: AbortSignal,
  fetcher = fetch,
) {
  const response = await fetcher(url, {
    signal,
    credentials: "omit",
    redirect: "error",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(
      `Download unavailable (${response.status}). Try again when online.`,
    );
  const length = Number(response.headers.get("content-length"));
  if (length > limit) throw new Error("Download exceeds its size limit.");
  if (!response.body) throw new Error("The server returned an empty download.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) throw new Error("Download exceeds its size limit.");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
export async function fetchCatalog(
  url: string,
  signal: AbortSignal,
  fetcher = fetch,
) {
  const location = safeURL(url);
  const bytes = await boundedDownload(
    location.href,
    128 * 1024,
    signal,
    fetcher,
  );
  const catalog = catalogSchema.parse(
    JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
  );
  for (const pack of catalog.packs) {
    const target = safeURL(pack.url, location.href);
    if (target.origin !== location.origin)
      throw new Error(
        "Catalog downloads must use the same content-pack server.",
      );
    pack.url = target.href;
  }
  return catalog.packs;
}
export async function fetchCatalogPack(
  entry: CatalogPack,
  signal: AbortSignal,
  fetcher = fetch,
): Promise<ContentPack> {
  const bytes = await boundedDownload(
    safeURL(entry.url).href,
    entry.bytes,
    signal,
    fetcher,
  );
  signal.throwIfAborted();
  if (bytes.length !== entry.bytes || (await digest(bytes)) !== entry.sha256)
    throw new Error(
      "The download failed its integrity check. Nothing was installed; retry or refresh the catalog.",
    );
  const pack = parsePack(
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
  );
  if (
    pack.id !== entry.id ||
    pack.version !== entry.version ||
    pack.records.length !== entry.records ||
    pack.name !== entry.name ||
    pack.system !== entry.system
  )
    throw new Error("The downloaded pack does not match the catalog.");
  signal.throwIfAborted();
  return pack;
}
