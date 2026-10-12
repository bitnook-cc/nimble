import { openWidgetPicker } from "./ui-fixtures";
import { expect, test, type Page } from "@playwright/test";
async function ready(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("main", { name: "GM screen" })).toBeVisible();
}
async function saved(page: Page) {
  await expect(
    page.getByRole("status").filter({ hasText: "Saved on this device" }),
  ).toBeVisible();
}
const tabs = (page: Page) =>
  page.getByRole("tablist", { name: "Campaign screens", exact: true });
async function selectedScreen(page: Page) {
  if (await tabs(page).count())
    return (await tabs(page)
      .getByRole("tab", { selected: true })
      .getAttribute("data-screen"))!;
  return page
    .getByRole("combobox", { name: "Current screen", exact: true })
    .inputValue();
}
async function selectScreen(page: Page, id: string) {
  if (await tabs(page).count())
    await tabs(page).locator(`[data-screen="${id}"]`).click();
  else
    await page
      .getByRole("combobox", { name: "Current screen", exact: true })
      .selectOption(id);
}
async function create(page: Page, name: string, preset = "blank") {
  await page
    .getByRole("button", { name: "Manage screens", exact: true })
    .click();
  await page.getByLabel("New screen name", { exact: true }).fill(name);
  await page
    .getByRole("combobox", { name: "Layout preset", exact: true })
    .selectOption(preset);
  await page
    .getByRole("button", { name: "Create screen", exact: true })
    .click();
}
test("screens share saved tools, remember selection and preserve expanded views with visible grid content", async ({
  page,
}) => {
  await ready(page);
  const first = await selectedScreen(page);
  await page.getByLabel("Dice formula", { exact: true }).fill("2d6+7");
  await page.getByRole("button", { name: "Roll dice" }).click();
  const total = await page.locator(".result-total").textContent();
  await page
    .getByRole("button", { name: "Manage screens", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Duplicate screen", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  const second = await selectedScreen(page);
  expect(second).not.toBe(first);
  await expect(page.locator(".result-total")).toHaveText(total!);
  await page.getByLabel("Dice formula", { exact: true }).fill("1d8+12");
  await expect(page.getByLabel("Dice formula", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Expand Dice roller", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("Dice formula", { exact: true }),
  ).toHaveValue("1d8+12");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await saved(page);
  await page.reload();
  await expect.poll(() => selectedScreen(page)).toBe(second);
  await expect(page.getByLabel("Dice formula", { exact: true })).toBeVisible();
  await selectScreen(page, first);
  await expect(page.getByLabel("Dice formula", { exact: true })).toHaveValue(
    "1d8+12",
  );
  await expect(page.locator(".result-total")).toHaveText(total!);
});
test("catalogue search links existing tools and layout undo is independent of dice state", async ({
  page,
}) => {
  await ready(page);
  const first = await selectedScreen(page);
  await create(page, "Exploration");
  await openWidgetPicker(page);
  await page.getByLabel("Search widgets").fill("not a tool");
  await expect(
    page.getByText("No matching tools.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Search widgets").fill("dice");
  await page.getByRole("button", { name: "Saved tools", exact: true }).click();
  await page.getByRole("button", { name: /Dice roller · 0 rolls/ }).click();
  await page.getByLabel("Dice formula", { exact: true }).fill("1d6+99");
  await page.getByRole("button", { name: "Roll dice" }).click();
  const result = await page.locator(".result-total").textContent();
  await page.getByRole("button", { name: "Arrange", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Remove Dice roller from screen",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Undo layout change", exact: true })
    .click();
  await expect(page.locator(".result-total")).toHaveText(result!);
  await page
    .getByRole("button", { name: "Redo layout change", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Dice roller", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Undo layout change", exact: true })
    .click();
  await saved(page);
  await page.reload();
  await expect(page.locator(".result-total")).toHaveText(result!);
  await selectScreen(page, first);
  await expect(page.locator(".result-total")).toHaveText(result!);
});
test("custom presets create fresh tools and removed widgets can be replaced with saved content", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Roll dice" }).click();
  await page
    .getByRole("button", { name: "Manage screens", exact: true })
    .click();
  await page
    .getByLabel("Save current layout as preset", { exact: true })
    .fill("My table");
  await page
    .getByRole("button", { name: "Save layout preset", exact: true })
    .click();
  await page.getByLabel("New screen name", { exact: true }).fill("Town");
  await page
    .getByRole("combobox", { name: "Layout preset", exact: true })
    .selectOption({ label: "My table" });
  await page
    .getByRole("button", { name: "Create screen", exact: true })
    .click();
  await expect(page.locator(".result-total")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Widget menu Dice roller", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove from screen", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Dice roller", exact: true }),
  ).toHaveCount(0);
  await openWidgetPicker(page);
  const picker = page.getByRole("dialog", {
    name: "Add a widget",
    exact: true,
  });
  await picker
    .getByRole("button", { name: "Saved tools", exact: true })
    .click();
  await picker.getByRole("button", { name: /Dice roller · 1 rolls/ }).click();
  await page
    .getByRole("region", { name: "Dice roller", exact: true })
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  await page.getByLabel("Tool name", { exact: true }).fill("Shared rolls");
  await page.getByRole("button", { name: "Save tool", exact: true }).click();
  await expect(page.locator(".result-total")).toHaveText(/\d+/);
  await expect(
    page.getByRole("heading", { name: "Shared rolls", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Manage screens", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete screen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm delete screen", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Shared rolls", exact: true }),
  ).toBeVisible();
});
test("screen controls fit a narrow viewport and keyboard placement persists offline", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await expect(
    page.getByText("Ready for offline play", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await context.setOffline(true);
  await create(page, "Mobile dice", "dice-table");
  await page.getByRole("button", { name: "Arrange", exact: true }).click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight),
  ).toBeLessThanOrEqual(844);
  await page
    .getByRole("button", { name: "Arrange Dice roller", exact: true })
    .press("ArrowRight");
  await saved(page);
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Dice roller", exact: true }),
  ).toHaveCSS("grid-column-start", "2");
  await page.screenshot({
    path: "test-results/slate-screens-mobile.png",
    fullPage: true,
  });
});

test("screen tabs support keyboard navigation and become a dropdown without losing selection or focus", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await create(page, "Exploration");
  await create(page, "Combat");
  await expect(tabs(page).getByRole("tab")).toHaveText([
    "Session screen",
    "Exploration",
    "Combat",
  ]);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".screen-picker")).toHaveScreenshot(
    "screen-tabs.png",
  );
  const selected = tabs(page).getByRole("tab", { selected: true });
  await selected.focus();
  await selected.press("ArrowLeft");
  await expect(selected).toHaveText("Exploration");
  await expect(selected).toBeFocused();
  await expect(
    page.getByRole("tabpanel", { name: "Exploration", exact: true }),
  ).toBeVisible();
  await selected.press("Home");
  await expect(selected).toHaveText("Session screen");
  await expect(page.getByLabel("Dice formula", { exact: true })).toBeVisible();
  await selected.press("ArrowLeft");
  await expect(selected).toHaveText("Combat");
  await selected.press("ArrowRight");
  await expect(selected).toHaveText("Session screen");
  await selected.press("End");
  const id = await selectedScreen(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const dropdown = page.getByRole("combobox", {
    name: "Current screen",
    exact: true,
  });
  await expect(tabs(page)).toHaveCount(0);
  await expect(dropdown).toHaveValue(id);
  await expect(dropdown).toBeFocused();
  await dropdown.selectOption({ label: "Exploration" });
  await expect(page.locator(".screen-picker")).toHaveScreenshot(
    "screen-dropdown-mobile.png",
  );
  await expect(
    page.getByRole("tabpanel", { name: "Exploration", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(dropdown).toHaveCount(0);
  await expect(selected).toHaveText("Exploration");
  await expect(selected).toBeFocused();
  await saved(page);
  await expect(
    page.getByText("Ready for offline play", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(tabs(page).getByRole("tab", { selected: true })).toHaveText(
    "Exploration",
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(1440);
});

test("long screen names fall back on a wide viewport and renaming restores tabs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await ready(page);
  const longName = "W".repeat(80);
  await create(page, longName);
  const dropdown = page.getByRole("combobox", {
    name: "Current screen",
    exact: true,
  });
  await expect(dropdown).toBeVisible();
  await expect(tabs(page)).toHaveCount(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(1280);
  await page
    .getByRole("button", { name: "Manage screens", exact: true })
    .click();
  await page.getByLabel("Screen name", { exact: true }).fill("Town");
  await page
    .getByRole("button", { name: "Rename screen", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(tabs(page).getByRole("tab", { selected: true })).toHaveText(
    "Town",
  );
  await expect(dropdown).toHaveCount(0);
  await page
    .getByRole("button", { name: "Manage screens", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Move screen Town up", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(tabs(page).getByRole("tab")).toHaveText([
    "Town",
    "Session screen",
  ]);
});
