import { expect, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { test, slateURL, disconnect } from "./browser-fixtures";
import { ready, saved, appearance } from "./ui-fixtures";

const name = "5.5e SRD 5.2.1 · 2024 rules";
const packRequests = new WeakMap<Page, string[]>();
test.use({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
  colorScheme: "light",
});
test.beforeEach(async ({ page }) => {
  const requests: string[] = [];
  packRequests.set(page, requests);
  page.on("request", (request) => {
    if (request.url().endsWith(".slate-content.json"))
      requests.push(request.url());
  });
  await page.goto(slateURL(page));
  await ready(page);
});
async function packs(page: Page) {
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  const library = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await library
    .getByRole("button", { name: "Content packs", exact: true })
    .click();
  return library;
}
async function storedPacks(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const request = indexedDB.open("nimble-slate", 3);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("packs", "readonly"),
            values = tx.objectStore("packs").getAll();
          tx.oncomplete = () => {
            db.close();
            resolve(values.result.map((p: { id: string }) => p.id));
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
  );
}

test("the optional SRD downloads only by choice, previews without writes, and installs durable offline references", async ({
  page,
  context,
}) => {
  test.setTimeout(60_000);
  const downloads = packRequests.get(page)!;
  const before = await storedPacks(page);
  expect(before).not.toContain("srd-5-2024");
  const library = await packs(page);
  const available = library.getByRole("region", {
    name: "Available content packs",
  });
  await expect(available).toContainText(name);
  await expect(available).toContainText("1,309 records");
  expect(downloads).toHaveLength(0);
  await available
    .getByRole("button", { name: "Preview pack", exact: true })
    .click();
  const preview = library.locator("#pack-install-preview");
  await expect(
    preview.getByRole("heading", { name, exact: true }),
  ).toBeVisible();
  expect(await storedPacks(page)).toEqual(before);
  const fireball = preview.locator(".exchange-records > li > details").filter({
    has: page.locator("summary").filter({ hasText: /^Fireball · spell$/ }),
  });
  await fireball.locator(":scope > summary").click();
  await expect(fireball).toContainText("8d6 Fire damage");
  await preview
    .getByRole("button", { name: "Install content pack", exact: true })
    .click();
  await expect(preview).toHaveCount(0);
  await saved(page);
  expect(await storedPacks(page)).toContain("srd-5-2024");
  await expect(available).not.toContainText(name);
  await expect(available).toContainText(
    "All listed packs are already installed.",
  );
  const installed = library
    .locator(".pack-row")
    .filter({
      has: page.getByRole("button", { name: "Disable pack", exact: true }),
    })
    .filter({ hasText: name });
  await installed
    .getByRole("button", { name: "Disable pack", exact: true })
    .click();
  await expect(installed).toHaveCount(0);
  await expect(available).not.toContainText(name);
  const disabled = library
    .locator(".pack-row")
    .filter({
      has: page.getByRole("button", { name: "Enable pack", exact: true }),
    })
    .filter({ hasText: name });
  await disabled
    .getByRole("button", { name: "Enable pack", exact: true })
    .click();
  await library.getByRole("button", { name: "Browse", exact: true }).click();
  await library
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption({ label: name });
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Fireball");
  await library.getByRole("button", { name: /^Fireball spell/ }).click();
  const view = page.getByRole("dialog", { name: "Fireball", exact: true });
  await expect(view).toContainText("150 feet");
  await view
    .getByRole("button", { name: "Pin to screen", exact: true })
    .click();
  await view.getByRole("button", { name: "Close dialog", exact: true }).click();
  await saved(page);
  await page.reload();
  await ready(page);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await disconnect(context);
  await page.reload();
  await ready(page);
  await expect(
    page.getByRole("region", { name: "Fireball", exact: true }),
  ).toContainText("8d6 Fire damage");
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  await library
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption({ label: name });
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Aboleth");
  await library
    .getByRole("combobox", { name: "Content type", exact: true })
    .selectOption("rule");
  await expect(library.getByRole("button", { name: /^Aboleth / })).toHaveCount(
    0,
  );
  await library
    .getByRole("combobox", { name: "Content type", exact: true })
    .selectOption("monster");
  await library.getByRole("button", { name: /^Aboleth monster/ }).click();
  const monster = page.getByRole("dialog", { name: "Aboleth", exact: true });
  await expect(monster).toContainText("Legendary Actions");
  await expect(monster.getByRole("table")).toBeVisible();
  await expect(
    monster.getByRole("button", { name: /Add.*combat/ }),
  ).toHaveCount(0);
  await monster
    .locator("summary")
    .filter({ hasText: "Source and attribution" })
    .click();
  await expect(monster).toContainText("Creative Commons Attribution 4.0");
  await expect(
    monster.getByRole("link", { name: /^Source document/ }),
  ).toHaveAttribute("href", "https://www.dndbeyond.com/srd");
  await monster
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await library
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  const tracker = page.getByRole("region", {
    name: "Initiative tracker",
    exact: true,
  });
  await tracker.getByRole("tab", { name: "Monsters", exact: true }).click();
  await tracker
    .getByRole("searchbox", { name: "Search monsters", exact: true })
    .fill("Aboleth");
  await expect(
    tracker.getByText("Reference only · combat automation unavailable", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    tracker.getByRole("button", {
      name: "Add Aboleth to encounter",
      exact: true,
    }),
  ).toBeDisabled();
  await tracker
    .getByRole("button", { name: "Preview Aboleth", exact: true })
    .click();
  await expect(monster).toContainText("Legendary Actions");
});

test("first-version SRD packs keep their references and show monsters under the correct type, including editable campaign copies", async ({
  page,
}) => {
  const library = await packs(page);
  await library
    .getByLabel("Import content pack", { exact: true })
    .setInputFiles(
      resolve("public/content-packs/srd-5-2024-5.2.1.1.slate-content.json"),
    );
  const preview = library.locator("#pack-install-preview");
  await expect(
    preview
      .locator(":scope .exchange-records > li > details > summary")
      .filter({ hasText: /^Aboleth · monster$/ }),
  ).toBeVisible();
  await preview
    .getByRole("button", { name: "Install content pack", exact: true })
    .click();
  await expect(preview).toHaveCount(0);
  await library.getByRole("button", { name: "Browse", exact: true }).click();
  await library
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption({ label: name });
  await library
    .getByRole("combobox", { name: "Content type", exact: true })
    .selectOption("monster");
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Aboleth");
  await library.getByRole("button", { name: /^Aboleth monster/ }).click();
  const view = page.getByRole("dialog", { name: "Aboleth", exact: true });
  await expect(view).toContainText("Legendary Actions");
  await view
    .getByRole("button", { name: "Make campaign copy", exact: true })
    .click();
  await view.getByRole("button", { name: "Edit content", exact: true }).click();
  await expect(view.getByLabel("Monster level", { exact: true })).toHaveCount(
    0,
  );
  await view
    .getByLabel("Content title", { exact: true })
    .fill("Campaign Aboleth");
  await view.getByRole("button", { name: "Save content", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Campaign Aboleth", exact: true }),
  ).toContainText("Legendary Actions");
  await page.keyboard.press("Escape");
  await library
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption("campaign");
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Campaign Aboleth");
  await expect(
    library.getByRole("button", { name: /^Campaign Aboleth monster/ }),
  ).toBeVisible();
});

test("corrupted downloads and cancellation leave storage untouched", async ({
  page,
}) => {
  const before = await storedPacks(page);
  const library = await packs(page);
  const available = library.getByRole("region", {
    name: "Available content packs",
  });
  await page.route("**/content-packs/*.slate-content.json", (route) =>
    route.fulfill({ contentType: "application/json", body: "{}" }),
  );
  await available
    .getByRole("button", { name: "Preview pack", exact: true })
    .click();
  await expect(available.getByRole("alert")).toContainText("integrity check");
  expect(await storedPacks(page)).toEqual(before);
  await page.unroute("**/content-packs/*.slate-content.json");
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/content-packs/*.slate-content.json", async (route) => {
    await held;
    await route.abort().catch(() => {});
  });
  await available
    .getByRole("button", { name: "Preview pack", exact: true })
    .click();
  await available
    .getByRole("button", { name: "Cancel download", exact: true })
    .click();
  await expect(available.getByRole("alert")).toContainText("cancelled");
  release();
  await expect(library.locator("#pack-install-preview")).toHaveCount(0);
  expect(await storedPacks(page)).toEqual(before);
});

test("catalog failures can be retried and the browser fits mobile dark and desktop light layouts", async ({
  page,
}, info) => {
  await page.route("**/content-packs/catalog.json", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  const library = await packs(page);
  const available = library.getByRole("region", {
    name: "Available content packs",
  });
  await expect(available.getByRole("alert")).toContainText(
    "catalog is unavailable",
  );
  await expect(
    library.getByRole("button", { name: "Disable pack", exact: true }),
  ).toHaveCount(3);
  await page.unroute("**/content-packs/catalog.json");
  await available
    .getByRole("button", { name: "Refresh pack catalog", exact: true })
    .click();
  await expect(
    available.getByRole("button", { name: "Preview pack", exact: true }),
  ).toBeEnabled();
  await expect(available.getByRole("alert")).toHaveCount(0);
  if (info.project.name === "firefox" || info.project.name === "webkit") return;
  await available
    .getByRole("heading", { name: "Available to install" })
    .click();
  await expect(available).toHaveScreenshot("optional-srd-light.png");
  await library
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await appearance(page, "Dark");
  await packs(page);
  await expect(
    available.getByRole("button", { name: "Preview pack", exact: true }),
  ).toBeEnabled();
  await available
    .getByRole("heading", { name: "Available to install" })
    .click();
  await expect(available).toHaveScreenshot("optional-srd-mobile-dark.png");
  expect(
    await available.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
});
