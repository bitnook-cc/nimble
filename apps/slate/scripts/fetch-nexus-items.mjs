// Snapshot public items carrying an explicit Nimble book source. The JSON API
// omits source attribution, so use the site's public source filter and pagination.
import fs from "node:fs";
import { chromium } from "@playwright/test";

const destination = process.argv[2];
if (!destination)
  throw new Error("Usage: node scripts/fetch-nexus-items.mjs <snapshot.json>");
const officialSources = new Set([
  "Nimble Core Rules",
  "Core Rules 3.0",
  "Nimble GMG",
  "Nimble Heroes Book",
  "Nimble Supplementary Content",
]);
const collected = new Map();
const sources = new Map();
function collect(value) {
  if (!value || typeof value !== "object") return;
  if (value.queryKey?.[0] === "sources")
    for (const source of value.state.data)
      if (officialSources.has(source.name)) sources.set(source.id, source);
  if (
    value.visibility === "public" &&
    value.description !== undefined &&
    officialSources.has(value.source?.name) &&
    value.id &&
    value.rarity
  ) {
    // Keep content and attribution only; no Discord IDs, avatars or account data.
    collected.set(value.id, {
      id: value.id,
      name: value.name,
      kind: value.kind === "$undefined" ? "" : value.kind,
      rarity: value.rarity,
      description: value.description,
      moreInfo: value.moreInfo === "$undefined" ? "" : (value.moreInfo ?? ""),
      source: {
        name: value.source.name,
        license: value.source.license,
        link: value.source.link,
      },
      contributor: value.creator?.displayName,
    });
  }
  for (const child of Object.values(value)) collect(child);
}
function flight(text) {
  for (const line of text.split("\n")) {
    try {
      collect(JSON.parse(line.slice(line.indexOf(":") + 1)));
    } catch {
      /* non-JSON Flight instructions */
    }
  }
}
const browser = await chromium.launch({
  channel: process.env.SLATE_BROWSER_CHANNEL || undefined,
});
try {
  const page = await browser.newPage();
  await page.route("https://nimble.nexus/**", async (route) => {
    if (
      route.request().method() !== "POST" ||
      !route.request().headers()["next-action"]
    )
      return route.continue();
    const response = await route.fetch();
    flight(await response.text());
    await route.fulfill({ response });
  });
  await page.goto("https://nimble.nexus/items");
  const html = await (
    await page.request.get("https://nimble.nexus/items")
  ).text();
  const initialFlight = [
    ...html.matchAll(/self\.__next_f\.push\((\[.*?\])\)<\/script>/gs),
  ]
    .map((match) => JSON.parse(match[1])[1])
    .filter((value) => typeof value === "string")
    .join("");
  flight(initialFlight);
  if (sources.size !== officialSources.size)
    throw new Error(
      "Official source inventory changed; review before updating the bundle.",
    );
  for (const source of sources.values()) {
    await page.goto(
      `https://nimble.nexus/items?source=${encodeURIComponent(source.abbreviation)}&sort=name`,
    );
    // The client applies the source filter after hydration.
    await page.waitForLoadState("networkidle");
    flight(
      await page.evaluate(() =>
        window.__next_f
          .filter((x) => typeof x[1] === "string")
          .map((x) => x[1])
          .join(""),
      ),
    );
    for (let count = 0; count < 300; count++) {
      const more = page.getByRole("button", { name: "Load More", exact: true });
      if (!(await more.isVisible())) break;
      await more.click();
      await page.waitForLoadState("networkidle");
      if (count === 299) throw new Error("Item pagination exceeded its bound.");
    }
    const displayed = await page
      .getByRole("heading", { level: 2 })
      .allTextContents();
    const captured = [...collected.values()].filter(
      (i) => i.source.name === source.name,
    );
    if (
      displayed.length !== captured.length ||
      displayed.some(
        (name) => !captured.some((item) => item.name === name.trim()),
      )
    )
      throw new Error(
        `Item coverage mismatch for ${source.name}: ${displayed.length} displayed, ${captured.length} captured`,
      );
    if (
      captured.some(
        (item) =>
          /^\$[0-9a-f]+$/i.test(item.description) ||
          /^\$[0-9a-f]+$/i.test(item.moreInfo),
      )
    )
      throw new Error(`Unresolved item text for ${source.name}`);
    console.log(
      `${source.name}: ${[...collected.values()].filter((i) => i.source.name === source.name).length} items`,
    );
  }
  if (!collected.size) throw new Error("No attributed official items found.");
  fs.writeFileSync(
    destination,
    JSON.stringify(
      {
        format: "nexus-official-items-snapshot",
        retrievedAt: new Date().toISOString(),
        url: "https://nimble.nexus/items",
        sources: [...sources.values()],
        items: [...collected.values()].sort((a, b) => a.id.localeCompare(b.id)),
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
