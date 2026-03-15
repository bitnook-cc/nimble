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
      const attributeRolls = page.getByRole("button", {
        name: /strength|dexterity|intelligence|will/i,
      });

      if ((await attributeRolls.count()) > 0) {
        await attributeRolls.first().click();
        await expect(page.getByText(/rolled|d20|result/i)).toBeVisible();
      }
    });

    await test.step("Test skill checks", async () => {
      const skillsTab = page.getByRole("tab", { name: /skills/i });
      if (await skillsTab.isVisible()) {
        await characterUtils.navigateToTab("skills");
      }

      await characterUtils.performDiceRoll();
    });
  });
});
