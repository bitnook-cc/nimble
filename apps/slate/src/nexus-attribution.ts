import type { ContentRecord } from "./content-schema";

export const nexusPlatform = {
  name: "Nimble Nexus",
  url: "https://nimble.nexus",
  developer: "byteslicer",
  developerUrl: "https://nimble.nexus/u/_byteslicer",
} as const;
export const nexusCredit = `Source platform: ${nexusPlatform.name} (${nexusPlatform.url}), developed by ${nexusPlatform.developer} (${nexusPlatform.developerUrl}).`;

export function isNexusSource(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      (["nimble.nexus", "nimble.monster"].includes(url.hostname) ||
        (url.hostname === "github.com" &&
          /^\/dstrelau\/nimble\.monster(?:\/|$)/.test(url.pathname)))
    );
  } catch {
    return false;
  }
}

// Keep the platform's developer distinct from the creator of each record.
export function creditNexusRecords(records: ContentRecord[]): ContentRecord[] {
  return records.map((record) => ({
    ...record,
    fields: {
      ...record.fields,
      nexus: {
        ...(record.fields.nexus as Record<string, unknown> | undefined),
        platform: nexusPlatform,
      },
    },
  }));
}
