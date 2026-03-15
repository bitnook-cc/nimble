import { expect, test } from "@playwright/test";

import { CharacterTestUtils } from "./utils/character-utils";

test.describe("Character Sheet Navigation", () => {
  let characterUtils: CharacterTestUtils;

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    characterUtils = new CharacterTestUtils(page);
  });

  test("navigate between character sheet tabs", async ({ page }) => {
    await test.step("Ensure character exists", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Navigate through character sheet tabs", async () => {
      const tabs = ["Combat", "Skills", "Character", "Equipment"];

      for (const tabName of tabs) {
        const tab = page.getByRole("tab", { name: new RegExp(tabName, "i") });
        if (await tab.isVisible()) {
          await characterUtils.navigateToTab(tabName);
          await expect(page.getByRole("tabpanel")).toBeVisible();
        }
      }
    });
  });
});
