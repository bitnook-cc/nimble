import { type Page, expect, test } from "@playwright/test";

import mage from "./fixtures/mage.json";

async function setup(page: Page, spent = false) {
  await page.addInitScript(
    ({ character, spent }) => {
      if (localStorage.getItem("sheets-characters")) return;
      character.inEncounter = false;
      character.actionTracker.current = 0;
      const frequencies = ["per_turn", "per_encounter", "per_safe_rest", "manual"] as const;
      const names = ["Turn step", "Battle cry", "Daily ward", "Manual ward"];
      character._abilities = frequencies.map((frequency, index) => ({
        id: `e2e-${frequency}`,
        name: names[index],
        description: "One use per reset period",
        type: "action",
        frequency,
        maxUses: { type: "fixed", value: 1 },
        actionCost: 0,
      })) as typeof character._abilities;
      character._abilityUses = Object.fromEntries(
        frequencies.map((frequency) => [`e2e-${frequency}`, spent ? 1 : 0]),
      );
      localStorage.setItem("sheets-characters", JSON.stringify([character]));
      localStorage.setItem("sheets-settings", JSON.stringify({ activeCharacterId: character.id }));
    },
    { character: mage, spent },
  );
  await page.goto("/");
  await expect(page.getByRole("textbox", { name: "Character Name", exact: true })).toHaveValue(
    "E2E Mage",
  );
}

const ability = (page: Page, name: string) =>
  page.getByRole("group", { name: `${name} ability`, exact: true });

test("per-turn abilities stay available outside combat in both views and after reload", async ({
  page,
}) => {
  await setup(page, true);
  for (const view of ["Combat", "Character"] as const) {
    await page.getByRole("button", { name: view, exact: true }).click();
    const turn = ability(page, "Turn step");
    const use = turn.getByTitle("Use Ability", { exact: true });
    await expect(use).toBeEnabled();
    await expect(turn.getByText("1/1", { exact: true })).toBeVisible();
    await use.click();
    await use.click();
    await expect(use).toBeEnabled();
    await expect(turn.getByText("1/1", { exact: true })).toBeVisible();
    await expect(ability(page, "Battle cry").getByTitle("Used", { exact: true })).toBeDisabled();
  }
  await page.reload();
  await page.getByRole("button", { name: "Combat", exact: true }).click();
  await expect(ability(page, "Turn step").getByTitle("Use Ability", { exact: true })).toBeEnabled();
});

test("initiative resets combat and turn uses while preserving rest and manual uses", async ({
  page,
}) => {
  await setup(page, true);
  await page.getByRole("button", { name: "Combat", exact: true }).click();
  await page.getByRole("button", { name: "Roll Initiative", exact: true }).click();
  await expect(page.getByRole("button", { name: "End Combat", exact: true })).toBeVisible();
  for (const name of ["Turn step", "Battle cry"]) {
    const entry = ability(page, name);
    await expect(entry.getByTitle("Use Ability", { exact: true })).toBeEnabled();
    await expect(entry.getByText("1/1", { exact: true })).toBeVisible();
    await entry.getByTitle("Use Ability", { exact: true }).click();
    await expect(entry.getByTitle("Used", { exact: true })).toBeDisabled();
  }
  for (const name of ["Daily ward", "Manual ward"]) {
    await expect(ability(page, name).getByTitle("Used", { exact: true })).toBeDisabled();
  }
  await page.getByRole("button", { name: "End Turn", exact: true }).click();
  await expect(ability(page, "Turn step").getByTitle("Use Ability", { exact: true })).toBeEnabled();
  await expect(ability(page, "Battle cry").getByTitle("Used", { exact: true })).toBeDisabled();
  await page.reload();
  await page.getByRole("button", { name: "Combat", exact: true }).click();
  await expect(ability(page, "Turn step").getByTitle("Use Ability", { exact: true })).toBeEnabled();
  await expect(ability(page, "Battle cry").getByTitle("Used", { exact: true })).toBeDisabled();
});
