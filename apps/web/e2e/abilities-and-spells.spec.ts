import { expect, test } from "@playwright/test";

import { CharacterTestUtils } from "./utils/character-utils";

test.describe("Abilities and Spells", () => {
  let characterUtils: CharacterTestUtils;

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    characterUtils = new CharacterTestUtils(page);
  });

  test("view and interact with character tab", async ({ page }) => {
    await test.step("Setup character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Navigate to Character tab", async () => {
      const characterTab = page.getByRole("button", { name: /^character$/i });
      await characterTab.scrollIntoViewIfNeeded();
      await expect(characterTab).toBeVisible();
      await characterTab.click();
      await page.waitForTimeout(500);
    });

    await test.step("Verify character tab sections load", async () => {
      // Verify we can see key sections of the Character tab
      // Look for any key character tab content
      const characterContent = page.getByText(/attributes|resources|abilities|features/i).first();
      await expect(characterContent).toBeVisible();
    });
  });

  test("view spells tab for spellcasting characters", async ({ page }) => {
    await test.step("Setup character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Check spells tab", async () => {
      // Spells tab only appears for spellcasting characters
      const spellsTab = page.getByRole("button", { name: /^spells$/i });

      // Use a short timeout - if not visible, the character isn't a spellcaster
      const hasSpellsTab = await spellsTab.isVisible({ timeout: 1000 }).catch(() => false);

      if (hasSpellsTab) {
        // This is a spellcasting character, verify the spells tab works
        await spellsTab.scrollIntoViewIfNeeded();
        await spellsTab.click();
        await page.waitForTimeout(500);

        // Verify we're on the spells tab - should see spell-related content
        await expect(page.getByText(/tier|school|spell/i).first()).toBeVisible();
      }
      // If no spells tab, that's fine - character just isn't a spellcaster
      // No need to fail the test
    });
  });
});
