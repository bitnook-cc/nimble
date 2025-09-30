import { test } from "@playwright/test";

import { CharacterTestUtils } from "./utils/character-utils";

test.describe("Health and Resources", () => {
  let characterUtils: CharacterTestUtils;

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    characterUtils = new CharacterTestUtils(page);
  });

  test("health and resources management", async ({ page }) => {
    await test.step("Setup character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Test health management", async () => {
      const damageButtons = page.getByRole("button", { name: /damage|\-1|\-5|\-10/i });
      const healButtons = page.getByRole("button", { name: /heal|\+1|\+5|\+10/i });

      if ((await damageButtons.count()) > 0) {
        await characterUtils.performHealthAction("damage", 1);
      }

      if ((await healButtons.count()) > 0) {
        await characterUtils.performHealthAction("heal", 1);
      }
    });

    await test.step("Test resource management", async () => {
      const resourceButtons = page.getByRole("button", { name: /mana|action|resource/i });

      if ((await resourceButtons.count()) > 0) {
        await resourceButtons.first().click();
      }
    });
  });
});
