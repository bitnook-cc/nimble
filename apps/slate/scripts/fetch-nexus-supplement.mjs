// Public book-attributed records absent from the pinned official seed files.
import fs from "node:fs";
import { chromium } from "@playwright/test";
const [checkout, destination] = process.argv.slice(2);
if (!checkout || !destination)
  throw new Error(
    "Usage: node scripts/fetch-nexus-supplement.mjs <Nexus checkout> <snapshot.json>",
  );
const sources = JSON.parse(
  fs.readFileSync("src/content/nexus-official-items.json"),
).sources;
const expected = new Map();
function seeds(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const path = directory + "/" + entry.name;
    if (entry.isDirectory()) seeds(path);
    else if (entry.name.endsWith(".json"))
      for (const resource of JSON.parse(fs.readFileSync(path)).data) {
        if (!expected.has(resource.type))
          expected.set(resource.type, new Set());
        expected.get(resource.type).add(resource.attributes.name.trim());
      }
  }
}
seeds(checkout + "/data/official");
const browser = await chromium.launch({
  channel: process.env.SLATE_BROWSER_CHANNEL || undefined,
});
try {
  const page = await browser.newPage();
  let current = "";
  const found = new Map();
  const collect = (value) => {
    if (!value || typeof value !== "object") return;
    const source = sources.find(
      (source) =>
        source.name === value.source?.name || source.id === value.sourceId,
    );
    if (value.id && value.name && source) {
      if (!found.has(current)) found.set(current, new Map());
      found
        .get(current)
        .set(value.id, {
          ...value,
          source:
            typeof value.source === "object"
              ? value.source
              : {
                  ...source,
                  license: "Nimble 3rd Party Creator License v2.0",
                  link: "https://nimblerpg.com/",
                },
        });
    }
    for (const child of Object.values(value)) collect(child);
  };
  const flight = (text) => {
    for (const line of text.split("\n")) {
      try {
        collect(JSON.parse(line.slice(line.indexOf(":") + 1)));
      } catch {}
    }
  };
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
  const records = [],
    coverage = [];
  for (const kind of [
    "monsters",
    "ancestries",
    "backgrounds",
    "classes",
    "subclasses",
    "spell-schools",
    "random-tables",
  ]) {
    current = kind;
    for (const source of ["monsters", "ancestries", "backgrounds"].includes(
      kind,
    )
      ? sources
      : [sources[0]]) {
      const url = `https://nimble.nexus/${kind === "random-tables" ? "tables" : kind}?source=${source.abbreviation}&sort=name`;
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      const html = await (await page.request.get(url)).text();
      flight(
        [...html.matchAll(/self\.__next_f\.push\((\[.*?\])\)<\/script>/gs)]
          .map((match) => JSON.parse(match[1])[1])
          .filter((value) => typeof value === "string")
          .join(""),
      );
      flight(
        await page.evaluate(() =>
          window.__next_f
            .filter((x) => typeof x[1] === "string")
            .map((x) => x[1])
            .join(""),
        ),
      );
      for (let count = 0; count < 200; count++) {
        const more = page.getByRole("button", {
          name: "Load More",
          exact: true,
        });
        if (!(await more.isVisible())) break;
        if (!(await more.isEnabled())) {
          await page.waitForTimeout(500);
          continue;
        }
        await more.click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(500);
        if (count === 199)
          throw new Error("Catalog pagination exceeded its bound.");
      }
    }
    const values = [...(found.get(kind)?.values() ?? [])];
    if (!values.length && kind !== "random-tables")
      throw new Error(`No official records captured: ${kind}`);
    const extra = values.filter(
      (value) => !expected.get(kind).has(value.name.trim()),
    );
    for (const value of extra) {
      const source = {
        name: value.source.name,
        license: value.source.license,
        link: value.source.link,
      };
      let document;
      if (kind === "monsters") {
        const response = await page.request.get(
          `https://nimble.nexus/api/monsters/${value.id}?include=families`,
        );
        if (!response.ok())
          throw new Error(`Unable to read full monster ${value.name}`);
        document = await response.json();
        // The public API's creator relationship is unnecessary account metadata.
        delete document.data.relationships?.creator;
        document.included = (document.included ?? []).filter(
          (resource) => resource.type === "families",
        );
        for (const resource of document.included)
          delete resource.relationships?.creator;
      } else {
        const attributes = Object.fromEntries(
          Object.entries(value).filter(
            ([key]) =>
              ![
                "id",
                "creator",
                "source",
                "visibility",
                "createdAt",
                "updatedAt",
                "userId",
                "sourceId",
              ].includes(key),
          ),
        );
        document = { data: { type: kind, id: value.id, attributes } };
      }
      records.push({
        kind,
        name: value.name.trim(),
        source,
        contributor: value.creator?.displayName,
        document,
      });
    }
    coverage.push({
      kind,
      live: values.length,
      seeds: expected.get(kind).size,
      additional: extra.length,
    });
    console.log(JSON.stringify(coverage.at(-1)));
  }
  fs.writeFileSync(
    destination,
    JSON.stringify(
      {
        format: "nexus-official-supplement",
        retrievedAt: new Date().toISOString(),
        url: "https://nimble.nexus",
        coverage,
        records,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
