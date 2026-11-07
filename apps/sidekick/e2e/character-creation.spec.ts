import { expect, test } from "@playwright/test";

import { CharacterTestUtils } from "./utils/character-utils";

test("quick create character, roll initiative, and use actions", async ({ page }) => {
  await page.goto("/");
  const sheet = new CharacterTestUtils(page);
  await sheet.createCharacter();
  await sheet.rollInitiative();
  await sheet.performDiceRoll();
});

for (const custom of [false, true]) {
  test(
    "keyboard builder reviews " + (custom ? "custom" : "recommended") + " scores",
    async ({ page }) => {
      await page.setViewportSize(
        custom ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      );
      await page.goto("/");
      await expect(page.getByText(/Your sheet saves in this browser/)).toBeVisible();
      await expect(page.getByRole("alert").filter({ hasText: /no characters/i })).toHaveCount(0);
      await page.getByRole("button", { name: /Create New Character/ }).click();
      await expect(page.getByText(/random ancestry and background/)).toBeVisible();
      await page.getByRole("button", { name: "Character Builder" }).click();
      const wizard = page.getByRole("dialog", { name: "Character Builder" });
      const next = (name: string) => wizard.getByRole("button", { name: "Next: " + name }).click();
      const choose = async (name: string) => {
        const radio = wizard.getByRole("radio", { name, exact: true });
        await radio.focus();
        await page.keyboard.press("Space");
        await expect(radio).toBeChecked();
      };
      await choose("Berserker");
      await next("Ancestry");
      await wizard.getByRole("textbox", { name: "Character name" }).fill("Gate Warden");
      await choose("Human");
      await next("Background");
      await choose("Acrobat");
      await next("Features");
      await next("Attributes");
      const strength = wizard.getByRole("spinbutton", { name: "Strength" });
      await expect(strength).toHaveValue("2");
      await expect(wizard.getByRole("spinbutton", { name: "Dexterity" })).toHaveValue("2");
      if (custom) {
        await expect(wizard.getByText(/Step 5 of 8/)).toBeVisible();
        const rect = await wizard.getByRole("button", { name: "Increase strength" }).boundingBox();
        expect(rect!.x + rect!.width).toBeLessThanOrEqual(390);
        await strength.fill("3");
      }
      await next("Skills");
      await wizard.getByRole("button", { name: "Increase Arcana points" }).click();
      await next("Equipment");
      await expect(wizard.getByText("Battleaxe", { exact: true })).toBeVisible();
      await next("Review");
      await expect(wizard.getByRole("heading", { name: "Review Gate Warden" })).toBeVisible();
      await expect(wizard.getByText(/unspent skill points/)).toBeVisible();
      const finish = wizard.getByRole("button", { name: "Finish Character" });
      if (custom) {
        await expect(finish).toBeDisabled();
        await wizard.getByRole("checkbox", { name: /Use these custom scores/ }).check();
      }
      await finish.click();
      await expect(page.getByRole("textbox", { name: "Character Name", exact: true })).toHaveValue(
        "Gate Warden",
      );
      await expect(
        page.getByText(custom ? "0/3 d4 dice" : "0/2 d4 dice", { exact: true }),
      ).toBeVisible();
      if (!custom) {
        const health = await page
          .getByRole("button", { name: "Damage", exact: true })
          .boundingBox();
        const actions = await page
          .getByRole("heading", { name: "Actions", exact: true })
          .boundingBox();
        expect(actions!.x).toBeGreaterThan(health!.x + health!.width);
        expect(actions!.y).toBeLessThan(health!.y + health!.height);
      }
    },
  );
}
