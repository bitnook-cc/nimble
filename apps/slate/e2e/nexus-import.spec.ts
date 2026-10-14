import { expect, type Page, type Locator } from "@playwright/test";
import { test, slateURL, disconnect } from "./browser-fixtures";
import { ready, saved, appearance } from "./ui-fixtures";

const guard = {
  type: "monsters",
  id: "link-guard",
  attributes: {
    name: "Link guard",
    hp: 20,
    level: "1/2",
    armor: "medium",
    abilities: [],
    actions: [{ name: "Spear", damage: { roll: "1d6+2" } }],
  },
  relationships: {
    families: { data: [{ type: "families", id: "link-soldiers" }] },
  },
};
const family = {
  type: "families",
  id: "link-soldiers",
  attributes: {
    name: "Soldiers",
    abilities: [{ name: "Shield wall", description: "Stand together." }],
  },
};
const hazard = {
  type: "monsters",
  id: "link-hazard",
  attributes: {
    name: "Link avalanche",
    hazard: true,
    level: "3",
    abilities: [{ name: "Warning", description: "Snow begins to shift." }],
    actions: [
      {
        name: "Collapse",
        description: "Dodge the snow.",
        damage: { roll: "2d6" },
      },
    ],
  },
};
const gate = {
  type: "encounters",
  id: "link-gate",
  attributes: {
    name: "Link gate",
    heroCount: 4,
    heroLevel: 2,
    description: "Guard the moonlit gate.",
  },
  relationships: {
    monsters: {
      data: [
        {
          type: "monsters",
          id: guard.id,
          meta: { quantity: 1, isPerHero: true, heroesPerMonster: 2 },
        },
      ],
    },
  },
};
const item = {
  type: "items",
  id: "link-lantern",
  attributes: {
    name: "Link lantern",
    kind: "Wondrous",
    rarity: "rare",
    description: "Silver light.",
  },
};
const pack = {
  format: "slate-content",
  schemaVersion: 1,
  id: "link-pack",
  version: "1",
  name: "Link rules",
  source: { revision: "1", license: "Test content." },
  records: [
    {
      id: "rule",
      kind: "rule",
      title: "Link rule",
      body: "Keep a steady watch.",
      tags: [],
      category: "Test",
      sources: [],
      related: [],
      fields: {},
    },
  ],
  terms: [],
  assets: {},
};
const errors = new WeakMap<Page, string[]>();
test.use({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
  colorScheme: "light",
});
test.beforeEach(async ({ page }) => {
  const caught: string[] = [];
  errors.set(page, caught);
  page.on("pageerror", (e) => caught.push(e.message));
  await page.route("https://nimble.nexus/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const documents: Record<string, unknown> = {
      "/api/encounters/link-gate": {
        data: gate,
        included: [
          {
            ...guard,
            attributes: { name: "Link guard", hp: 20, level: "1/2" },
          },
        ],
      },
      "/api/monsters/link-guard": { data: guard, included: [family] },
      "/api/monsters/link-hazard": { data: hazard },
      "/api/items/link-lantern": { data: item },
    };
    await route.fulfill({
      status: documents[path] ? 200 : 404,
      contentType: "application/vnd.api+json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(documents[path] ?? { error: "missing" }),
    });
  });
  await page.goto(slateURL(page));
  await ready(page);
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});
async function open(page: Page) {
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  const library = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  const top = library.getByRole("group", { name: "Library sections" });
  await expect(
    top.getByRole("button", { name: "Content packs", exact: true }),
  ).toBeVisible();
  await top
    .getByRole("button", { name: "Import / export content", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Import and export content",
    exact: true,
  });
  await expect(
    dialog.getByRole("button", { name: "Nexus link", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    dialog
      .getByRole("group", { name: "Import source" })
      .getByRole("button")
      .first(),
  ).toHaveText("Nexus link");
  await expect(
    dialog.getByLabel("Nimble Nexus link", { exact: true }),
  ).toBeVisible();
  return dialog;
}
async function preview(dialog: Locator, url: string) {
  await dialog.getByRole("button", { name: "Nexus link", exact: true }).click();
  await dialog.getByLabel("Nimble Nexus link", { exact: true }).fill(url);
  await dialog
    .getByRole("button", { name: "Preview Nexus import", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: /Import preview/ }),
  ).toBeVisible();
  const credit = dialog.locator(".nexus-credit").first();
  await expect(
    credit.getByRole("link", { name: "Nimble Nexus", exact: true }),
  ).toHaveAttribute("href", "https://nimble.nexus");
  await expect(
    credit.getByRole("link", { name: "byteslicer", exact: true }),
  ).toHaveAttribute("href", "https://nimble.nexus/u/_byteslicer");
}
async function persisted(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const request = indexedDB.open("nimble-slate", 3);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction(["state", "packs"], "readonly");
          const app = tx.objectStore("state").get("app");
          const packs = tx.objectStore("packs").getAll();
          tx.oncomplete = () => {
            db.close();
            resolve(JSON.stringify({ app: app.result, packs: packs.result }));
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
  );
}
async function close(dialog: Locator) {
  await dialog
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
}

test("hazards import from links and remain usable as pinned references offline", async ({
  page,
  context,
}) => {
  const dialog = await open(page);
  await preview(dialog, "https://nimble.nexus/hazards/link-hazard");
  const list = dialog.getByRole("list", { name: "Records to import" });
  await expect(list.locator(":scope > li > details > summary")).toContainText(
    "Link avalanche · hazard",
  );
  await dialog
    .getByRole("button", { name: "Expand all previews", exact: true })
    .click();
  await expect(list).toContainText("Snow begins to shift.");
  await dialog
    .getByRole("button", { name: "Import into campaign", exact: true })
    .click();
  await expect(dialog.getByRole("status")).toContainText("imported and saved");
  await close(dialog);
  const library = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await library
    .getByRole("combobox", { name: "Content type", exact: true })
    .selectOption("hazard");
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Link avalanche");
  await library.getByRole("button", { name: /Link avalanche hazard/ }).click();
  const view = page.getByRole("dialog", {
    name: "Link avalanche",
    exact: true,
  });
  await expect(view).toContainText("Snow begins to shift.");
  await expect(
    view.getByRole("link", { name: "View on Nimble Nexus" }),
  ).toHaveAttribute("href", "https://nimble.nexus/hazards/link-hazard");
  await expect(view.locator("dt").filter({ hasText: /^HP$/ })).toHaveCount(0);
  await view
    .getByRole("button", { name: "Pin to screen", exact: true })
    .click();
  await close(view);
  await expect(library).toBeHidden();
  await saved(page);
  await page.reload();
  await ready(page);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await page.unrouteAll({ behavior: "wait" });
  await disconnect(context);
  await page.reload();
  await ready(page);
  await expect(
    page.getByRole("region", { name: "Link avalanche", exact: true }),
  ).toContainText("Snow begins to shift.");
});

test("campaign hazards can be authored as references", async ({ page }) => {
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  const library = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  const kind = "hazard";
  await library
    .getByRole("button", { name: "Create content", exact: true })
    .click();
  await library
    .getByRole("combobox", { name: "New content type", exact: true })
    .selectOption(kind);
  await library
    .getByLabel("New content title", { exact: true })
    .fill(`Campaign ${kind}`);
  await library
    .getByLabel("New content Markdown", { exact: true })
    .fill(`## ${kind} details\n\nRemember the ${kind}.`);
  await library
    .getByRole("button", { name: "Create reference", exact: true })
    .click();
  const view = page.getByRole("dialog", {
    name: `Campaign ${kind}`,
    exact: true,
  });
  await expect(view).toContainText(`Remember the ${kind}.`);
  await expect(view.locator(".content-meta")).toContainText(
    `${kind} · Campaign content`,
  );
  await close(view);
});

test("previews every dependency and inline rolls without writing; cancellation is harmless; campaign records survive offline", async ({
  page,
  context,
}) => {
  const dialog = await open(page);
  const before = await persisted(page);
  await preview(dialog, "https://nimble.nexus/encounters/link-gate");
  const list = dialog.getByRole("list", { name: "Records to import" });
  await expect(list.locator(":scope > li")).toHaveCount(2);
  await expect(list).toContainText("Link gate · encounter");
  await expect(list).toContainText("Link guard · monster");
  await dialog
    .getByRole("button", { name: "Expand all previews", exact: true })
    .click();
  await expect(list).toContainText("Shield wall");
  await dialog
    .getByRole("button", { name: "Collapse previews", exact: true })
    .click();
  await expect(list.locator("details[open]")).toHaveCount(0);
  await list.locator("summary").filter({ hasText: "Link gate" }).click();
  await list.getByRole("button", { name: "Link guard", exact: true }).click();
  const nested = page.getByRole("dialog", { name: "Link guard", exact: true });
  await expect(nested).toContainText("Shield wall");
  await nested
    .locator("summary")
    .filter({ hasText: "Source and attribution" })
    .click();
  await expect(
    nested.getByRole("link", { name: "byteslicer", exact: true }),
  ).toBeVisible();
  await nested.getByRole("button", { name: "1d6+2", exact: true }).click();
  await expect(nested.getByRole("status")).toBeVisible();
  await close(nested);
  await expect.poll(() => persisted(page)).toBe(before);
  await dialog
    .getByRole("button", { name: "Cancel import", exact: true })
    .click();
  await expect(list).toHaveCount(0);
  expect(await persisted(page)).toBe(before);
  await preview(dialog, "https://nimble.nexus/encounters/link-gate");
  await dialog
    .getByRole("combobox", { name: "Import destination", exact: true })
    .selectOption("campaign");
  await dialog
    .getByRole("button", { name: "Import into campaign", exact: true })
    .click();
  await expect(dialog.getByRole("status")).toContainText("imported and saved");
  await close(dialog);
  const library = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await library
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption("campaign");
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Link guard");
  await expect(
    library.getByRole("button", { name: "Edit Link guard", exact: true }),
  ).toBeVisible();
  await close(library);
  await saved(page);
  await page.reload();
  await ready(page);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await page.unrouteAll({ behavior: "wait" });
  await disconnect(context);
  await page.reload();
  await ready(page);
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  await library
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption("campaign");
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Link gate");
  await library.getByRole("button", { name: /Link gate encounter/ }).click();
  const restored = page.getByRole("dialog", { name: "Link gate", exact: true });
  await restored
    .getByRole("button", { name: "Link guard", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Link guard", exact: true }),
  ).toContainText("Shield wall");
});

test("imports an immutable named pack and keeps its campaign records separate", async ({
  page,
}) => {
  const dialog = await open(page);
  await preview(dialog, "https://nimble.nexus/items/link-lantern");
  await dialog
    .getByRole("combobox", { name: "Import destination", exact: true })
    .selectOption("pack");
  await dialog
    .getByLabel("Import pack name", { exact: true })
    .fill("Moonlight collection");
  await dialog
    .getByRole("button", { name: "Import as content pack", exact: true })
    .click();
  await expect(dialog.getByRole("status")).toContainText(
    "Content pack imported and saved",
  );
  await close(dialog);
  const library = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await library
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption({ label: "Moonlight collection" });
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Link lantern");
  await expect(
    library.getByRole("button", {
      name: "Edit campaign copy of Link lantern",
      exact: true,
    }),
  ).toBeVisible();
  await library
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption("campaign");
  await expect(
    library.getByText(/No matching content\. Try another search/),
  ).toBeVisible();
  await library
    .getByRole("button", { name: "Content packs", exact: true })
    .click();
  await expect(
    library.locator(".pack-row").filter({ hasText: "Moonlight collection" }),
  ).toContainText("Enabled for this campaign");
});

test("file pack previews offer campaign copies through both import entry points", async ({
  page,
}) => {
  const dialog = await open(page);
  await dialog.getByRole("button", { name: "JSON file", exact: true }).click();
  await dialog
    .getByLabel("Import content JSON", { exact: true })
    .setInputFiles({
      name: "rules.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(pack)),
    });
  await expect(
    dialog.getByRole("list", { name: "Records to import" }),
  ).toContainText("Keep a steady watch.");
  await expect(
    dialog.getByRole("combobox", { name: "Import destination", exact: true }),
  ).toHaveValue("pack");
  await dialog
    .getByRole("combobox", { name: "Import destination", exact: true })
    .selectOption("campaign");
  await dialog
    .getByRole("button", { name: "Cancel import", exact: true })
    .click();
  await close(dialog);
  const library = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await library
    .getByRole("button", { name: "Content packs", exact: true })
    .click();
  await library
    .getByLabel("Import content pack", { exact: true })
    .setInputFiles({
      name: "rules.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(pack)),
    });
  await expect(
    library.getByRole("list", { name: "Records to import" }),
  ).toContainText("Keep a steady watch.");
  await library
    .getByRole("combobox", { name: "Import destination", exact: true })
    .selectOption("campaign");
  await library
    .getByRole("button", { name: "Import into campaign", exact: true })
    .click();
  await expect(
    library.getByRole("list", { name: "Records to import" }),
  ).toHaveCount(0);
  await library.getByRole("button", { name: "Browse", exact: true }).click();
  await library
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption("campaign");
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Link rule");
  await expect(
    library.getByRole("button", { name: "Edit Link rule", exact: true }),
  ).toBeVisible();
});

test("missing entries and cancelling an in-flight fetch store nothing", async ({
  page,
}) => {
  const dialog = await open(page);
  const before = await persisted(page);
  await dialog.getByRole("button", { name: "Nexus link", exact: true }).click();
  await dialog
    .getByLabel("Nimble Nexus link", { exact: true })
    .fill("https://nimble.nexus/items/private");
  await dialog
    .getByRole("button", { name: "Preview Nexus import", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("missing or private");
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("https://nimble.nexus/api/items/held**", async (route) => {
    await held;
    await route
      .fulfill({
        contentType: "application/vnd.api+json",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ data: { ...item, id: "held" } }),
      })
      .catch(() => {});
  });
  await dialog
    .getByLabel("Nimble Nexus link", { exact: true })
    .fill("https://nimble.nexus/items/held");
  const requested = page.waitForRequest(/\/api\/items\/held/);
  await dialog
    .getByRole("button", { name: "Preview Nexus import", exact: true })
    .click();
  await requested;
  await dialog
    .getByRole("button", { name: "Cancel preview", exact: true })
    .click();
  release();
  await expect(
    dialog.getByRole("heading", { name: /Import preview/ }),
  ).toHaveCount(0);
  expect(await persisted(page)).toBe(before);
});

test("link import preview stays compact in light and mobile dark layouts", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "firefox" || info.project.name === "webkit",
    "Visual baselines are reviewed in the main browser suite.",
  );
  const dialog = await open(page);
  await preview(dialog, "https://nimble.nexus/encounters/link-gate");
  await dialog.getByRole("heading", { name: /Import preview/ }).click();
  await expect(dialog).toHaveScreenshot("nexus-preview-light.png");
  await close(dialog);
  await close(
    page.getByRole("dialog", { name: "Campaign library", exact: true }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await appearance(page, "Dark");
  const mobile = await open(page);
  await preview(mobile, "https://nimble.nexus/items/link-lantern");
  await mobile.getByRole("heading", { name: /Import preview/ }).click();
  await expect(mobile).toHaveScreenshot("nexus-preview-mobile-dark.png");
});
