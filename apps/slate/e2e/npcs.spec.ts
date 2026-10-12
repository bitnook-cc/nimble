import { openWidgetPicker } from "./ui-fixtures";
import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  appearance,
  expectAria,
  neutralDashboard,
  ready,
  saved,
} from "./ui-fixtures";

test.use({
  viewport: { width: 1280, height: 900 },
  locale: "en-GB",
  timezoneId: "UTC",
  colorScheme: "light",
  reducedMotion: "reduce",
  deviceScaleFactor: 1,
});
const errors = new WeakMap<object, string[]>();
test.beforeEach(async ({ page }) => {
  const caught: string[] = [];
  errors.set(page, caught);
  page.on("pageerror", (error) => caught.push(error.message));
  await page.clock.setFixedTime(new Date("2026-10-11T12:00:00Z"));
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await page.goto("/");
  await ready(page);
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page), "NPC UI must not throw browser errors").toEqual([]);
});
async function addNpc(page: Page, blank = false) {
  if (blank) {
    await page
      .getByRole("button", { name: "Manage screens", exact: true })
      .click();
    await page.getByLabel("New screen name", { exact: true }).fill("People");
    await page
      .getByRole("combobox", { name: "Layout preset", exact: true })
      .selectOption("blank");
    await page
      .getByRole("button", { name: "Create screen", exact: true })
      .click();
  }
  await openWidgetPicker(page);
  await page.getByLabel("Search widgets").fill("npc");
  await page.getByRole("button", { name: "New tools", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Add a widget" })
    .getByRole("button", { name: /^NPC generator Create names/ })
    .click();
  return page.getByRole("region", { name: "NPC generator", exact: true });
}
test("NPC names and individual traits reroll, save, copy and become campaign notes", async ({
  page,
  context,
}) => {
  const widget = await addNpc(page);
  await widget.getByLabel("Name style").selectOption("elf");
  await widget.getByLabel("Name pool").selectOption("female");
  await widget
    .getByRole("button", { name: "Generate NPC", exact: true })
    .click();
  const result = widget.getByRole("region", {
    name: "Generated NPC",
    exact: true,
  });
  const name = (await result.getByRole("heading").textContent())!;
  const attributes = await result.locator("dd > span").allTextContents();
  expect(attributes).toHaveLength(4);
  await widget.getByRole("button", { name: "Save NPC", exact: true }).click();
  await expect(
    widget.getByRole("button", { name: "Saved NPC", exact: true }),
  ).toBeDisabled();
  await page.evaluate(() => {
    Math.random = () => 0.99;
  });
  await widget
    .getByRole("button", { name: "Reroll scar or mark", exact: true })
    .click();
  const changed = await result.locator("dd > span").allTextContents();
  expect(changed[1]).not.toBe(attributes[1]);
  for (const i of [0, 2, 3]) expect(changed[i]).toBe(attributes[i]);
  await expect(result.getByRole("heading")).toHaveText(name);
  await widget.getByRole("button", { name: "Save NPC", exact: true }).click();
  await widget.getByRole("button", { name: "Generate 5", exact: true }).click();
  await expect(
    widget.locator("summary", { hasText: "Recent NPCs (6)" }),
  ).toBeVisible();
  await widget.locator("summary", { hasText: "Saved NPCs (1)" }).click();
  await widget
    .getByRole("button", { name: `View saved NPC ${name}`, exact: true })
    .click();
  expect(await result.locator("dd > span").allTextContents()).toEqual(changed);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await widget.getByRole("button", { name: "Copy NPC", exact: true }).click();
  await expect(widget.getByRole("status")).toHaveText("NPC copied.");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain(name);
  expect(copied).toContain(changed[1]);
  await widget
    .getByRole("button", { name: "Save as note", exact: true })
    .click();
  await saved(page);
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  await page.getByLabel("Search content", { exact: true }).fill(name);
  await page
    .getByRole("combobox", { name: "Content type", exact: true })
    .selectOption("note");
  await page.locator(".library-title", { hasText: name }).click();
  const preview = page.getByRole("dialog", { name, exact: true });
  await expect(preview).toContainText(changed[1]);
  await expect(preview).toContainText(changed[3]);
});

test("NPC widgets share campaign tools, reroll names independently and retain settings offline", async ({
  page,
  context,
}) => {
  const widget = await addNpc(page, true);
  await widget.getByLabel("Name style").selectOption("dwarf");
  await widget
    .getByRole("button", { name: "Generate NPC", exact: true })
    .click();
  const original = await widget.locator("dd > span").allTextContents();
  const oldName = await widget.locator(".npc-name-row h3").textContent();
  await page.evaluate(() => {
    Math.random = () => 0.99;
  });
  await widget
    .getByRole("button", { name: "Reroll name", exact: true })
    .click();
  await expect(widget.locator(".npc-name-row h3")).not.toHaveText(oldName!);
  expect(await widget.locator("dd > span").allTextContents()).toEqual(original);
  await widget.getByRole("button", { name: "Save NPC", exact: true }).click();
  const name = (await widget.locator(".npc-name-row h3").textContent())!;
  await page
    .getByRole("button", { name: "Expand NPC generator", exact: true })
    .click();
  const expanded = page.getByRole("dialog", {
    name: "NPC generator",
    exact: true,
  });
  await expanded
    .getByRole("button", { name: "Reroll quirk", exact: true })
    .click();
  const quirk = await expanded.locator("dd > span").last().textContent();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(widget.locator("dd > span").last()).toHaveText(quirk!);
  await page
    .getByRole("button", { name: "Manage screens", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Duplicate screen", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(widget.locator(".npc-name-row h3")).toHaveText(name);
  await saved(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await expect(widget.getByLabel("Name style")).toHaveValue("dwarf");
  await expect(widget.locator(".npc-name-row h3")).toHaveText(name);
  await expect(widget.locator("dd > span").last()).toHaveText(quirk!);
  await expect(
    widget.locator("summary", { hasText: "Saved NPCs (1)" }),
  ).toBeVisible();
  await widget
    .getByRole("button", { name: "Generate NPC", exact: true })
    .click();
  await expect(
    widget.locator("summary", { hasText: "Recent NPCs (2)" }),
  ).toBeVisible();
  await saved(page);
});

test("NPC campaign backups restore favourites and attributes into a fresh offline installation", async ({
  page,
  browser,
}) => {
  const widget = await addNpc(page);
  await widget.getByLabel("Name style").selectOption("gnome");
  await widget
    .getByRole("button", { name: "Generate NPC", exact: true })
    .click();
  await widget.getByRole("button", { name: "Save NPC", exact: true }).click();
  const name = (await widget.locator(".npc-name-row h3").textContent())!;
  const attributes = await widget.locator("dd > span").allTextContents();
  await saved(page);
  await page
    .getByRole("button", { name: "Switch campaign: My Campaign", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export My Campaign", exact: true })
    .click();
  const download = await downloadPromise;
  const file = await download.path();
  expect(file).not.toBeNull();
  const bytes = await readFile(file!);
  const fresh = await browser.newContext({ baseURL: "http://127.0.0.1:3010" });
  try {
    const restored = await fresh.newPage();
    await restored.goto("/");
    await ready(restored);
    await fresh.setOffline(true);
    await restored
      .getByRole("button", {
        name: "Switch campaign: My Campaign",
        exact: true,
      })
      .click();
    await restored
      .getByRole("button", { name: "Backup & recovery", exact: true })
      .click();
    await restored.getByLabel("Backup file", { exact: true }).setInputFiles({
      name: "people.zip",
      mimeType: "application/zip",
      buffer: bytes,
    });
    await restored
      .getByRole("button", { name: "Restore backup", exact: true })
      .click();
    await expect(
      restored.getByText("Campaign restored and ready to use.", {
        exact: true,
      }),
    ).toBeVisible();
    await restored
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await saved(restored);
    await restored.reload();
    await ready(restored);
    const result = restored.getByRole("region", {
      name: "NPC generator",
      exact: true,
    });
    await expect(result.locator(".npc-name-row h3")).toHaveText(name);
    expect(await result.locator("dd > span").allTextContents()).toEqual(
      attributes,
    );
    await expect(
      result.locator("summary", { hasText: "Saved NPCs (1)" }),
    ).toBeVisible();
    await result
      .getByRole("button", { name: "Generate NPC", exact: true })
      .click();
    await expect(
      result.locator("summary", { hasText: "Recent NPCs (2)" }),
    ).toBeVisible();
  } finally {
    await fresh.close();
  }
});

for (const mode of ["Light", "Dark"] as const) {
  test(`NPC generator has a compact ${mode.toLowerCase()} layout with accessible reroll controls`, async ({
    page,
  }) => {
    const widget = await addNpc(page, true);
    await appearance(page, mode);
    await widget.getByLabel("Name style").selectOption("human");
    await widget
      .getByRole("button", { name: "Generate NPC", exact: true })
      .click();
    await neutralDashboard(page);
    await expectAria(widget, `npc-${mode.toLowerCase()}.aria.yml`);
    await expect(widget).toHaveScreenshot(`npc-${mode.toLowerCase()}.png`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole("button", { name: "Expand NPC generator", exact: true })
      .click();
    const expanded = page.getByRole("dialog", {
      name: "NPC generator",
      exact: true,
    });
    await expect(
      expanded.getByRole("button", {
        name: "Reroll scar or mark",
        exact: true,
      }),
    ).toBeVisible();
    await page.mouse.move(0, 0);
    await saved(page);
    await expect(page).toHaveScreenshot(`npc-mobile-${mode.toLowerCase()}.png`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Expand NPC generator", exact: true }),
    ).toBeFocused();
  });
}
