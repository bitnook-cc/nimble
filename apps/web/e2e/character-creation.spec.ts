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

  test("create character using full character builder", async ({ page }) => {
    await test.step("Open character creation menu", async () => {
      const createButton = page.getByRole("button", { name: /create new character/i });
      await expect(createButton).toBeVisible();
      await createButton.click();
      await page.waitForTimeout(500);
    });

    await test.step("Open Character Builder", async () => {
      const builderButton = page.getByRole("button", { name: /character builder/i });
      await expect(builderButton).toBeVisible();
      await builderButton.click();
      await page.waitForTimeout(500);
    });

    // Get the wizard dialog to scope all subsequent selectors
    const wizardDialog = page.getByRole("dialog");
    await expect(wizardDialog).toBeVisible();

    await test.step("Step 1: Select Class", async () => {
      // Verify we're on the class selection step
      const classHeading = wizardDialog.getByRole("heading", { name: /choose your class/i });
      await expect(classHeading).toBeVisible();

      // Click berserker class card
      const berserkerCard = wizardDialog.getByText(/berserker/i).first();
      await expect(berserkerCard).toBeVisible();
      await berserkerCard.click();
      await page.waitForTimeout(300);

      // Click Next button
      const nextButton = wizardDialog.getByRole("button", { name: /next.*ancestry/i });
      await expect(nextButton).toBeVisible();
      await expect(nextButton).toBeEnabled();
      await nextButton.click();
      await page.waitForTimeout(500);
    });

    await test.step("Step 2: Select Ancestry and Name", async () => {
      // Wait for Next: Background button to confirm step loaded
      const nextButton = wizardDialog.getByRole("button", { name: /next.*background/i });
      await expect(nextButton).toBeVisible();

      // Fill in character name
      const nameInput = wizardDialog.getByPlaceholder(/enter character name/i);
      await expect(nameInput).toBeVisible();
      await nameInput.fill("E2E Test Hero");
      await page.waitForTimeout(200);

      // Click first ancestry card
      const ancestryCard = wizardDialog.getByText(/human/i).first();
      await expect(ancestryCard).toBeVisible();
      await ancestryCard.click();
      await page.waitForTimeout(300);

      // Click Next
      await expect(nextButton).toBeEnabled();
      await nextButton.click();
      await page.waitForTimeout(500);
    });

    await test.step("Step 3: Select Background", async () => {
      // Wait for Next button
      const nextButton = wizardDialog.getByRole("button", { name: /next.*feature/i });
      await expect(nextButton).toBeVisible();

      // Click first background card
      const backgroundCard = wizardDialog.getByText(/acrobat/i).first();
      await expect(backgroundCard).toBeVisible();
      await backgroundCard.click();
      await page.waitForTimeout(300);

      // Click Next
      await expect(nextButton).toBeEnabled();
      await nextButton.click();
      await page.waitForTimeout(500);
    });

    await test.step("Step 4: Review Features", async () => {
      // Wait for Next: Attributes button
      const nextButton = wizardDialog.getByRole("button", { name: /next.*attribute/i });
      await expect(nextButton).toBeVisible();

      // Check that features are listed
      const featureList = wizardDialog.getByText(/rage/i).first();
      await expect(featureList).toBeVisible();

      await nextButton.click();
      await page.waitForTimeout(500);
    });

    await test.step("Step 5: Allocate Attributes", async () => {
      // Wait for Next: Skills button
      const nextButton = wizardDialog.getByRole("button", { name: /next.*skill/i });
      await expect(nextButton).toBeVisible();

      // Allocate some attribute points
      const applyArrayButton = wizardDialog.getByRole("button", { name: /apply.*array/i });
      await expect(applyArrayButton).toBeVisible();
      await applyArrayButton.click();

      await nextButton.click();
      await page.waitForTimeout(500);
    });

    await test.step("Step 6: Allocate Skills", async () => {
      // Wait for Next: Equipment button
      const nextButton = wizardDialog.getByRole("button", { name: /next.*equipment/i });
      await expect(nextButton).toBeVisible();

      // Make sure skills are visible
      const skillList = wizardDialog.getByText(/arcana/i);
      await expect(skillList).toBeVisible();

      // Allocate some skill points
      const plusButtons = wizardDialog.getByRole("button", { name: "+" });
      const count = await plusButtons.count();

      for (let i = 0; i < Math.min(count, 3); i++) {
        const button = plusButtons.nth(i);
        if (await button.isEnabled().catch(() => false)) {
          await button.click();
          await page.waitForTimeout(50);
        }
      }

      await nextButton.click();
      await page.waitForTimeout(500);
    });

    await test.step("Step 7: Select Equipment", async () => {
      // Make sure equipment is visible
      const equipmentList = wizardDialog.getByText(/battleaxe/i);
      await expect(equipmentList).toBeVisible();

      // Wait for Finish button
      const finishButton = wizardDialog.getByRole("button", { name: /finish character/i });
      await expect(finishButton).toBeVisible();

      await expect(finishButton).toBeEnabled();
      await finishButton.click();
      await page.waitForTimeout(2000);
    });

    await test.step("Verify character was created", async () => {
      // Character sheet should be visible
      const characterSheet = page.locator('input[value="E2E Test Hero"]');
      await expect(characterSheet).toBeVisible({ timeout: 5000 });
    });
  });
});
