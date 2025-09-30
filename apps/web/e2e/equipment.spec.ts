import { test } from "@playwright/test";

import { CharacterTestUtils } from "./utils/character-utils";

test.describe("Equipment and Inventory", () => {
  let characterUtils: CharacterTestUtils;

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    characterUtils = new CharacterTestUtils(page);
  });

  test("equipment and inventory management", async ({ page }) => {
    await test.step("Setup character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Access equipment tab", async () => {
      const equipmentTab = page.getByRole("tab", { name: /equipment|inventory/i });
      if (await equipmentTab.isVisible()) {
        await characterUtils.navigateToTab("equipment");
      }
    });

    await test.step("Test equipment interactions", async () => {
      const addItemButton = page.getByRole("button", { name: /add|new.*item|equipment/i });

      if (await addItemButton.isVisible()) {
        await addItemButton.click();
        await page.waitForTimeout(500);

        const nameInput = page.getByLabel(/name|item name/i);
        if (await nameInput.isVisible()) {
          await nameInput.fill("Test Sword");

          const saveButton = page.getByRole("button", { name: /save|add|create/i });
          if (await saveButton.isVisible()) {
            await saveButton.click();
          }
        }
      }
    });
  });
});
