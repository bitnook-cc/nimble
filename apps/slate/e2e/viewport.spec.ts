import { test, slateURL, disconnect } from "./browser-fixtures";
import { resizeWidget } from "./ui-fixtures";
import { expect, type Page } from "@playwright/test";
import { ready, saved } from "./ui-fixtures";

async function configure(page: Page, columns: number, rows: number) {
  await page.getByRole("button", { name: /grid$/ }).click();
  const dialog = page.getByRole("dialog", {
    name: "Configure your grid",
    exact: true,
  });
  await expect(dialog.getByRole("spinbutton")).toHaveCount(2);
  await dialog.getByLabel("Columns", { exact: true }).fill(String(columns));
  await dialog.getByLabel("Rows", { exact: true }).fill(String(rows));
  await dialog.getByRole("button", { name: "Save grid", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await saved(page);
}

async function fitsViewport(page: Page, columns: number, rows: number) {
  const dimensions = await page.evaluate(() => {
    const main = document.querySelector("main")!;
    const board = document.querySelector(".board")!;
    const toolbar = document.querySelector(".app-toolbar")!;
    const rect = board.getBoundingClientRect();
    const style = getComputedStyle(main);
    const grid = getComputedStyle(board);
    return {
      width: innerWidth,
      height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      paddingX: parseFloat(style.paddingLeft),
      paddingY: parseFloat(style.paddingTop),
      toolbarBottom: toolbar.getBoundingClientRect().bottom,
      columns: grid.gridTemplateColumns.split(" ").length,
      rows: grid.gridTemplateRows.split(" ").length,
      cellsInside: Array.from(board.children).every((child) => {
        const cell = child.getBoundingClientRect();
        return (
          cell.left >= rect.left - 1 &&
          cell.top >= rect.top - 1 &&
          cell.right <= rect.right + 1 &&
          cell.bottom <= rect.bottom + 1
        );
      }),
    };
  });
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
  expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.height);
  expect(dimensions.left).toBeCloseTo(dimensions.paddingX, 0);
  expect(dimensions.top).toBeCloseTo(
    dimensions.toolbarBottom + dimensions.paddingY,
    0,
  );
  expect(dimensions.right).toBeCloseTo(
    dimensions.width - dimensions.paddingX,
    0,
  );
  expect(dimensions.bottom).toBeCloseTo(
    dimensions.height - dimensions.paddingY,
    0,
  );
  expect(dimensions.columns).toBe(columns);
  expect(dimensions.rows).toBe(rows);
  expect(dimensions.cellsInside).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.goto(slateURL(page));
  await ready(page);
});

test("the entire grid fits desktop, portrait, and landscape at every resolution", async ({
  page,
}) => {
  for (const resolution of [
    [12, 8],
    [16, 12],
    [24, 30],
  ]) {
    const [columns, rows] = resolution;
    await configure(page, columns, rows);
    for (const viewport of [
      { width: 1920, height: 1080 },
      { width: 1280, height: 900 },
      { width: 1000, height: 600 },
      { width: 390, height: 844 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      await fitsViewport(page, columns, rows);
      await page.getByRole("button", { name: "Arrange", exact: true }).click();
      await fitsViewport(page, columns, rows);
      await page
        .getByRole("button", { name: "Done arranging", exact: true })
        .click();
    }
  }
  await page.reload();
  await ready(page);
  await fitsViewport(page, 24, 30);
});

test("dragging and resizing use the scaled cells after a viewport and resolution change", async ({
  page,
  context,
}) => {
  await configure(page, 16, 12);
  await page.setViewportSize({ width: 1000, height: 700 });
  await page.getByRole("button", { name: "Arrange", exact: true }).click();
  const first = await page
    .getByRole("button", {
      name: "Add widget at column 16, row 1",
      exact: true,
    })
    .boundingBox();
  const second = await page
    .getByRole("button", {
      name: "Add widget at column 16, row 2",
      exact: true,
    })
    .boundingBox();
  if (!first || !second) throw new Error("Missing cells");
  const step = second.y - first.y;
  const grip = await page
    .getByRole("button", { name: "Drag Dice roller", exact: true })
    .boundingBox();
  if (!grip) throw new Error("Missing grip");
  const dice = page.getByRole("region", { name: "Dice roller", exact: true });
  await page.mouse.move(grip.x + 12, grip.y + 12);
  await page.mouse.down();
  await page.mouse.move(grip.x + 12, grip.y + 20);
  await expect(dice).toHaveClass(/dragging/);
  await page.mouse.move(grip.x + 12, grip.y + 12 + step, { steps: 8 });
  await page.mouse.up();
  await expect(dice).toHaveCSS("grid-row-start", "2");
  const handle = await page
    .getByRole("button", {
      name: "Resize Dice roller",
      exact: true,
    })
    .boundingBox();
  if (!handle) throw new Error("Missing resize handle");
  await page.mouse.move(handle.x + 12, handle.y + 12);
  await page.mouse.down();
  await page.mouse.move(handle.x + 12, handle.y + 12 + step, { steps: 8 });
  await page.mouse.up();
  await expect(dice).toHaveCSS("grid-row-end", "span 6");
  await page
    .getByRole("button", { name: "Undo layout change", exact: true })
    .click();
  await expect(dice).toHaveCSS("grid-row-end", "span 5");
  await page
    .getByRole("button", { name: "Redo layout change", exact: true })
    .click();
  await expect(dice).toHaveCSS("grid-row-end", "span 6");
  await saved(page);
  await page.reload();
  await ready(page);
  await disconnect(context);
  await page.reload();
  await ready(page);
  await expect(dice).toHaveCSS("grid-row-start", "2");
  await expect(dice).toHaveCSS("grid-row-end", "span 6");
  await fitsViewport(page, 16, 12);
});

test("overflow scrolls inside widgets and the status popover reserves no grid space", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  for (let i = 1; i <= 8; i++) {
    await page
      .getByRole("button", { name: "Add combatant", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Add combatant",
      exact: true,
    });
    await dialog.getByLabel("Name", { exact: true }).fill("Guard " + i);
    await dialog
      .getByRole("button", { name: "Add combatant", exact: true })
      .click();
  }
  const content = page
    .getByRole("region", { name: "Initiative tracker", exact: true })
    .locator(".widget-content");
  await content.hover();
  await page.mouse.wheel(0, 450);
  await expect
    .poll(() => content.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  const board = page.locator(".board");
  const before = await board.boundingBox();
  await page
    .getByRole("button", { name: "Workspace status", exact: true })
    .click();
  const status = page.getByRole("region", {
    name: "Workspace status details",
    exact: true,
  });
  await expect(status).toBeVisible();
  await expect(status).toContainText("cached for offline play");
  expect(await board.boundingBox()).toEqual(before);
  await page.keyboard.press("Escape");
  await expect(status).not.toBeVisible();
  await page.getByRole("button", { name: "Arrange", exact: true }).click();
  await page
    .getByRole("button", { name: "Workspace status", exact: true })
    .click();
  await expect(status).toContainText("Drag a widget by its grip");
  await fitsViewport(page, 12, 8);
});

test("widget menus at the bottom edge keep removal accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByRole("button", { name: "Arrange", exact: true }).click();
  await resizeWidget(page, "Dice roller", 4, 4);
  const grip = page.getByRole("button", {
    name: "Arrange Dice roller",
    exact: true,
  });
  for (let i = 0; i < 4; i++) await grip.press("ArrowDown");
  await page
    .getByRole("button", { name: "Done arranging", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Widget menu Dice roller", exact: true })
    .click();
  const menu = page.getByRole("group", {
    name: "Dice roller actions",
    exact: true,
  });
  const bounds = await menu.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(390);
  await menu
    .getByRole("button", { name: "Remove from screen", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Dice roller", exact: true }),
  ).toHaveCount(0);
});
