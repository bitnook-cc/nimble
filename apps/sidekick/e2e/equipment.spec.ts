import { expect, test } from "@playwright/test";

import { CharacterTestUtils } from "./utils/character-utils";

test("phone item browser filters, searches and adds an item", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const sheet = new CharacterTestUtils(page);
  await sheet.createCharacter();
  await sheet.navigateToTab("Equipment");
  await page.getByRole("button", { name: "Browse Items" }).click();
  const browser = page.getByRole("dialog", { name: "Item Repository" });
  const filters = browser.getByRole("button", { name: "Filters" });
  await expect(filters).toHaveAttribute("aria-expanded", "false");
  await filters.click();
  await browser.getByRole("combobox", { name: "Type", exact: true }).click();
  await page.getByRole("option", { name: "Weapons", exact: true }).click();
  await browser.getByRole("button", { name: "Filters (1)" }).click();
  await browser.getByRole("textbox", { name: "Search" }).fill("Battleaxe");
  const add = browser.getByRole("button", { name: "Add Battleaxe", exact: true });
  const rect = await add.boundingBox();
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(390);
  await add.click();
  await expect(browser.getByText("Added Battleaxe to inventory")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Battleaxe", { exact: true }).first()).toBeVisible();
});
