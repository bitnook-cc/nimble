import { expect, test } from "@playwright/test";

import { CharacterTestUtils } from "./utils/character-utils";

test.describe("Character Sheet User Interactions", () => {
  let characterUtils: CharacterTestUtils;

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");

    // Initialize character utilities
    characterUtils = new CharacterTestUtils(page);
  });

  test("quick create character, roll initiative, and use actions", async ({ page }) => {
    // Step 1: Create a character using quick create
    await test.step("Create a character using quick create", async () => {
      await characterUtils.createCharacter();
    });

    // Step 2: Roll initiative
    await test.step("Roll initiative", async () => {
      await characterUtils.rollInitiative();
    });

    // Step 3: Use character actions
    await test.step("Use character actions", async () => {
      await characterUtils.performDiceRoll();
    });
  });

  test("navigate between character sheet tabs", async ({ page }) => {
    // Ensure we have a character loaded first
    await test.step("Ensure character exists", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Navigate through character sheet tabs", async () => {
      // Look for tab navigation (Combat, Skills, Character, Equipment, etc.)
      const tabs = ["Combat", "Skills", "Character", "Equipment"];

      for (const tabName of tabs) {
        const tab = page.getByRole("tab", { name: new RegExp(tabName, "i") });
        if (await tab.isVisible()) {
          await characterUtils.navigateToTab(tabName);

          // Verify tab content is visible
          await expect(page.getByRole("tabpanel")).toBeVisible();
        }
      }
    });
  });

  test("character attribute and skill interactions", async ({ page }) => {
    // Ensure character exists
    await test.step("Setup character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Test attribute rolls", async () => {
      // Look for attribute sections (Strength, Dexterity, etc.)
      const attributeRolls = page.getByRole("button", {
        name: /strength|dexterity|intelligence|will/i,
      });

      if ((await attributeRolls.count()) > 0) {
        await attributeRolls.first().click();

        // Check for dice result in activity log or result display
        await expect(page.getByText(/rolled|d20|result/i)).toBeVisible();
      }
    });

    await test.step("Test skill checks", async () => {
      // Navigate to skills tab if needed
      const skillsTab = page.getByRole("tab", { name: /skills/i });
      if (await skillsTab.isVisible()) {
        await characterUtils.navigateToTab("skills");
      }

      // Perform a skill roll
      await characterUtils.performDiceRoll();
    });
  });

  test("equipment and inventory management", async ({ page }) => {
    // Setup character
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
      // Look for add item or manage equipment buttons
      const addItemButton = page.getByRole("button", { name: /add|new.*item|equipment/i });

      if (await addItemButton.isVisible()) {
        await addItemButton.click();

        // Fill out item form if a dialog appears
        await page.waitForTimeout(500);

        // Look for name input field
        const nameInput = page.getByLabel(/name|item name/i);
        if (await nameInput.isVisible()) {
          await nameInput.fill("Test Sword");

          // Look for save/add button
          const saveButton = page.getByRole("button", { name: /save|add|create/i });
          if (await saveButton.isVisible()) {
            await saveButton.click();
          }
        }
      }
    });
  });

  test("health and resources management", async ({ page }) => {
    // Setup character
    await test.step("Setup character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Test health management", async () => {
      // Look for damage/heal buttons
      const damageButtons = page.getByRole("button", { name: /damage|\-1|\-5|\-10/i });
      const healButtons = page.getByRole("button", { name: /heal|\+1|\+5|\+10/i });

      if ((await damageButtons.count()) > 0) {
        // Test taking damage
        await characterUtils.performHealthAction("damage", 1);
      }

      if ((await healButtons.count()) > 0) {
        // Test healing
        await characterUtils.performHealthAction("heal", 1);
      }
    });

    await test.step("Test resource management", async () => {
      // Look for resource tracking (mana, action points, etc.)
      const resourceButtons = page.getByRole("button", { name: /mana|action|resource/i });

      if ((await resourceButtons.count()) > 0) {
        await resourceButtons.first().click();
      }
    });
  });
});
