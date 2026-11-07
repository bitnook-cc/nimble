import { expect, test } from "@playwright/test";

import { CharacterTestUtils } from "./utils/character-utils";

test("phone navigation reaches every section and wounds adjust one at a time", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const sheet = new CharacterTestUtils(page);
  await sheet.createCharacter();
  const nav = page.getByRole("navigation", { name: "Character sheet" });
  expect(await nav.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  for (const label of ["Explore", "Equipment", "Character", "Notes", "Log", "Combat"]) {
    await sheet.navigateToTab(label);
  }
  const add = page.getByRole("button", { name: "Add wound" });
  const remove = page.getByRole("button", { name: "Remove wound" });
  expect((await add.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(
    (await page.getByRole("button", { name: "Damage", exact: true }).boundingBox())!.height,
  ).toBeGreaterThanOrEqual(44);
  await expect(remove).toBeDisabled();
  await add.click();
  await add.click();
  await remove.click();
  await expect(remove).toBeEnabled();
  await remove.click();
  await expect(remove).toBeDisabled();
});
