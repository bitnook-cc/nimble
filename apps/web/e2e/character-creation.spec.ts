import { expect, test } from "@playwright/test";

import { CharacterTestUtils } from "./utils/character-utils";

test.describe("Character Creation and Basic Actions", () => {
  let characterUtils: CharacterTestUtils;

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    characterUtils = new CharacterTestUtils(page);
  });

  test("quick create character, roll initiative, and use actions", async ({ page }) => {
    await test.step("Create a character using quick create", async () => {
      await characterUtils.createCharacter();
    });

    await test.step("Roll initiative", async () => {
      await characterUtils.rollInitiative();
    });

    await test.step("Use character actions", async () => {
      await characterUtils.performDiceRoll();
    });
  });
});
