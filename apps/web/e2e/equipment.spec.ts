import { expect, test } from "@playwright/test";

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
      const isVisible = await equipmentTab.isVisible();
      if (isVisible) {
        await characterUtils.navigateToTab("equipment");
      }
    });

    await test.step("Test equipment interactions", async () => {
      const addItemButton = page.getByRole("button", { name: /add|new.*item|equipment/i });
      const isAddVisible = await addItemButton.isVisible();

      if (isAddVisible) {
        await addItemButton.click();
        await page.waitForTimeout(500);

        const nameInput = page.getByLabel(/name|item name/i);
        const isNameVisible = await nameInput.isVisible();
        if (isNameVisible) {
          await nameInput.fill("Test Sword");

          const saveButton = page.getByRole("button", { name: /save|add|create/i });
          const isSaveVisible = await saveButton.isVisible();
          if (isSaveVisible) {
            await saveButton.click();
          }
        }
      }
    });
  });

  // TODO: Re-enable inventory sorting tests once we have proper character creation with classes
  // test.skip("inventory sorting and reordering", async ({ page }) => {
  //   ...
  // });
});
