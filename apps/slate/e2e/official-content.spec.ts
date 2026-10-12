import { expect, test, type Page } from "@playwright/test";
import {
  ready,
  saved,
  library,
  appearance,
  openWidgetPicker,
} from "./ui-fixtures";

test.use({
  viewport: { width: 1280, height: 900 },
  locale: "en-GB",
  timezoneId: "UTC",
  colorScheme: "light",
  reducedMotion: "reduce",
});
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-11T12:00:00Z"));
  await page.goto("/");
  await ready(page);
});
async function preview(page: Page, title: string, kind: string) {
  const browse = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await browse
    .getByRole("combobox", { name: "Content type", exact: true })
    .selectOption(kind);
  await browse.getByLabel("Search content", { exact: true }).fill(title);
  await browse
    .getByRole("button", {
      name: new RegExp(
        `^${title} ${kind === "table" ? "Reference table" : kind} ·`,
      ),
    })
    .click();
  return page.getByRole("dialog", { name: title, exact: true });
}

test("the complete official catalog is searchable offline, with full progression and nested references", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.reload();
  await ready(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  const browse = await library(page, "");
  await expect(browse.getByRole("status")).toHaveText(
    "544 results · available offline",
  );
  for (const [kind, count] of Object.entries({
    class: 12,
    subclass: 28,
    ancestry: 27,
    background: 31,
    table: 3,
    item: 89,
    spell: 99,
    monster: 101,
  })) {
    await browse
      .getByRole("combobox", { name: "Content type", exact: true })
      .selectOption(kind);
    await expect(browse.getByRole("status")).toHaveText(
      `${count} results · available offline`,
    );
  }
  let view = await preview(page, "Berserker", "class");
  await expect(view).toContainText("Level 20");
  await expect(view).toContainText("BOUNDLESS RAGE");
  await expect(view).toContainText("Death Blow");
  await expect(view).toContainText("Nimble Heroes Book");
  await expect(view).toHaveScreenshot("berserker-light.png");
  await page.keyboard.press("Escape");
  view = await preview(page, "Mountainheart", "subclass");
  await expect(view).toContainText("Titan's Fury");
  await expect(view).toContainText("Mountain's Endurance");
  await view
    .getByRole("button", { name: "Berserker", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "Berserker", exact: true }),
  ).toContainText("BOUNDLESS RAGE");
  await page.keyboard.press("Escape");
  for (const [title, kind, text] of [
    ["Human", "ancestry", "Tenacious"],
    ["Back Out of Retirement", "background", "–1 max Wounds"],
    ["Omenrime", "spell", "Ice Spells"],
    ["Hexbinder", "class", "Mystic Marks"],
    ["Heart Piercer", "item", "Nimble GMG"],
    ["Dagger", "item", "1d4+DEX piercing"],
    ["Lizardfolk", "ancestry", "Nimble Core Rules"],
    ["Arcane Apprentice", "background", "Nimble Core Rules"],
    ["Banshee", "monster", "Nimble Supplementary Content"],
    ["Heytet-Seqat, Scorpion Queen", "monster", "64/hero"],
  ]) {
    view = await preview(page, title, kind);
    await expect(view).toContainText(text);
    await page.keyboard.press("Escape");
  }
  await browse
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await appearance(page, "Dark");
  await library(page, "");
  view = await preview(page, "Armor & Defense", "table");
  await expect(view.getByRole("table")).toHaveCount(5);
  await expect(view).toContainText("Core Rules 3.0");
  await expect(view).toContainText("Dragon Shield");
  await expect(view).toHaveScreenshot("equipment-dark.png");
  expect(errors).toEqual([]);
});

test("new character references can be mentioned in notes and pinned across offline reload", async ({
  page,
  context,
}) => {
  await openWidgetPicker(page);
  await page.getByRole("button", { name: /^Notes Markdown notes/ }).click();
  const input = page.getByRole("textbox", { name: "Note text", exact: true });
  await input.fill("Meet @Hexbinder");
  const suggestions = page.getByRole("listbox", {
    name: "Reference suggestions",
  });
  await expect(suggestions).toBeVisible();
  await suggestions.getByRole("option", { name: /^Hexbinder class/ }).click();
  await page.getByRole("button", { name: "Read note", exact: true }).click();
  await page
    .getByRole("region", { name: "Notes", exact: true })
    .getByRole("button", { name: "Hexbinder", exact: true })
    .click();
  const view = page.getByRole("dialog", { name: "Hexbinder", exact: true });
  await expect(view).toContainText("Sage of Banes");
  await view
    .getByRole("button", { name: "Pin to screen", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await saved(page);
  await page.reload();
  await ready(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await expect(
    page.getByRole("region", { name: "Hexbinder", exact: true }),
  ).toContainText("Sage of Banes");
  await page
    .getByRole("region", { name: "Notes", exact: true })
    .getByRole("button", { name: "Hexbinder", exact: true })
    .click();
  await expect(view).toContainText("Mystic Marks");
});

test("bundled items fit mobile dark previews and can be copied and edited offline", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await appearance(page, "Dark");
  await page.reload();
  await ready(page);
  await context.setOffline(true);
  await library(page, "");
  const view = await preview(page, "Dagger", "item");
  await expect(view).toContainText("3 gp");
  await expect(view).toContainText("Light, Thrown 4");
  await expect(view).toHaveScreenshot("dagger-mobile-dark.png");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await view
    .getByRole("button", { name: "Make campaign copy", exact: true })
    .click();
  await view.getByRole("button", { name: "Edit content", exact: true }).click();
  await page.getByLabel("Item name", { exact: true }).fill("My silver dagger");
  await page.getByRole("button", { name: "Save item", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await saved(page);
  await page.reload();
  await ready(page);
  await library(page, "My silver dagger");
  await expect(
    page.getByRole("button", { name: /^My silver dagger item/ }),
  ).toBeVisible();
});
