import { type Page, expect, test } from "@playwright/test";

import mage from "./fixtures/mage.json";

// A prepared level-six Mage has known schools, tier-three access, 12 mana
// and three combat actions. Tests fail if that setup stops working.
async function setupMage(page: Page, mana = 12, inEncounter = true) {
  await page.addInitScript(
    ({ character, mana, inEncounter }) => {
      if (!localStorage.getItem("sheets-characters")) {
        character._resourceValues.mana.value = mana;
        character.inEncounter = inEncounter;
        if (!inEncounter) character.actionTracker.current = 0;
        localStorage.setItem("sheets-characters", JSON.stringify([character]));
        localStorage.setItem(
          "sheets-settings",
          JSON.stringify({ activeCharacterId: character.id }),
        );
      }
    },
    { character: mage, mana, inEncounter },
  );
  await page.goto("/");
  await expect(page.getByRole("textbox", { name: "Character Name", exact: true })).toHaveValue(
    "E2E Mage",
  );
  await page.getByRole("button", { name: "Spells", exact: true }).click();
  await expect(page.getByText("Tier 3 Access", { exact: true })).toBeVisible();
  await expectMana(page, mana);
}
function spell(page: Page, name: string) {
  return page.getByRole("group", { name: `${name} spell`, exact: true });
}
async function expectMana(page: Page, value: number) {
  await expect(
    page
      .getByRole("group", { name: "Mana resource", exact: true })
      .getByText(String(value), { exact: true }),
  ).toBeVisible();
}
async function expectActions(page: Page, value: number) {
  await page.getByRole("button", { name: "Combat", exact: true }).click();
  await expect(page.getByTitle("Click to use action", { exact: true })).toHaveCount(value);
  await page.getByRole("button", { name: "Spells", exact: true }).click();
}
async function upcast(page: Page) {
  await spell(page, "Frost Shield").getByRole("button", { name: "Upcast", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Upcast Frost Shield", exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("Abilities and Spells", () => {
  test("view and interact with character tab", async ({ page }) => {
    await setupMage(page);
    await page.getByRole("button", { name: "Character", exact: true }).click();
    await expect(page.getByText("Attributes", { exact: true })).toBeVisible();
  });
  test("view spells tab for spellcasting characters", async ({ page }) => {
    await setupMage(page);
    await expect(spell(page, "Flame Dart").getByText("Cantrip", { exact: true })).toBeVisible();
    await expect(spell(page, "Frost Shield").getByText("Tier 1", { exact: true })).toBeVisible();
    await expect(spell(page, "Flame Barrier").getByText("Tier 3", { exact: true })).toBeVisible();
  });
  test("cast cantrip spell without consuming mana", async ({ page }) => {
    await setupMage(page);
    await spell(page, "Flame Dart").getByRole("button", { name: "Cast", exact: true }).click();
    await expectActions(page, 2);
    await expectMana(page, 12);
  });
  test("cast tier 1 spell and consume mana", async ({ page }) => {
    await setupMage(page);
    await spell(page, "Frost Shield").getByRole("button", { name: "Cast", exact: true }).click();
    await expectMana(page, 11);
    await page.reload();
    await page.getByRole("button", { name: "Spells", exact: true }).click();
    await expectMana(page, 11);
    await expectActions(page, 2);
  });
  test("upcast spell to higher tier", async ({ page }) => {
    await setupMage(page);
    const dialog = await upcast(page);
    await dialog.getByRole("button", { name: "Increase casting tier", exact: true }).click();
    await expect(dialog.getByText("T2", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Cast (Tier 2)", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expectMana(page, 10);
    await expectActions(page, 2);
  });
  test("verify spell cast appears in activity log", async ({ page }) => {
    await setupMage(page);
    await spell(page, "Flame Dart").getByRole("button", { name: "Cast", exact: true }).click();
    await page.getByRole("button", { name: "Log", exact: true }).click();
    const log = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("Character Log", { exact: true }) });
    await expect(log.getByText("Flame Dart (Spell)", { exact: true })).toBeVisible();
    await expect(log).toContainText("Cast Flame Dart (fire, tier 0, 1 action)");
  });
  test("verify action cost deduction when casting spell", async ({ page }) => {
    await setupMage(page);
    await spell(page, "Ignite").getByRole("button", { name: "Cast", exact: true }).click();
    await expectActions(page, 1);
    await expectMana(page, 11);
  });
  test("cast multiple cantrips until out of actions, then end turn", async ({ page }) => {
    await setupMage(page);
    for (const remaining of [2, 1, 0]) {
      await spell(page, "Flame Dart").getByRole("button", { name: "Cast", exact: true }).click();
      await expectActions(page, remaining);
    }
    await expect(
      spell(page, "Flame Dart").getByRole("button", { name: "Cast", exact: true }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Combat", exact: true }).click();
    await page.getByRole("button", { name: "End Turn", exact: true }).click();
    await expectActions(page, 3);
    await expect(
      spell(page, "Flame Dart").getByRole("button", { name: "Cast", exact: true }),
    ).toBeEnabled();
    await expectMana(page, 12);
  });
  test("upcast spell to maximum tier", async ({ page }) => {
    await setupMage(page);
    const dialog = await upcast(page);
    const increase = dialog.getByRole("button", { name: "Increase casting tier", exact: true });
    await increase.click();
    await increase.click();
    await expect(dialog.getByText("T3", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Cast (Tier 3)", exact: true }).click();
    await expectMana(page, 9);
    await expectActions(page, 2);
  });
  test("verify cannot upcast beyond maximum tier", async ({ page }) => {
    await setupMage(page);
    const dialog = await upcast(page);
    const increase = dialog.getByRole("button", { name: "Increase casting tier", exact: true });
    const decrease = dialog.getByRole("button", { name: "Decrease casting tier", exact: true });
    await expect(decrease).toBeDisabled();
    await increase.click();
    await increase.click();
    await expect(increase).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Cast (Tier 4)", exact: true })).toHaveCount(0);
    await decrease.click();
    await expect(increase).toBeEnabled();
    await expect(dialog.getByText("T2", { exact: true })).toBeVisible();
  });
  test("verify cannot cast spell without enough mana", async ({ page }) => {
    await setupMage(page, 0);
    await expect(
      spell(page, "Frost Shield").getByRole("button", { name: "Cast", exact: true }),
    ).toBeDisabled();
    await expect(
      spell(page, "Frost Shield").getByRole("button", { name: "Upcast", exact: true }),
    ).toBeDisabled();
    await expect(
      spell(page, "Flame Dart").getByRole("button", { name: "Cast", exact: true }),
    ).toBeEnabled();
    await expectMana(page, 0);
  });
  test("casting outside combat does not require available combat actions", async ({ page }) => {
    await setupMage(page, 12, false);
    const cast = spell(page, "Frost Shield").getByRole("button", { name: "Cast", exact: true });
    await expect(cast).toBeEnabled();
    await cast.click();
    await expectMana(page, 11);
    await expectActions(page, 0);
  });
});
