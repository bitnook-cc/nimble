import { openWidgetPicker } from "./ui-fixtures";
import { expect, test, type Page } from "@playwright/test";
async function ready(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("main", { name: "GM screen" })).toBeVisible();
}
async function library(page: Page) {
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
}
async function saved(page: Page) {
  await expect(
    page.getByRole("status").filter({ hasText: "Saved on this device" }),
  ).toBeVisible();
}
test("library row icons edit, pin and delete campaign content with confirmation and offline persistence", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  await library(page);
  const browse = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await browse
    .getByRole("button", { name: "Create content", exact: true })
    .click();
  await browse.getByLabel("New content title").fill("Table reminder");
  await browse
    .getByLabel("New content Markdown")
    .fill("Check the northern gate.");
  await browse
    .getByRole("button", { name: "Create reference", exact: true })
    .click();
  let preview = page.getByRole("dialog", {
    name: "Table reminder",
    exact: true,
  });
  await preview
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  const row = browse.locator(".library-row");
  await expect(
    row.getByRole("button", { name: "Edit Table reminder", exact: true }),
  ).toBeVisible();
  await expect(
    row.getByRole("button", { name: "Delete Table reminder", exact: true }),
  ).toBeVisible();
  await expect(
    row.getByRole("button", { name: "Pin Table reminder", exact: true }),
  ).toBeVisible();
  await expect(browse).toHaveScreenshot("library-row-actions-light.png");
  await row
    .getByRole("button", { name: "Edit Table reminder", exact: true })
    .click();
  await preview
    .getByLabel("Content title", { exact: true })
    .fill("Gate reminder");
  await preview
    .getByRole("textbox", { name: "Markdown content", exact: true })
    .fill("Remember the silver key.");
  await preview
    .getByRole("button", { name: "Save content", exact: true })
    .click();
  preview = page.getByRole("dialog", { name: "Gate reminder", exact: true });
  await expect(preview).toContainText("Remember the silver key.");
  await preview
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await browse
    .getByLabel("Search content", { exact: true })
    .fill("Gate reminder");
  await row
    .getByRole("button", { name: "Pin Gate reminder", exact: true })
    .click();
  await expect(browse).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Gate reminder", exact: true }),
  ).toContainText("Remember the silver key.");
  await saved(page);
  await page.reload();
  await context.setOffline(true);
  await library(page);
  await browse
    .getByLabel("Search content", { exact: true })
    .fill("Gate reminder");
  await row
    .getByRole("button", { name: "Delete Gate reminder", exact: true })
    .click();
  let confirmation = page.getByRole("dialog", {
    name: "Delete Gate reminder?",
    exact: true,
  });
  await confirmation
    .getByRole("button", { name: "Keep content", exact: true })
    .click();
  await expect(row).toHaveCount(1);
  await row
    .getByRole("button", { name: "Delete Gate reminder", exact: true })
    .click();
  confirmation = page.getByRole("dialog", {
    name: "Delete Gate reminder?",
    exact: true,
  });
  await confirmation
    .getByRole("button", { name: "Delete content", exact: true })
    .click();
  await expect(confirmation).toHaveCount(0);
  await expect(row).toHaveCount(0);
  await expect(
    page.getByRole("dialog", { name: "Missing reference", exact: true }),
  ).toHaveCount(0);
  await expect(
    browse.getByLabel("Search content", { exact: true }),
  ).toBeFocused();
  await saved(page);
  await page.reload();
  await library(page);
  await browse
    .getByLabel("Search content", { exact: true })
    .fill("Gate reminder");
  await expect(row).toHaveCount(0);
  expect(errors).toEqual([]);
});
for (const kind of ["rule", "item", "monster"] as const) {
  test(`deleting a ${kind} from its preview returns to the library without a missing-reference dialog`, async ({
    page,
  }) => {
    await ready(page);
    await library(page);
    const browse = page.getByRole("dialog", {
      name: "Campaign library",
      exact: true,
    });
    await browse
      .getByRole("button", { name: "Create content", exact: true })
      .click();
    await browse.getByLabel("New content title").fill("Disposable content");
    await browse.getByLabel("New content type").selectOption(kind);
    await browse.getByLabel("New content Markdown").fill("Campaign test.");
    await browse
      .getByRole("button", { name: "Create reference", exact: true })
      .click();
    const preview = page.getByRole("dialog", {
      name: "Disposable content",
      exact: true,
    });
    await preview
      .getByRole("button", { name: "Edit content", exact: true })
      .click();
    const label = kind === "item" ? "item" : "content";
    await preview
      .getByRole("button", { name: `Delete ${label}`, exact: true })
      .click();
    await preview
      .getByRole("button", { name: `Confirm delete ${label}`, exact: true })
      .click();
    await expect(preview).toHaveCount(0);
    await expect(
      page.getByRole("dialog", { name: "Missing reference", exact: true }),
    ).toHaveCount(0);
    await expect(browse).toBeVisible();
    await expect(browse.locator(".library-row")).toHaveCount(0);
    await expect(
      browse.getByLabel("Search content", { exact: true }),
    ).toBeFocused();
    await saved(page);
    await page.reload();
    await library(page);
    await browse
      .getByLabel("Search content", { exact: true })
      .fill("Disposable content");
    await expect(browse.locator(".library-row")).toHaveCount(0);
  });
}
test("pack edit shortcut creates an editable campaign copy and leaves the original unchanged on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.keyboard.press("Escape");
  await library(page);
  const browse = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await browse.getByLabel("Search content", { exact: true }).fill("Flame Dart");
  await browse
    .getByRole("combobox", { name: "Content type", exact: true })
    .selectOption("spell");
  await expect(
    browse.getByRole("button", { name: "Delete Flame Dart", exact: true }),
  ).toHaveCount(0);
  await expect(browse).toHaveScreenshot("library-row-actions-mobile-dark.png");
  await browse
    .getByRole("button", {
      name: "Edit campaign copy of Flame Dart",
      exact: true,
    })
    .click();
  const preview = page.getByRole("dialog", { name: "Flame Dart", exact: true });
  await preview
    .getByLabel("Content title", { exact: true })
    .fill("My Flame Dart");
  await preview
    .getByRole("textbox", { name: "Markdown content", exact: true })
    .fill("A campaign-specific spell.");
  await preview
    .getByRole("button", { name: "Save content", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "My Flame Dart", exact: true })
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await browse
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption({ label: "Nimble · Core Rules" });
  await expect(browse.locator(".library-row")).toHaveCount(1);
  await browse.getByRole("button", { name: /^Flame Dart spell/ }).click();
  await expect(preview).toContainText("1d10");
  await preview
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await browse
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption("campaign");
  await expect(
    browse.getByRole("button", { name: /^My Flame Dart spell/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
test("Nexus rules, sections, diagrams and spells remain available offline with nested preview navigation", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await expect(
    page.getByText("Ready for offline play", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await context.setOffline(true);
  await library(page);
  await page.getByLabel("Search content", { exact: true }).fill("Blinded");
  await page.getByRole("button", { name: /^Blind rule/ }).click();
  let preview = page.getByRole("dialog", { name: "Blind", exact: true });
  await expect(preview.locator(".markdown")).toContainText("Blind");
  await page.keyboard.press("Escape");
  await page.getByLabel("Search content", { exact: true }).fill("Initiative");
  await page.getByRole("button", { name: /^Initiative rule/ }).click();
  preview = page.getByRole("dialog", { name: "Initiative", exact: true });
  await expect(preview).toContainText("Core Rules v2");
  await preview.getByRole("button", { name: "1d20", exact: true }).click();
  await expect(preview.getByRole("status")).toContainText(/\d/);
  await expect(page.locator(".result-total")).toHaveText(/\d/);
  await preview
    .getByRole("button", { name: "Turn Order", exact: true })
    .click();
  preview = page.getByRole("dialog", { name: "Turn Order", exact: true });
  await expect(preview).toBeVisible();
  await preview.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Initiative", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByLabel("Search content", { exact: true })
    .fill("Cones & Lines");
  await page.getByRole("button", { name: /^Cones & Lines rule/ }).click();
  preview = page.getByRole("dialog", { name: "Cones & Lines", exact: true });
  await expect(preview.getByRole("img")).toHaveCount(2);
  expect(
    await preview
      .getByRole("img")
      .first()
      .evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await page.getByLabel("Search content", { exact: true }).fill("Flame Dart");
  await page.getByRole("button", { name: /^Flame Dart spell/ }).click();
  preview = page.getByRole("dialog", { name: "Flame Dart", exact: true });
  await expect(preview).toContainText("1d10");
  await expect(preview).toContainText("Fire Spells");
  await preview
    .getByRole("button", { name: "Pin to screen", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await saved(page);
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Flame Dart", exact: true }),
  ).toContainText("1d10");
  expect(errors).toEqual([]);
});
test("notes insert references by keyboard and preserve links through rename and reload", async ({
  page,
}) => {
  await ready(page);
  await library(page);
  await page
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption({ label: "Nimble · Core Rules" });
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("Magic / Fire Spells");
  await page
    .getByRole("button", { name: "Create content", exact: true })
    .click();
  await page.getByLabel("New content title").fill("Silver key");
  await page
    .getByRole("combobox", { name: "New content type" })
    .selectOption("item");
  await page
    .getByLabel("New content Markdown")
    .fill("Opens the northern gate.");
  await page
    .getByRole("button", { name: "Create reference", exact: true })
    .click();
  const createdPreview = page.getByRole("dialog", {
    name: "Silver key",
    exact: true,
  });
  const parentLibrary = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await expect(createdPreview).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(createdPreview).toHaveCount(0);
  await expect(parentLibrary).toBeVisible();
  await expect(
    parentLibrary.getByRole("combobox", {
      name: "Content source",
      exact: true,
    }),
  ).toHaveValue("campaign");
  await expect(
    parentLibrary.getByRole("combobox", { name: "Category", exact: true }),
  ).toHaveValue("all");
  await expect(parentLibrary.locator(".library-row")).toHaveCount(1);
  await expect(parentLibrary.locator(".library-results")).toContainText(
    "Silver key",
  );
  await parentLibrary
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(parentLibrary).toHaveCount(0);
  await openWidgetPicker(page);
  await page.getByRole("button", { name: /^Notes Markdown notes/ }).click();
  const text = page.getByRole("textbox", { name: "Note text", exact: true });
  await text.fill("# Tonight\n\nFind @Silver");
  await expect(
    page.getByRole("listbox", { name: "Reference suggestions" }),
  ).toBeVisible();
  await text.press("Enter");
  await expect(text).toHaveValue(/slate:local/);
  await text.press("End");
  await text.press("Enter");
  await text.press("Enter");
  await text.pressSequentially("Check @Initiative");
  await text.press("Enter");
  await page.getByRole("button", { name: "Read note", exact: true }).click();
  await saved(page);
  await page.reload();
  const note = page.getByRole("region", { name: "Notes", exact: true });
  await library(page);
  const browse = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await browse
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption("campaign");
  await expect(browse.locator(".library-row")).toHaveCount(2);
  await expect(browse.locator(".library-results")).toContainText("Silver key");
  await expect(browse.locator(".library-results")).toContainText("Notes");
  await browse
    .getByRole("combobox", { name: "Content type", exact: true })
    .selectOption("note");
  await expect(browse.locator(".library-row")).toHaveCount(1);
  await browse
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("Campaign notes");
  await browse.getByLabel("Search content", { exact: true }).fill("Tonight");
  await expect(browse.locator(".library-results")).toContainText("Notes");
  await browse
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await note.getByRole("button", { name: "Silver key", exact: true }).click();
  const preview = page.getByRole("dialog", { name: "Silver key", exact: true });
  await preview
    .getByRole("button", { name: "Edit content", exact: true })
    .click();
  await page.getByLabel("Item name", { exact: true }).fill("Moon key");
  await page.getByRole("button", { name: "Save item", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    note.getByRole("button", { name: "Moon key", exact: true }),
  ).toBeVisible();
  await note.getByRole("button", { name: "Initiative", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Initiative", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await saved(page);
  await page.screenshot({
    path: "test-results/slate-m3-notes.png",
    fullPage: true,
  });
});
test("import preview validates packs, rejects conflicting versions and renders untrusted Markdown safely", async ({
  page,
}) => {
  await ready(page);
  await library(page);
  await page
    .getByRole("button", { name: "Content packs", exact: true })
    .click();
  const pack = {
    format: "slate-content",
    schemaVersion: 1,
    id: "table",
    version: "1",
    name: "Table rules",
    source: {
      url: "https://example.com",
      revision: "1",
      license: "Test content",
    },
    terms: [],
    assets: {},
    records: [
      {
        id: "rule/snacks",
        kind: "rule",
        title: "Snack rule",
        body: "# Snacks\n\n<script>window.hacked=true</script>\n\n[Bad](javascript:alert(1))\n\n![Tracking](https://example.com/pixel.png)\n\nBring snacks.",
        tags: ["table"],
        category: "House rules",
        sources: [],
        related: [],
        fields: {},
      },
    ],
  };
  const upload = async (value: unknown) =>
    page.getByLabel("Import content pack", { exact: true }).setInputFiles({
      name: "table.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(value)),
    });
  await upload(pack);
  await expect(
    page.getByRole("heading", { name: "Table rules" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Install content pack", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Install content pack", exact: true }),
  ).toHaveCount(0);
  await upload({ ...pack, name: "Changed same version" });
  await page
    .getByRole("button", { name: "Install content pack", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("different content");
  await page
    .getByRole("button", { name: "Cancel import", exact: true })
    .click();
  await page.getByRole("button", { name: "Browse", exact: true }).click();
  const sources = page.getByRole("combobox", {
    name: "Content source",
    exact: true,
  });
  await expect(sources.locator("option")).toHaveText([
    "All content",
    "Campaign content",
    "Nimble · Core Rules",
    "Nimble · GMG",
    "Nimble · Heroes",
    "Table rules",
  ]);
  await page.getByLabel("Search content", { exact: true }).fill("Snack rule");
  await page
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption("campaign");
  await expect(page.locator(".library-row")).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption({ label: "Nimble · Core Rules" });
  await expect(page.locator(".library-row")).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption({ label: "Table rules" });
  await expect(page.locator(".library-row")).toHaveCount(1);
  await page.getByRole("button", { name: /^Snack rule rule/ }).click();
  const preview = page.getByRole("dialog", { name: "Snack rule", exact: true });
  await expect(preview).toContainText("Bring snacks");
  await expect(preview.locator("script,img")).toHaveCount(0);
  await expect(preview.locator('a[href^="javascript:"]')).toHaveCount(0);
  expect(await page.evaluate(() => "hacked" in window)).toBe(false);
});

test("individual official book sources combine with type/category filters and persist offline", async ({
  page,
  context,
}) => {
  await ready(page);
  await expect(
    page.getByText("Ready for offline play", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await context.setOffline(true);
  await library(page);
  const dialog = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  const source = dialog.getByRole("combobox", {
    name: "Content source",
    exact: true,
  });
  const kind = dialog.getByRole("combobox", {
    name: "Content type",
    exact: true,
  });
  const category = dialog.getByRole("combobox", {
    name: "Category",
    exact: true,
  });
  await source.selectOption({ label: "Campaign content" });
  await expect(dialog.locator(".library-row")).toHaveCount(0);
  for (const [name, count, type, title] of [
    ["Nimble · Core Rules", 350, "spell", "Flame Dart"],
    ["Nimble · GMG", 144, "monster", "Goblin"],
    ["Nimble · Heroes", 50, "class", "Berserker"],
  ] as const) {
    await source.selectOption({ label: name });
    await expect(dialog.getByRole("status")).toContainText(`${count} results`);
    await kind.selectOption(type);
    await dialog.getByLabel("Search content", { exact: true }).fill(title);
    const entry = dialog.getByRole("button", {
      name: new RegExp(`^${title} ${type} `),
    });
    await expect(entry).toBeVisible();
    await entry.click();
    const preview = page.getByRole("dialog", { name: title, exact: true });
    await expect(preview).toBeVisible();
    await preview
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await expect(preview).toHaveCount(0);
    await expect(entry).toBeFocused();
    await dialog.getByLabel("Search content", { exact: true }).fill("");
    await expect(
      dialog.getByLabel("Search content", { exact: true }),
    ).toHaveValue("");
    await category.selectOption({ index: 1 });
    await source.selectOption("all");
    await expect(category).toHaveValue("all");
    await kind.selectOption("all");
  }
  await dialog
    .getByRole("button", { name: "Content packs", exact: true })
    .click();
  await expect(dialog.locator(".pack-row")).toHaveCount(3);
  const gmg = dialog.locator(".pack-row").filter({ hasText: "Nimble · GMG" });
  await gmg.getByRole("button", { name: "Disable pack", exact: true }).click();
  await expect(gmg).toContainText("Installed on this device");
  await saved(page);
  await page.reload();
  await library(page);
  await expect(source.locator("option")).toHaveText([
    "All content",
    "Campaign content",
    "Nimble · Core Rules",
    "Nimble · Heroes",
  ]);
  await kind.selectOption("monster");
  await expect(dialog.locator(".library-row")).toHaveCount(0);
  await dialog
    .getByRole("button", { name: "Content packs", exact: true })
    .click();
  await gmg.getByRole("button", { name: "Enable pack", exact: true }).click();
  await dialog.getByRole("button", { name: "Browse", exact: true }).click();
  await source.selectOption({ label: "Nimble · GMG" });
  await expect(dialog.getByRole("status")).toContainText("101 results");
});

test("campaign-only search hides pack aliases, includes campaign copies and stays isolated offline", async ({
  page,
  context,
}) => {
  await ready(page);
  await expect(
    page.getByText("Ready for offline play", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await context.setOffline(true);
  await library(page);
  const browse = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  const source = browse.getByRole("combobox", {
    name: "Content source",
    exact: true,
  });
  const search = browse.getByLabel("Search content", { exact: true });
  const category = browse.getByRole("combobox", {
    name: "Category",
    exact: true,
  });
  await search.fill("Blinded");
  await expect(
    browse.getByRole("button", { name: /^Blind rule/ }),
  ).toBeVisible();
  await source.selectOption("campaign");
  await expect(browse.locator(".library-row")).toHaveCount(0);
  await source.selectOption({ label: "Nimble · Core Rules" });
  await search.fill("Flame Dart");
  await category.selectOption("Magic / Fire Spells");
  await browse.getByRole("button", { name: /^Flame Dart spell/ }).click();
  await page
    .getByRole("button", { name: "Make campaign copy", exact: true })
    .click();
  const preview = page.getByRole("dialog", { name: "Flame Dart", exact: true });
  await expect(
    preview.getByRole("button", { name: "Edit content", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await source.selectOption("campaign");
  await expect(category).toHaveValue("all");
  await expect(browse.locator(".library-row")).toHaveCount(1);
  await expect(browse.locator(".library-results")).toContainText("Campaign");
  await browse
    .getByRole("combobox", { name: "Content type", exact: true })
    .selectOption("spell");
  await category.selectOption("Magic / Fire Spells");
  await expect(browse.locator(".library-row")).toHaveCount(1);
  await source.selectOption("all");
  await expect(browse.locator(".library-row")).toHaveCount(2);
  await saved(page);
  await page.reload();
  await library(page);
  await source.selectOption("campaign");
  await search.fill("Flame Dart");
  await expect(browse.locator(".library-row")).toHaveCount(1);
  await browse
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Switch campaign: My Campaign", exact: true })
    .click();
  await page.getByLabel("New campaign", { exact: true }).fill("Another table");
  await page
    .getByRole("button", { name: "Create campaign", exact: true })
    .click();
  await library(page);
  await source.selectOption("campaign");
  await expect(browse.locator(".library-row")).toHaveCount(0);
  await expect(
    browse.getByText("No matching content.", { exact: false }),
  ).toBeVisible();
});
test("mobile dark library previews fit the viewport and return keyboard focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.keyboard.press("Escape");
  await library(page);
  await page
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption("campaign");
  await expect(page.locator(".library-row")).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption("all");
  await page.getByLabel("Search content", { exact: true }).fill("Initiative");
  const row = page.getByRole("button", { name: /^Initiative rule/ });
  await row.click();
  await page.keyboard.press("Escape");
  await expect(row).toBeFocused();
  await row.click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "test-results/slate-m3-mobile.png",
    fullPage: true,
  });
});
