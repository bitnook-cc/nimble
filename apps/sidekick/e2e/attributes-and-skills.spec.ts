import { expect, test } from "@playwright/test";

import { CharacterTestUtils } from "./utils/character-utils";

test.describe("Attributes and Skills", () => {
  let characterUtils: CharacterTestUtils;

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    characterUtils = new CharacterTestUtils(page);
  });

  test("character attribute and skill interactions", async ({ page }) => {
    await test.step("Setup character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Test attribute rolls", async () => {
      await page.getByRole("button", { name: "Explore", exact: true }).click();
      await page.getByRole("button", { name: "Roll strength check", exact: true }).click();
    });

    await test.step("Test skill checks", async () => {
      await page.getByRole("button", { name: "Roll Arcana check", exact: true }).click();
      await page.getByRole("button", { name: "Log", exact: true }).click();
      const log = page
        .locator('[data-slot="card"]')
        .filter({ has: page.getByText("Character Log", { exact: true }) });
      await expect(log.getByText(/^strength check$/i)).toBeVisible();
      await expect(log.getByText(/^arcana skill check$/i)).toBeVisible();
    });
  });
});
