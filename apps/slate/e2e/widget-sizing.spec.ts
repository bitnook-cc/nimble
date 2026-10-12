import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ready, saved, appearance } from "./ui-fixtures";
import { resizeWidget } from "./ui-fixtures";

test.use({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await ready(page);
});

test("empty cells are the widget entry point in play and Arrange mode", async ({
  page,
  context,
}) => {
  await expect(
    page.getByRole("button", { name: "Add widget", exact: true }),
  ).toHaveCount(0);
  const corner = page.getByRole("button", {
    name: "Add widget at column 12, row 8",
    exact: true,
  });
  await corner.click();
  const picker = page.getByRole("dialog", {
    name: "Add a widget",
    exact: true,
  });
  await expect(picker).toContainText("Start at column 12, row 8.");
  await page.keyboard.press("Escape");
  await expect(corner).toBeFocused();
  await page.getByRole("button", { name: "Arrange", exact: true }).click();
  await corner.click();
  await picker.getByRole("button", { name: /^Notes Markdown notes/ }).click();
  const note = page.getByRole("region", { name: "Notes", exact: true });
  await expect(note).toHaveCSS("grid-column-start", "12");
  await expect(note).toHaveCSS("grid-row-start", "8");
  await expect(note).toHaveCSS("grid-column-end", "span 1");
  await expect(note).toHaveCSS("grid-row-end", "span 1");
  await expect(note).toHaveAttribute("data-placeholder", "true");
  await note
    .getByRole("button", { name: "Arrange Notes", exact: true })
    .press("ArrowLeft");
  await expect(note).toHaveCSS("grid-column-start", "11");
  await page
    .getByRole("button", { name: "Done arranging", exact: true })
    .click();
  await note.getByRole("button", { name: "Expand Notes", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Notes", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await saved(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await expect(note).toHaveCSS("grid-column-start", "11");
});
const dice = (page: Page) =>
  page.getByRole("region", { name: "Dice roller", exact: true });
async function place(page: Page, width: number, height: number) {
  await resizeWidget(page, "Dice roller", width, height);
  await page
    .getByRole("button", { name: "Done arranging", exact: true })
    .click();
}
test("a one-cell placement preserves its tool through expansion, offline reload and restoration", async ({
  page,
  context,
}) => {
  const tile = dice(page);
  await tile
    .getByRole("textbox", { name: "Dice formula", exact: true })
    .fill("2d6 + 3");
  await place(page, 1, 1);
  await expect(tile).toHaveAttribute("data-placeholder", "true");
  await expect(tile.locator(".widget-content")).toBeHidden();
  await expect(
    tile.getByRole("button", { name: "Expand Dice roller", exact: true }),
  ).toBeVisible();
  await tile
    .getByRole("button", { name: "Expand Dice roller", exact: true })
    .click();
  const expanded = page.getByRole("dialog", {
    name: "Dice roller",
    exact: true,
  });
  await expect(
    expanded.getByRole("textbox", { name: "Dice formula", exact: true }),
  ).toHaveValue("2d6 + 3");
  await expanded
    .getByRole("textbox", { name: "Dice formula", exact: true })
    .fill("1d20 + 5");
  await expanded
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(
    tile.getByRole("button", { name: "Expand Dice roller", exact: true }),
  ).toBeFocused();
  await saved(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await expect(tile).toHaveCSS("grid-column-end", "span 1");
  await expect(tile).toHaveCSS("grid-row-end", "span 1");
  await expect(tile).toHaveAttribute("data-placeholder", "true");
  await place(page, 3, 4);
  await expect(tile).not.toHaveAttribute("data-placeholder");
  await expect(
    tile.getByRole("textbox", { name: "Dice formula", exact: true }),
  ).toHaveValue("1d20 + 5");
});
test("pixel width and height independently switch placeholders without changing grid spans", async ({
  page,
}) => {
  const tile = dice(page);
  await expect(tile).not.toHaveAttribute("data-placeholder");
  await page.setViewportSize({ width: 800, height: 900 });
  await expect(tile).toHaveAttribute("data-placeholder", "true");
  expect((await tile.boundingBox())!.width).toBeLessThan(280);
  await page.setViewportSize({ width: 1280, height: 480 });
  await expect(tile).toHaveAttribute("data-placeholder", "true");
  expect((await tile.boundingBox())!.width).toBeGreaterThan(280);
  expect((await tile.boundingBox())!.height).toBeLessThan(300);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(tile).not.toHaveAttribute("data-placeholder");
  await expect(tile).toHaveCSS("grid-column-end", "span 4");
  await expect(tile).toHaveCSS("grid-row-end", "span 5");
  await page.getByRole("button", { name: /grid$/ }).click();
  const grid = page.getByRole("dialog", {
    name: "Configure your grid",
    exact: true,
  });
  await grid.getByLabel("Columns", { exact: true }).fill("24");
  await grid.getByLabel("Rows", { exact: true }).fill("30");
  await grid.getByRole("button", { name: "Save grid", exact: true }).click();
  await expect(tile).toHaveAttribute("data-placeholder", "true");
});
test("placeholder tiles fit the phone grid and remain accessible in light and dark themes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const mode of ["Light", "Dark"] as const) {
    await appearance(page, mode);
    await expect(dice(page)).toHaveAttribute("data-placeholder", "true");
    await expect(
      page.getByRole("main", { name: "GM screen" }),
    ).toHaveScreenshot(`widget-placeholders-${mode.toLowerCase()}.png`);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    }));
    expect(dimensions.width).toBeLessThanOrEqual(390);
    expect(dimensions.height).toBeLessThanOrEqual(844);
  }
});

test("an open combatant editor survives a viewport shrink into a placeholder", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Add combatant", exact: true })
    .click();
  const editor = page.getByRole("dialog", {
    name: "Add combatant",
    exact: true,
  });
  await editor.getByLabel("Name", { exact: true }).fill("A saved guard");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("region", { name: "Initiative tracker", exact: true }),
  ).toHaveAttribute("data-placeholder", "true");
  await expect(editor).toBeVisible();
  await expect(editor.getByLabel("Name", { exact: true })).toHaveValue(
    "A saved guard",
  );
  await editor
    .getByRole("button", { name: "Add combatant", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Expand Initiative tracker", exact: true })
    .click();
  const expanded = page.getByRole("dialog", {
    name: "Initiative tracker",
    exact: true,
  });
  await expect(
    expanded.getByRole("button", { name: "Edit A saved guard", exact: true }),
  ).toBeVisible();
});
