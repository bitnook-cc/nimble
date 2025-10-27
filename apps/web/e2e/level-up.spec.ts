import { expect, test } from "@playwright/test";

import { CharacterTestUtils } from "./utils/character-utils";

test.describe("Level Up", () => {
  let characterUtils: CharacterTestUtils;

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    characterUtils = new CharacterTestUtils(page);
  });

  test("level up character using level-up guide", async ({ page }) => {
    await test.step("Create a character", async () => {
      await characterUtils.createCharacter();
    });

    await test.step("Navigate to Character tab", async () => {
      const characterTab = page.getByRole("tab", { name: /^character$/i });
      if (await characterTab.isVisible().catch(() => false)) {
        await characterTab.click();
        await page.waitForTimeout(500);
      }
    });

    await test.step("Open Level Up Guide", async () => {
      // Find and click dropdown menus to locate Level Up option
      const allButtons = page.getByRole("button");
      let foundLevelUp = false;

      for (let i = 0; i < (await allButtons.count()); i++) {
        const button = allButtons.nth(i);
        const ariaExpanded = await button.getAttribute("aria-expanded");

        if (ariaExpanded !== null) {
          await button.click();
          await page.waitForTimeout(300);

          const levelUpOption = page.getByRole("menuitem", { name: /level up/i });
          if (await levelUpOption.isVisible({ timeout: 500 }).catch(() => false)) {
            await levelUpOption.click();
            await page.waitForTimeout(500);
            foundLevelUp = true;
            break;
          }

          await page.keyboard.press("Escape");
          await page.waitForTimeout(200);
        }
      }

      expect(foundLevelUp).toBe(true);
    });

    // Get the level-up wizard dialog
    const levelUpDialog = page.getByRole("dialog");
    await expect(levelUpDialog).toBeVisible();

    await test.step("Step 1: Choose levels to gain", async () => {
      // Verify level-up dialog opened
      const heading = levelUpDialog.getByRole("heading", { name: /level up your character/i });
      await expect(heading).toBeVisible();

      // Click Next (default is 1 level)
      const nextButton = levelUpDialog.getByRole("button", { name: /next/i }).last();
      await expect(nextButton).toBeVisible();
      await nextButton.click();
      await page.waitForTimeout(500);
    });

    await test.step("Step 2: Roll Hit Points", async () => {
      // Click Next to continue
      const nextButton = levelUpDialog.getByRole("button", { name: /next/i }).last();
      await expect(nextButton).toBeVisible();
      await nextButton.click();
      await page.waitForTimeout(500);
    });

    await test.step("Step 3: Allocate Skill Points", async () => {
      // Allocate a skill point if available
      const plusButtons = levelUpDialog.getByRole("button", { name: "+" });
      if ((await plusButtons.count()) > 0) {
        const firstPlus = plusButtons.first();
        if (await firstPlus.isEnabled().catch(() => false)) {
          await firstPlus.click();
          await page.waitForTimeout(200);
        }
      }

      // Click Next
      const nextButton = levelUpDialog.getByRole("button", { name: /next/i }).last();
      await expect(nextButton).toBeVisible();
      await nextButton.click();
      await page.waitForTimeout(500);
    });

    await test.step("Step 4: Complete level up", async () => {
      const completeButton = levelUpDialog.getByRole("button", { name: /complete/i });
      await expect(completeButton).toBeVisible();
      await completeButton.click();
    });

    await test.step("Verify level increased", async () => {
      // Look for level 2 indicator
      const level2Indicator = page.getByText(/level.*2/i);
      await expect(level2Indicator.first()).toBeVisible({ timeout: 3000 });
    });
  });
});
