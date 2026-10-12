import { expect, type Page } from "@playwright/test";
import { test, slateURL, disconnect } from "./browser-fixtures";
import { combatant, ready, saved } from "./ui-fixtures";

test.use({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
test.beforeEach(async ({ page }) => {
  await page.goto(slateURL(page));
  await ready(page);
});
const tracker = (page: Page) =>
  page.getByRole("region", { name: "Initiative tracker", exact: true });
const current = (page: Page) => tracker(page).locator(".turn-status");

async function addBoss(page: Page) {
  const tool = tracker(page);
  await tool.getByRole("tab", { name: "Monsters", exact: true }).click();
  await tool
    .getByRole("searchbox", { name: "Search monsters", exact: true })
    .fill("Pudge the Blunderer");
  await tool
    .getByRole("button", {
      name: "Add Pudge the Blunderer to encounter",
      exact: true,
    })
    .click();
  await tool.getByRole("tab", { name: "Combatants", exact: true }).click();
}

test("Nimble defaults to heroes before ordinary monsters regardless of initiative numbers", async ({
  page,
}) => {
  const tool = tracker(page);
  await combatant(page, "Goblin", 30, "enemy");
  await combatant(page, "Mira", 1);
  await combatant(page, "Rook", 20);
  await expect(
    tool.getByRole("combobox", { name: "Initiative mode" }),
  ).toHaveValue("nimble");
  await expect(
    tool.getByRole("button", { name: "Sort by initiative" }),
  ).toBeHidden();
  await tool.getByRole("button", { name: "Begin combat", exact: true }).click();
  await expect(current(page)).toContainText("Mira");
  await expect(tool.locator(".combatant-name > span:first-child")).toHaveText([
    "Mira",
    "Rook",
    "Goblin",
  ]);
  await tool.getByRole("button", { name: "Next turn", exact: true }).click();
  await expect(current(page)).toContainText("Rook");
  await tool.getByRole("button", { name: "Next turn", exact: true }).click();
  await expect(current(page)).toContainText("Goblin");
  await tool.getByRole("button", { name: "Next turn", exact: true }).click();
  await expect(current(page)).toContainText("Mira");
  await expect(tool.locator(".round-counter strong")).toHaveText("02");
});

test("classic initiative sorts entered totals, gives a boss one normal turn and persists offline", async ({
  page,
  context,
}) => {
  const tool = tracker(page);
  await combatant(page, "Mira", 1);
  await combatant(page, "Rook", 1);
  await addBoss(page);
  await tool
    .getByRole("combobox", { name: "Initiative mode" })
    .selectOption("classic");
  await expect(
    tool.getByRole("button", { name: "Begin combat", exact: true }),
  ).toHaveCount(0);
  await tool
    .getByRole("button", { name: "Roll initiative", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Roll initiative",
    exact: true,
  });
  await dialog
    .getByRole("spinbutton", { name: "Initiative for Mira", exact: true })
    .fill("15");
  await dialog
    .getByRole("spinbutton", { name: "Initiative for Rook", exact: true })
    .fill("15");
  await dialog
    .getByRole("spinbutton", {
      name: "Initiative for Pudge the Blunderer",
      exact: true,
    })
    .fill("25");
  if (!test.info().project.name)
    await expect(dialog).toHaveScreenshot("classic-initiative-popup.png");
  await dialog
    .getByRole("button", { name: "Start combat", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(tool.locator(".combatant-name > span:first-child")).toHaveText([
    "Pudge the Blunderer",
    "Mira",
    "Rook",
  ]);
  await expect(current(page)).toContainText("Pudge the Blunderer");
  for (const name of ["Mira", "Rook", "Pudge the Blunderer"]) {
    await tool.getByRole("button", { name: "Next turn", exact: true }).click();
    await expect(current(page)).toContainText(name);
    await expect(
      tool.getByRole("region", { name: "Legendary action" }),
    ).toHaveCount(0);
  }
  await expect(tool.locator(".round-counter strong")).toHaveText("02");
  await saved(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await disconnect(context);
  await page.reload();
  await expect(
    tool.getByRole("combobox", { name: "Initiative mode" }),
  ).toHaveValue("classic");
  await expect(current(page)).toContainText("Pudge the Blunderer");
  await tool.getByRole("button", { name: "Next turn", exact: true }).click();
  await expect(current(page)).toContainText("Mira");
});

test("dismissing initiative leaves combat unchanged and one undo restores a mode switch", async ({
  page,
}) => {
  const tool = tracker(page);
  await combatant(page, "Mira", 5);
  await addBoss(page);
  await tool.getByRole("button", { name: "Begin combat", exact: true }).click();
  await tool.getByRole("button", { name: "Next turn", exact: true }).click();
  await expect(
    tool.getByRole("region", { name: "Legendary action" }),
  ).toBeVisible();
  await tool
    .getByRole("combobox", { name: "Initiative mode" })
    .selectOption("classic");
  await tool
    .getByRole("button", { name: "Roll initiative", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Roll initiative",
    exact: true,
  });
  await dialog
    .getByRole("spinbutton", { name: "Initiative for Mira", exact: true })
    .fill("99");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    tool.getByRole("button", { name: "Roll initiative", exact: true }),
  ).toBeVisible();
  await tool
    .getByRole("button", { name: "Roll initiative", exact: true })
    .click();
  await expect(
    dialog.getByRole("spinbutton", {
      name: "Initiative for Mira",
      exact: true,
    }),
  ).toHaveValue("5");
  await page.mouse.click(5, 5);
  await expect(dialog).toHaveCount(0);
  await tool
    .getByRole("button", { name: "Undo combat change", exact: true })
    .click();
  await expect(
    tool.getByRole("combobox", { name: "Initiative mode" }),
  ).toHaveValue("nimble");
  await expect(
    tool.getByRole("region", { name: "Legendary action" }),
  ).toContainText("acts after Mira");
});
