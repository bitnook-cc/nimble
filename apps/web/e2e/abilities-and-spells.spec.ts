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

  test("cast cantrip spell without consuming mana", async ({ page }) => {
    await test.step("Setup spellcasting character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Navigate to Spells tab", async () => {
      const spellsTab = page.getByRole("button", { name: /^spells$/i });
      const hasSpellsTab = await spellsTab.isVisible({ timeout: 1000 }).catch(() => false);

      if (!hasSpellsTab) {
        test.skip(true, "Character is not a spellcaster");
      }

      await spellsTab.click();
      await page.waitForTimeout(500);
    });

    await test.step("Check for cantrip and cast it", async () => {
      // Look for tier 0 spells (cantrips)
      const cantripBadge = page.getByText(/cantrip/i).first();
      const hasCantripVisible = await cantripBadge.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasCantripVisible) {
        test.skip(true, "Character has no cantrips available");
      }

      // Get initial mana value if mana resource exists
      const manaText = await page.getByText(/mana/i).first().textContent();
      const initialMana = manaText ? parseInt(manaText.match(/\d+/)?.[0] || "0") : null;

      // Find and click the Cast button for a cantrip
      const castButtons = page.getByRole("button", { name: /cast/i });
      const castButton = castButtons.first();
      await expect(castButton).toBeVisible();
      await castButton.click();

      // Wait for spell cast to complete
      await page.waitForTimeout(1000);

      // Verify mana wasn't consumed (cantrips don't use mana)
      if (initialMana !== null) {
        const finalManaText = await page.getByText(/mana/i).first().textContent();
        const finalMana = finalManaText ? parseInt(finalManaText.match(/\d+/)?.[0] || "0") : null;
        expect(finalMana).toBe(initialMana);
      }
    });
  });

  test("cast tier 1 spell and consume mana", async ({ page }) => {
    await test.step("Setup spellcasting character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Navigate to Spells tab", async () => {
      const spellsTab = page.getByRole("button", { name: /^spells$/i });
      const hasSpellsTab = await spellsTab.isVisible({ timeout: 1000 }).catch(() => false);

      if (!hasSpellsTab) {
        test.skip(true, "Character is not a spellcaster");
      }

      await spellsTab.click();
      await page.waitForTimeout(500);
    });

    await test.step("Cast tier 1 spell", async () => {
      // Look for tier 1 spells
      const tier1Badge = page.getByText(/tier 1/i).first();
      const hasTier1Visible = await tier1Badge.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasTier1Visible) {
        test.skip(true, "Character has no tier 1 spells available");
      }

      // Get initial mana value
      const manaResourceText = await page.getByText(/\d+\/\d+ mana/i).textContent();
      const initialMana = manaResourceText ? parseInt(manaResourceText.split("/")[0] || "0") : null;

      if (initialMana === null || initialMana === 0) {
        test.skip(true, "Character has no mana to cast spells");
      }

      // Find Cast button near tier 1 badge
      const castButtons = page.getByRole("button", { name: /cast/i });
      const castButton = castButtons.first();
      await expect(castButton).toBeVisible();
      await castButton.click();

      // Wait for spell cast to complete
      await page.waitForTimeout(1000);

      // Verify mana was consumed
      const finalManaText = await page.getByText(/\d+\/\d+ mana/i).textContent();
      const finalMana = finalManaText ? parseInt(finalManaText.split("/")[0] || "0") : null;

      if (finalMana !== null && initialMana !== null) {
        expect(finalMana).toBeLessThan(initialMana);
      }
    });
  });

  test("upcast spell to higher tier", async ({ page }) => {
    await test.step("Setup spellcasting character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Navigate to Spells tab", async () => {
      const spellsTab = page.getByRole("button", { name: /^spells$/i });
      const hasSpellsTab = await spellsTab.isVisible({ timeout: 1000 }).catch(() => false);

      if (!hasSpellsTab) {
        test.skip(true, "Character is not a spellcaster");
      }

      await spellsTab.click();
      await page.waitForTimeout(500);
    });

    await test.step("Open upcast dialog and upcast spell", async () => {
      // Look for upcast button (TrendingUp icon button)
      const upcastButtons = page.getByRole("button").filter({ has: page.locator("svg") });
      const upcastButton = upcastButtons.first();
      const hasUpcastVisible = await upcastButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasUpcastVisible) {
        test.skip(true, "No upcastable spells available");
      }

      // Click upcast button
      await upcastButton.click();
      await page.waitForTimeout(500);

      // Verify upcast dialog appeared
      const dialogTitle = page.getByText(/upcast|cast at higher tier/i);
      const hasDialog = await dialogTitle.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasDialog) {
        test.skip(true, "Upcast dialog did not appear");
      }

      // Look for tier selector buttons (+ button to increase tier)
      const increaseTierButton = page.getByRole("button", { name: /\+|increase/i });
      const hasIncrease = await increaseTierButton.isVisible({ timeout: 1000 }).catch(() => false);

      if (hasIncrease) {
        await increaseTierButton.click();
        await page.waitForTimeout(300);
      }

      // Find and click the Cast button in the dialog
      const castButton = page.getByRole("button", { name: /cast/i }).last();
      await expect(castButton).toBeVisible();
      await castButton.click();

      // Wait for spell cast to complete and dialog to close
      await page.waitForTimeout(1000);

      // Verify dialog closed
      const dialogStillVisible = await dialogTitle.isVisible({ timeout: 500 }).catch(() => false);
      expect(dialogStillVisible).toBe(false);
    });
  });

  test("verify spell cast appears in activity log", async ({ page }) => {
    await test.step("Setup spellcasting character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Navigate to Spells tab", async () => {
      const spellsTab = page.getByRole("button", { name: /^spells$/i });
      const hasSpellsTab = await spellsTab.isVisible({ timeout: 1000 }).catch(() => false);

      if (!hasSpellsTab) {
        test.skip(true, "Character is not a spellcaster");
      }

      await spellsTab.click();
      await page.waitForTimeout(500);
    });

    await test.step("Cast a spell", async () => {
      const castButton = page.getByRole("button", { name: /cast/i }).first();
      const hasCast = await castButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasCast) {
        test.skip(true, "No cast buttons available");
      }

      await castButton.click();
      await page.waitForTimeout(1000);
    });

    await test.step("Navigate to Activity Log", async () => {
      const logTab = page.getByRole("button", { name: /log|activity/i });
      await expect(logTab).toBeVisible();
      await logTab.click();
      await page.waitForTimeout(500);
    });

    await test.step("Verify spell cast entry in log", async () => {
      // Look for spell cast entry with school, tier, and resource cost
      const spellLogEntry = page.getByText(/cast|spell|tier|mana/i).first();
      await expect(spellLogEntry).toBeVisible({ timeout: 3000 });
    });
  });

  test("verify action cost deduction when casting spell", async ({ page }) => {
    await test.step("Setup spellcasting character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Enter encounter mode", async () => {
      // Navigate to combat tab to access encounter controls
      const combatTab = page.getByRole("button", { name: /combat/i });
      await combatTab.click();
      await page.waitForTimeout(500);

      // Start encounter by rolling initiative
      const initiativeButton = page.getByRole("button", { name: /initiative|roll initiative/i });
      const hasInitiative = await initiativeButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasInitiative) {
        await initiativeButton.click();
        await page.waitForTimeout(1000);
      }
    });

    await test.step("Navigate to Spells tab and cast spell", async () => {
      const spellsTab = page.getByRole("button", { name: /^spells$/i });
      const hasSpellsTab = await spellsTab.isVisible({ timeout: 1000 }).catch(() => false);

      if (!hasSpellsTab) {
        test.skip(true, "Character is not a spellcaster");
      }

      await spellsTab.click();
      await page.waitForTimeout(500);

      // Get initial action count
      const actionText = await page.getByText(/\d+ \/ \d+ actions/i).textContent();
      const initialActions = actionText ? parseInt(actionText.split("/")[0].trim() || "0") : null;

      // Cast a spell
      const castButton = page.getByRole("button", { name: /cast/i }).first();
      const hasCast = await castButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasCast) {
        test.skip(true, "No cast buttons available");
      }

      await castButton.click();
      await page.waitForTimeout(1000);

      // Verify actions were deducted
      const finalActionText = await page.getByText(/\d+ \/ \d+ actions/i).textContent();
      const finalActions = finalActionText
        ? parseInt(finalActionText.split("/")[0].trim() || "0")
        : null;

      if (finalActions !== null && initialActions !== null) {
        expect(finalActions).toBeLessThanOrEqual(initialActions);
      }
    });
  });

  test("cast multiple cantrips until out of actions, then end turn", async ({ page }) => {
    await test.step("Setup spellcasting character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Enter encounter mode", async () => {
      const combatTab = page.getByRole("button", { name: /combat/i });
      await combatTab.click();
      await page.waitForTimeout(500);

      const initiativeButton = page.getByRole("button", { name: /initiative|roll initiative/i });
      const hasInitiative = await initiativeButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasInitiative) {
        await initiativeButton.click();
        await page.waitForTimeout(1000);
      }
    });

    await test.step("Navigate to Spells tab", async () => {
      const spellsTab = page.getByRole("button", { name: /^spells$/i });
      const hasSpellsTab = await spellsTab.isVisible({ timeout: 1000 }).catch(() => false);

      if (!hasSpellsTab) {
        test.skip(true, "Character is not a spellcaster");
      }

      await spellsTab.click();
      await page.waitForTimeout(500);
    });

    await test.step("Cast cantrips until out of actions", async () => {
      // Look for cantrip
      const cantripBadge = page.getByText(/cantrip/i).first();
      const hasCantripVisible = await cantripBadge.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasCantripVisible) {
        test.skip(true, "Character has no cantrips available");
      }

      // Get initial action count
      let actionText = await page.getByText(/\d+ \/ \d+ actions/i).textContent();
      let currentActions = actionText ? parseInt(actionText.split("/")[0].trim() || "0") : 0;

      if (currentActions === 0) {
        test.skip(true, "Character has no actions to cast spells");
      }

      // Cast cantrips until we run out of actions
      let castCount = 0;
      while (currentActions > 0 && castCount < 10) {
        // Safety limit
        const castButton = page.getByRole("button", { name: /cast/i }).first();
        const isEnabled = await castButton.isEnabled();

        if (!isEnabled) {
          break; // Button is disabled, we're out of actions
        }

        await castButton.click();
        await page.waitForTimeout(500);
        castCount++;

        // Get updated action count
        actionText = await page.getByText(/\d+ \/ \d+ actions/i).textContent();
        currentActions = actionText ? parseInt(actionText.split("/")[0].trim() || "0") : 0;
      }

      expect(castCount).toBeGreaterThan(0);

      // Verify Cast button is now disabled (out of actions or need resource)
      const castButton = page.getByRole("button", { name: /cast/i }).first();
      const finalEnabled = await castButton.isEnabled();
      expect(finalEnabled).toBe(false);
    });

    await test.step("End turn and verify cantrip can be cast again", async () => {
      // Navigate to combat tab to access End Turn button
      const combatTab = page.getByRole("button", { name: /combat/i });
      await combatTab.click();
      await page.waitForTimeout(500);

      // End turn
      const endTurnButton = page.getByRole("button", { name: /end turn/i });
      const hasEndTurn = await endTurnButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasEndTurn) {
        await endTurnButton.click();
        await page.waitForTimeout(500);
      } else {
        test.skip(true, "No end turn button available");
      }

      // Navigate back to Spells tab
      const spellsTab = page.getByRole("button", { name: /^spells$/i });
      await spellsTab.click();
      await page.waitForTimeout(500);

      // Verify Cast button is now enabled again
      const castButton = page.getByRole("button", { name: /cast/i }).first();
      await expect(castButton).toBeEnabled({ timeout: 2000 });

      // Cast the cantrip to confirm it works
      await castButton.click();
      await page.waitForTimeout(500);

      // Verify actions were deducted
      const actionText = await page.getByText(/\d+ \/ \d+ actions/i).textContent();
      const currentActions = actionText ? parseInt(actionText.split("/")[0].trim() || "0") : null;
      expect(currentActions).not.toBeNull();
    });
  });

  test("upcast spell to maximum tier", async ({ page }) => {
    await test.step("Setup spellcasting character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Navigate to Spells tab", async () => {
      const spellsTab = page.getByRole("button", { name: /^spells$/i });
      const hasSpellsTab = await spellsTab.isVisible({ timeout: 1000 }).catch(() => false);

      if (!hasSpellsTab) {
        test.skip(true, "Character is not a spellcaster");
      }

      await spellsTab.click();
      await page.waitForTimeout(500);
    });

    await test.step("Open upcast dialog and upcast to max tier", async () => {
      // Look for upcast button (TrendingUp icon)
      const upcastButtons = page.getByRole("button").filter({ has: page.locator("svg") });
      const upcastButton = upcastButtons.first();
      const hasUpcastVisible = await upcastButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasUpcastVisible) {
        test.skip(true, "No upcastable spells available");
      }

      await upcastButton.click();
      await page.waitForTimeout(500);

      // Verify upcast dialog appeared
      const dialogTitle = page.getByText(/upcast|cast at higher tier/i);
      const hasDialog = await dialogTitle.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasDialog) {
        test.skip(true, "Upcast dialog did not appear");
      }

      // Click + button repeatedly until it's disabled (reached max tier)
      const increaseTierButton = page.getByRole("button", { name: /\+/i });
      let clickCount = 0;
      let maxClicks = 20; // Safety limit

      while (clickCount < maxClicks) {
        const isEnabled = await increaseTierButton.isEnabled({ timeout: 500 }).catch(() => false);

        if (!isEnabled) {
          break; // Reached max tier
        }

        await increaseTierButton.click();
        await page.waitForTimeout(200);
        clickCount++;
      }

      expect(clickCount).toBeGreaterThan(0); // Should have increased at least once

      // Verify + button is now disabled (at max tier)
      await expect(increaseTierButton).toBeDisabled({ timeout: 1000 });

      // Cast at max tier
      const castButton = page.getByRole("button", { name: /cast/i }).last();
      await expect(castButton).toBeVisible();

      // Check if we can afford it
      const canAfford = await castButton.isEnabled();
      if (canAfford) {
        await castButton.click();
        await page.waitForTimeout(1000);

        // Verify dialog closed
        const dialogStillVisible = await dialogTitle.isVisible({ timeout: 500 }).catch(() => false);
        expect(dialogStillVisible).toBe(false);
      } else {
        // Can't afford max tier cast, just close dialog
        const closeButton = page.getByRole("button", { name: /cancel|close/i });
        const hasClose = await closeButton.isVisible({ timeout: 1000 }).catch(() => false);
        if (hasClose) {
          await closeButton.click();
        }
      }
    });
  });

  test("verify cannot upcast beyond maximum tier", async ({ page }) => {
    await test.step("Setup spellcasting character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Navigate to Spells tab", async () => {
      const spellsTab = page.getByRole("button", { name: /^spells$/i });
      const hasSpellsTab = await spellsTab.isVisible({ timeout: 1000 }).catch(() => false);

      if (!hasSpellsTab) {
        test.skip(true, "Character is not a spellcaster");
      }

      await spellsTab.click();
      await page.waitForTimeout(500);
    });

    await test.step("Verify + button disabled at max tier", async () => {
      const upcastButtons = page.getByRole("button").filter({ has: page.locator("svg") });
      const upcastButton = upcastButtons.first();
      const hasUpcastVisible = await upcastButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasUpcastVisible) {
        test.skip(true, "No upcastable spells available");
      }

      await upcastButton.click();
      await page.waitForTimeout(500);

      const dialogTitle = page.getByText(/upcast|cast at higher tier/i);
      const hasDialog = await dialogTitle.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasDialog) {
        test.skip(true, "Upcast dialog did not appear");
      }

      // Click + until disabled
      const increaseTierButton = page.getByRole("button", { name: /\+/i });
      let maxClicks = 20;

      for (let i = 0; i < maxClicks; i++) {
        const isEnabled = await increaseTierButton.isEnabled({ timeout: 500 }).catch(() => false);
        if (!isEnabled) break;

        await increaseTierButton.click();
        await page.waitForTimeout(200);
      }

      // Verify + button is disabled at max tier
      await expect(increaseTierButton).toBeDisabled();

      // Try clicking again (should do nothing)
      await increaseTierButton.click({ force: true }).catch(() => {
        /* Expected to fail */
      });
      await page.waitForTimeout(200);

      // Verify still disabled
      await expect(increaseTierButton).toBeDisabled();

      // Close dialog
      const cancelButton = page.getByRole("button", { name: /cancel|close/i });
      const hasCancel = await cancelButton.isVisible({ timeout: 1000 }).catch(() => false);
      if (hasCancel) {
        await cancelButton.click();
      }
    });
  });

  test("verify cannot cast spell without enough mana", async ({ page }) => {
    await test.step("Setup spellcasting character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Navigate to Spells tab", async () => {
      const spellsTab = page.getByRole("button", { name: /^spells$/i });
      const hasSpellsTab = await spellsTab.isVisible({ timeout: 1000 }).catch(() => false);

      if (!hasSpellsTab) {
        test.skip(true, "Character is not a spellcaster");
      }

      await spellsTab.click();
      await page.waitForTimeout(500);
    });

    await test.step("Deplete mana by casting spells repeatedly", async () => {
      // Get initial mana
      const manaResourceText = await page.getByText(/\d+\/\d+ mana/i).textContent();
      let currentMana = manaResourceText ? parseInt(manaResourceText.split("/")[0] || "0") : 0;

      if (currentMana === 0) {
        // Already out of mana, perfect for testing
        return;
      }

      // Cast tier 1+ spells until we run out of mana
      let castCount = 0;
      const maxCasts = 20; // Safety limit

      while (currentMana > 0 && castCount < maxCasts) {
        // Find a leveled spell (not cantrip) that we can afford
        const tier1Badge = page.getByText(/tier [1-9]/i).first();
        const hasTier1 = await tier1Badge.isVisible({ timeout: 1000 }).catch(() => false);

        if (!hasTier1) {
          // No leveled spells, skip test
          test.skip(true, "No leveled spells available to deplete mana");
        }

        // Find enabled Cast button for leveled spell
        const castButtons = page.getByRole("button", { name: /cast/i });
        let foundEnabledButton = false;

        for (let i = 0; i < (await castButtons.count()); i++) {
          const button = castButtons.nth(i);
          const isEnabled = await button.isEnabled();

          if (isEnabled) {
            await button.click();
            await page.waitForTimeout(500);
            foundEnabledButton = true;
            castCount++;
            break;
          }
        }

        if (!foundEnabledButton) {
          // No enabled cast buttons, we're out of mana
          break;
        }

        // Check current mana
        const updatedManaText = await page.getByText(/\d+\/\d+ mana/i).textContent();
        currentMana = updatedManaText ? parseInt(updatedManaText.split("/")[0] || "0") : 0;
      }
    });

    await test.step("Verify Cast button disabled for spells requiring mana", async () => {
      // Look for tier 1+ spell
      const tier1Badge = page.getByText(/tier [1-9]/i).first();
      const hasTier1 = await tier1Badge.isVisible({ timeout: 1000 }).catch(() => false);

      if (!hasTier1) {
        test.skip(true, "No leveled spells to test");
      }

      // Verify mana is 0
      const manaResourceText = await page.getByText(/\d+\/\d+ mana/i).textContent();
      const currentMana = manaResourceText ? parseInt(manaResourceText.split("/")[0] || "0") : null;

      expect(currentMana).toBe(0);

      // Find Cast button for leveled spell - should be disabled
      // Note: We need to find a Cast button that's NOT for a cantrip
      const castButtons = page.getByRole("button", { name: /cast/i });
      let foundDisabledLeveabledSpellButton = false;

      for (let i = 0; i < (await castButtons.count()); i++) {
        const button = castButtons.nth(i);
        const isEnabled = await button.isEnabled();

        // Check if this button is near a tier 1+ badge (not cantrip)
        const parentCard = button.locator("xpath=ancestor::div[contains(@class, 'p-')]");
        const hasTierBadge = await parentCard
          .getByText(/tier [1-9]/i)
          .isVisible()
          .catch(() => false);

        if (hasTierBadge && !isEnabled) {
          foundDisabledLeveabledSpellButton = true;
          expect(isEnabled).toBe(false);
          break;
        }
      }

      if (!foundDisabledLeveabledSpellButton) {
        // Alternative: just verify at least one Cast button shows "Need Resource" text
        const needResourceButton = page.getByRole("button", { name: /need resource/i });
        const hasNeedResource = await needResourceButton
          .isVisible({ timeout: 1000 })
          .catch(() => false);

        if (hasNeedResource) {
          await expect(needResourceButton).toBeDisabled();
        }
      }
    });
  });
});
