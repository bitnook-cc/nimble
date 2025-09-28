import { Page, expect } from "@playwright/test";

/**
 * Utility functions for character management in E2E tests
 */
export class CharacterTestUtils {
  constructor(private page: Page) {}

  /**
   * Creates a new character using the quick create flow
   * @param timeout - Maximum time to wait for character creation (default: 10000ms)
   * @returns Promise that resolves when character is created
   */
  async createCharacter(timeout: number = 10000): Promise<void> {
    await this.page.waitForLoadState("networkidle");

    // Check if we need to navigate to character creation
    const createNewCharacterButton = this.page.getByRole("button", {
      name: /create new character/i,
    });

    if (await createNewCharacterButton.isVisible({ timeout: 2000 })) {
      // We're in the character selector, click "Create New Character"
      await createNewCharacterButton.click();

      // Wait for the form to appear
      await this.page.waitForTimeout(500);
    }

    // Look for the Quick Create button
    const quickCreateButton = this.page.getByRole("button", { name: /quick create/i });
    await expect(quickCreateButton).toBeVisible({ timeout });
    await quickCreateButton.click();

    // Wait for character creation to complete
    // This could be indicated by:
    // 1. A success message
    // 2. The character name appearing in the interface
    // 3. Character sheet tabs becoming visible
    await this.page.waitForTimeout(2000); // Give time for character creation and state updates

    // Verify character was created by checking for character-specific UI elements
    const characterIndicators = [
      this.page.getByText(/character/i),
      this.page.getByRole("tab", { name: /combat|skills|equipment/i }),
      this.page.getByText(/level \d+/i),
    ];

    // Wait for at least one indicator to appear
    let characterCreated = false;
    for (const indicator of characterIndicators) {
      try {
        await expect(indicator).toBeVisible({ timeout: 3000 });
        characterCreated = true;
        break;
      } catch {
        // Continue to next indicator
      }
    }

    if (!characterCreated) {
      throw new Error("Character creation failed or character indicators not found");
    }
  }

  /**
   * Ensures a character exists, creating one if needed
   * This is a safe method that won't fail if a character already exists
   */
  async ensureCharacterExists(): Promise<void> {
    try {
      // Check if we're already in a character sheet (look for character-specific elements)
      const characterSheetIndicators = [
        this.page.getByRole("tab", { name: /combat/i }),
        this.page.getByRole("tab", { name: /skills/i }),
        this.page.getByText(/hit points|hp/i),
      ];

      let hasCharacter = false;
      for (const indicator of characterSheetIndicators) {
        if (await indicator.isVisible({ timeout: 1000 })) {
          hasCharacter = true;
          break;
        }
      }

      if (!hasCharacter) {
        // No character detected, create one
        await this.createCharacter();
      }
    } catch (error) {
      // If anything fails, try to create a character
      console.log("Failed to detect existing character, attempting to create new one:", error);
      await this.createCharacter();
    }
  }

  /**
   * Navigates to a specific character sheet tab
   * @param tabName - Name of the tab (case insensitive)
   */
  async navigateToTab(tabName: string): Promise<void> {
    const tab = this.page.getByRole("tab", { name: new RegExp(tabName, "i") });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
  }

  /**
   * Waits for and returns the first visible button matching the given patterns
   * @param patterns - Array of regex patterns to match button names
   * @param timeout - Timeout in milliseconds
   */
  async getFirstVisibleButton(patterns: RegExp[], timeout: number = 5000) {
    for (const pattern of patterns) {
      const buttons = this.page.getByRole("button", { name: pattern });
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible({ timeout: 1000 })) {
          return button;
        }
      }
    }

    throw new Error(
      `No visible buttons found matching patterns: ${patterns.map((p) => p.toString()).join(", ")}`,
    );
  }

  /**
   * Performs a dice roll by clicking any available roll button
   * @param timeout - Timeout in milliseconds
   */
  async performDiceRoll(timeout: number = 5000): Promise<void> {
    const rollPatterns = [
      /roll|dice/i,
      /strength|dexterity|intelligence|will/i,
      /attack|cast|use|action/i,
      /acrobatics|athletics|stealth|perception/i,
    ];

    const rollButton = await this.getFirstVisibleButton(rollPatterns, timeout);
    await rollButton.click();

    // Wait for roll result to appear
    await expect(this.page.getByText(/rolled|result|d20|damage/i)).toBeVisible({ timeout: 3000 });
  }

  /**
   * Rolls initiative specifically
   */
  async rollInitiative(): Promise<void> {
    const initiativeButton = this.page.getByRole("button", { name: /initiative|roll initiative/i });
    await expect(initiativeButton).toBeVisible();
    await initiativeButton.click();

    // Check for initiative result or encounter state change
    await expect(this.page.getByText(/rolled|result|encounter|initiative/i)).toBeVisible({
      timeout: 3000,
    });
  }

  /**
   * Performs a health action (damage or heal)
   * @param action - 'damage' or 'heal'
   * @param amount - Amount to damage/heal (1, 5, 10, or 'custom')
   */
  async performHealthAction(
    action: "damage" | "heal",
    amount: 1 | 5 | 10 | "custom" = 1,
  ): Promise<void> {
    let buttonPattern: RegExp;

    if (action === "damage") {
      buttonPattern = amount === "custom" ? /damage/i : new RegExp(`damage|\\-${amount}`, "i");
    } else {
      buttonPattern = amount === "custom" ? /heal/i : new RegExp(`heal|\\+${amount}`, "i");
    }

    const actionButton = this.page.getByRole("button", { name: buttonPattern });
    await expect(actionButton).toBeVisible();
    await actionButton.click();

    // Verify HP indicator is still visible (health management worked)
    await expect(this.page.getByText(/hp|hit points|health/i)).toBeVisible();
  }
}
