import { test, slateURL, disconnect } from "./browser-fixtures";
import { resizeWidget, ready as offlineReady } from "./ui-fixtures";
import { openWidgetPicker } from "./ui-fixtures";
import { expect, type Page } from "@playwright/test";

async function ready(page: Page) {
  await page.goto(slateURL(page));
  await expect(page.getByRole("main", { name: "GM screen" })).toBeVisible();
}
async function saved(page: Page) {
  await expect(
    page.getByRole("status").filter({ hasText: "Saved on this device" }),
  ).toBeVisible();
}
async function combatant(page: Page, name: string, initiative: string) {
  await page
    .getByRole("button", { name: "Add combatant", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill(name);
  await dialog.getByLabel("Initiative", { exact: true }).fill(initiative);
  await dialog
    .getByRole("button", { name: "Add combatant", exact: true })
    .click();
}

test("double-digit advantage uses three dice and survives offline reload", async ({
  page,
  context,
}) => {
  await ready(page);
  await offlineReady(page);
  const dice = page.getByRole("region", { name: "Dice roller", exact: true });
  for (const sides of [44, 66, 88, 100]) {
    const base = sides === 100 ? 10 : sides / 11;
    for (const advantage of [1, -1]) {
      const values = advantage > 0 ? [2, 4, 1] : [4, 1, 3];
      await dice.getByLabel("Dice formula", { exact: true }).fill(`1d${sides}`);
      await dice
        .getByLabel("Advantage", { exact: true })
        .selectOption(String(advantage));
      await page.evaluate(
        ({ values, base }) => {
          const original = Math.random;
          let index = 0;
          Math.random = () =>
            index < values.length ? (values[index++] - 0.5) / base : original();
        },
        { values, base },
      );
      await dice.getByRole("button", { name: /^Roll dice/ }).click();
      await expect(dice.locator(".result-total")).toHaveText(
        advantage > 0 ? "24" : "13",
      );
      await expect(dice.locator(".die-result")).toHaveCount(3);
      await expect(dice.locator(".die-result.dropped")).toHaveCount(1);
      await expect(dice.locator(".die-result:not(.dropped)")).toHaveText(
        (advantage > 0 ? [2, 4] : [1, 3]).map((value) => `${value}d${base}`),
      );
    }
  }
  await saved(page);
  await disconnect(context);
  await page.reload();
  await expect(dice.locator(".result-total")).toHaveText("13");
  await expect(dice.locator(".die-result")).toHaveCount(3);
  await expect(dice.locator(".die-result.dropped")).toHaveCount(1);
});
test("dice and combat survive reload and campaign switching", async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel("Dice formula", { exact: true }).fill("2d6+3");
  await page.getByRole("button", { name: "Roll dice" }).click();
  await expect(page.locator(".result-total")).toHaveText(/\d+/);
  const total = await page.locator(".result-total").textContent();
  await combatant(page, "Mira", "18");
  await combatant(page, "Goblin", "7");
  await page.getByRole("button", { name: "Begin combat" }).click();
  await page.getByRole("button", { name: "Damage Mira", exact: true }).click();
  await page.getByRole("button", { name: "Next turn" }).click();
  await saved(page);
  await page.reload();
  await expect(page.locator(".is-active .combatant-name")).toContainText(
    "Goblin",
  );
  await expect(
    page.getByRole("button", { name: "Set HP for Mira" }),
  ).toHaveText("19/20");
  await expect(page.locator(".result-total")).toHaveText(total!);
  await page
    .getByRole("button", { name: "Switch campaign: My Campaign" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("New campaign", { exact: true })
    .fill("Another table");
  await dialog.getByRole("button", { name: "Create campaign" }).click();
  await expect(page.locator(".combatant")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Switch campaign: Another table" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "My Campaign", exact: true })
    .click();
  await expect(page.locator(".combatant")).toHaveCount(2);
});
test("grid spans, overlap protection and removed tool recovery", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Arrange", exact: true }).click();
  await page
    .getByRole("button", { name: "Drag Dice roller", exact: true })
    .press("ArrowLeft");
  await expect(
    page.getByRole("region", { name: "Dice roller", exact: true }),
  ).toHaveCSS("grid-column-start", "7");
  await resizeWidget(page, "Dice roller", 4, 4);
  let dialog;
  await expect(
    page.getByRole("region", { name: "Dice roller", exact: true }),
  ).toHaveCSS("grid-row-end", "span 4");
  await page
    .getByRole("button", { name: "Remove Dice roller from screen" })
    .click();
  await openWidgetPicker(page);
  dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Dice roller · 0 rolls" }).click();
  await expect(
    page.getByRole("textbox", { name: "Dice formula", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "12 × 8 grid" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Columns", { exact: true }).fill("4");
  await dialog.getByRole("button", { name: "Save grid" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Move or resize");
  await dialog.getByLabel("Columns", { exact: true }).fill("14");
  await dialog.getByRole("button", { name: "Save grid" }).click();
  await saved(page);
  await page.reload();
  await expect(page.getByRole("button", { name: "14 × 8 grid" })).toBeVisible();
});
test("offline production reload keeps tools usable", async ({
  page,
  context,
}) => {
  await ready(page);
  await expect(
    page.getByText("Ready for offline play", { exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await saved(page);
  await page.reload();
  await disconnect(context);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Dice roller", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Roll dice" }).click();
  await expect(page.locator(".result-total")).toHaveText(/\d+/);
  await combatant(page, "Offline hero", "10");
  await saved(page);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Edit Offline hero" }),
  ).toBeVisible();
});
test("die buttons increment matching counts and the eraser preserves roll history", async ({
  page,
}) => {
  await ready(page);
  const dice = page.getByRole("region", { name: "Dice roller", exact: true });
  const formula = dice.getByRole("textbox", {
    name: "Dice formula",
    exact: true,
  });
  const clear = dice.getByRole("button", {
    name: "Clear dice formula",
    exact: true,
  });
  await dice.getByRole("button", { name: "d6", exact: true }).click();
  await expect(formula).toHaveValue("1d20 + 1d6");
  await dice.getByRole("button", { name: /^Roll dice/ }).click();
  await expect(dice.locator(".result-total")).toHaveText(/\d+/);
  const total = await dice.locator(".result-total").textContent();
  await clear.click();
  await expect(formula).toHaveValue("");
  await expect(formula).toBeFocused();
  await expect(dice.locator(".result-total")).toHaveText(total!);
  await expect(dice.locator(".history-row")).toHaveCount(1);
  let expected = "";
  for (const sides of [4, 6, 8, 10, 12, 20, 100]) {
    await dice.getByRole("button", { name: `d${sides}`, exact: true }).click();
    expected += `${expected ? " + " : ""}1d${sides}`;
    await expect(formula).toHaveValue(expected);
  }
  await dice.getByRole("button", { name: "d6", exact: true }).click();
  await expect(formula).toHaveValue(expected.replace("1d6", "2d6"));
  await formula.fill("1d8 + 3");
  await dice.getByRole("button", { name: "d8", exact: true }).click();
  await expect(formula).toHaveValue("2d8 + 3");
  await dice.getByRole("button", { name: "d8", exact: true }).click();
  await expect(formula).toHaveValue("3d8 + 3");
  await formula.fill("2d8! + 3");
  await dice.getByRole("button", { name: "d6", exact: true }).click();
  await expect(formula).toHaveValue("2d8! + 3 + 1d6");
  for (const operator of ["+", "-", "*", "/", "("]) {
    await formula.fill(`1d8 ${operator} `);
    await dice.getByRole("button", { name: "d4", exact: true }).click();
    await expect(formula).toHaveValue(`1d8 ${operator} 1d4`);
  }
  await formula.fill("1".repeat(1000));
  await dice.getByRole("button", { name: "d6", exact: true }).click();
  await expect(formula).toHaveValue("1".repeat(1000));
  await expect(dice.getByRole("alert")).toContainText("formula is full");
  await clear.click();
  await expect(dice.getByRole("alert")).toHaveCount(0);
  await saved(page);
  await page.reload();
  await expect(formula).toHaveValue("");
  await expect(dice.locator(".history-row")).toHaveCount(1);
});

test("dark theme, presets and narrow-screen grid", async ({
  page,
  context,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Dice formula", { exact: true }).fill("1d8+2");
  await page
    .getByRole("combobox", { name: "Advantage", exact: true })
    .selectOption("2");
  await page.getByText("Roll options & notation", { exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Exploding criticals", exact: true })
    .check();
  await page.getByRole("button", { name: "Save roll preset" }).click();
  await page.getByLabel("Preset name").fill("Sword");
  await page.getByRole("button", { name: "Save preset", exact: true }).click();
  await page
    .getByRole("button", { name: "Clear dice formula", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Advantage", exact: true })
    .selectOption("0");
  await page
    .getByRole("checkbox", { name: "Exploding criticals", exact: true })
    .uncheck();
  await saved(page);
  await expect(
    page.getByText("Ready for offline play", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await disconnect(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page
    .getByRole("button", { name: "Expand Dice roller", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Sword", exact: true }),
  ).toBeAttached();
  const expanded = page.getByRole("dialog", {
    name: "Dice roller",
    exact: true,
  });
  await expanded.getByRole("button", { name: "Sword", exact: true }).click();
  await expect(
    expanded.getByRole("textbox", { name: "Dice formula", exact: true }),
  ).toHaveValue("1d8+2");
  await expect(
    expanded.getByRole("combobox", { name: "Advantage", exact: true }),
  ).toHaveValue("2");
  await expanded.getByText("Roll options & notation", { exact: true }).click();
  await expect(
    expanded.getByRole("checkbox", {
      name: "Exploding criticals",
      exact: true,
    }),
  ).toBeChecked();
  await expect(expanded.locator(".result-total")).toHaveCount(0);
  await expanded.getByRole("button", { name: "d8", exact: true }).click();
  await expect(
    expanded.getByRole("textbox", { name: "Dice formula", exact: true }),
  ).toHaveValue("2d8+2");
  await expanded.getByRole("button", { name: "d6", exact: true }).click();
  await expect(
    expanded.getByRole("textbox", { name: "Dice formula", exact: true }),
  ).toHaveValue("2d8+2 + 1d6");
  await expanded
    .getByRole("button", { name: "Clear dice formula", exact: true })
    .click();
  await expect(
    expanded.getByRole("textbox", { name: "Dice formula", exact: true }),
  ).toHaveValue("");
  await expect(
    expanded.getByRole("button", { name: "Sword", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "test-results/slate-mobile.png",
    fullPage: true,
  });
});

test("pointer drag and resize snap to grid cells", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await ready(page);
  await page.getByRole("button", { name: "Arrange", exact: true }).click();
  await resizeWidget(page, "Dice roller", 4, 4);
  const firstCell = await page
    .getByRole("button", {
      name: "Add widget at column 12, row 1",
      exact: true,
    })
    .boundingBox();
  const secondCell = await page
    .getByRole("button", {
      name: "Add widget at column 12, row 2",
      exact: true,
    })
    .boundingBox();
  if (!firstCell || !secondCell) throw new Error("Missing grid cells");
  const rowStep = secondCell.y - firstCell.y;
  const grip = await page
    .getByRole("button", { name: "Drag Dice roller" })
    .boundingBox();
  if (!grip) throw new Error("Missing drag handle");
  const card = page.getByRole("region", { name: "Dice roller", exact: true });
  await page.mouse.move(grip.x + 12, grip.y + 12);
  await page.mouse.down();
  await page.mouse.move(grip.x + 12, grip.y + 20);
  // Wait for sensor activation before completing the synthetic gesture.
  await expect(card).toHaveClass(/dragging/);
  await page.mouse.move(grip.x + 12, grip.y + 12 + rowStep, { steps: 8 });
  await page.mouse.up();
  await expect(card).toHaveCSS("grid-row-start", "2");
  const handle = await page
    .getByRole("button", {
      name: "Resize Dice roller",
    })
    .boundingBox();
  if (!handle) throw new Error("Missing resize handle");
  await page.mouse.move(handle.x + 12, handle.y + 12);
  await page.mouse.down();
  await page.mouse.move(handle.x + 12, handle.y + 12 + rowStep, { steps: 8 });
  await page.mouse.up();
  await expect(card).toHaveCSS("grid-row-end", "span 5");
  await saved(page);
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Dice roller", exact: true }),
  ).toHaveCSS("grid-row-start", "2");
});

test("desktop screen renders with a live encounter", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await ready(page);
  await combatant(page, "Mira Ashwood", "18");
  await combatant(page, "Thorn", "14");
  await combatant(page, "Goblin scout", "9");
  await page.getByRole("button", { name: "Begin combat" }).click();
  await page.getByRole("button", { name: "Roll dice" }).click();
  await saved(page);
  await page.screenshot({
    path: "test-results/slate-desktop.png",
    fullPage: true,
  });
});

test("expanded tools have unique input labels and share their saved state", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Expand Dice roller" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Dice formula", { exact: true }).fill("1d6+7");
  await dialog.getByRole("button", { name: "Roll dice" }).click();
  await expect(dialog.locator(".result-total")).toHaveText(/\d+/);
  expect(
    await page.evaluate(() => {
      const ids = Array.from(
        document.querySelectorAll("[id]"),
        (node) => node.id,
      );
      return ids.length === new Set(ids).size;
    }),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.getByLabel("Dice formula", { exact: true })).toHaveValue(
    "1d6+7",
  );
});
