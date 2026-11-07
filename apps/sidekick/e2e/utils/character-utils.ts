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

    const quickCreateButton = this.page.getByRole("button", { name: /quick create/i });
    if (!(await quickCreateButton.isVisible())) {
      // We're in the character selector, click "Create New Character"
      await createNewCharacterButton.click();
    }

    // Look for the Quick Create button
    await expect(quickCreateButton).toBeVisible({ timeout });
    await quickCreateButton.click();

    await expect(
      this.page.getByRole("textbox", { name: "Character Name", exact: true }),
    ).toBeVisible({ timeout });
  }

  /**
   * Ensures a character exists, creating one if needed
   * This is a safe method that won't fail if a character already exists
   */
  async ensureCharacterExists(): Promise<void> {
    if (
      !(await this.page.getByRole("textbox", { name: "Character Name", exact: true }).isVisible())
    ) {
      await this.createCharacter();
    }
  }

  /**
   * Navigates to a specific character sheet tab
   * @param tabName - Name of the tab (case insensitive)
   */
  async navigateToTab(tabName: string): Promise<void> {
    const nav = this.page.getByRole("navigation", { name: "Character sheet" });
    const direct = nav.getByRole("button", { name: tabName, exact: true });
    const more = nav.getByRole("button", { name: /More sections/ });
    await expect(direct.or(more).first()).toBeVisible();
    if (await direct.isVisible()) {
      await direct.click();
      await expect(direct).toHaveAttribute("aria-current", "page");
    } else {
      await more.click();
      await this.page.getByRole("menuitem", { name: tabName, exact: true }).click();
      await expect(more).toHaveAccessibleName("More sections, current: " + tabName);
    }
  }

  /**
   * Waits for and returns the first visible button matching the given patterns
   * @param patterns - Array of regex patterns to match button names
   */
  async getFirstVisibleButton(patterns: RegExp[]) {
    for (const pattern of patterns) {
      const buttons = this.page.getByRole("button", { name: pattern });
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          return button;
        }
      }
    }

    throw new Error(
      `No visible buttons found matching patterns: ${patterns.map((p) => p.toString()).join(", ")}`,
    );
  }

  /**
   * Performs a real custom roll and verifies its visible activity entry.
   */
  async performDiceRoll(): Promise<void> {
    await this.page.getByRole("button", { name: "Open dice roller", exact: true }).click();
    const panel = this.page.getByRole("menu", { name: "Open dice roller", exact: true });
    await panel.getByRole("button", { name: "d20", exact: true }).click();
    await panel.getByRole("button", { name: "Roll (1 dice)", exact: true }).click();
    await this.page.keyboard.press("Escape");
    await this.navigateToTab("Log");
    const log = this.page
      .locator('[data-slot="card"]')
      .filter({ has: this.page.getByText("Character Log", { exact: true }) });
    await expect(log.getByText("Custom roll", { exact: true }).last()).toBeVisible();
    await expect(log.getByText("(1d20)", { exact: true }).last()).toBeVisible();
  }

  /**
   * Rolls initiative specifically
   */
  async rollInitiative(): Promise<void> {
    const initiativeButton = this.page.getByRole("button", { name: /initiative|roll initiative/i });
    await expect(initiativeButton).toBeVisible();
    await initiativeButton.click();

    // Check for initiative result in activity log - look for the heading specifically
    await expect(this.page.getByRole("heading", { name: /initiative roll/i })).toBeVisible({
      timeout: 3000,
    });
  }
}
