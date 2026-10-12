import { resizeWidget } from "./ui-fixtures";
import { openWidgetPicker } from "./ui-fixtures";
import { expect, test } from "@playwright/test";
import {
  appearance,
  encounter,
  expectAria,
  library,
  neutralDashboard,
  ready,
  saved,
} from "./ui-fixtures";

test.use({
  viewport: { width: 1280, height: 900 },
  locale: "en-GB",
  timezoneId: "UTC",
  colorScheme: "light",
  reducedMotion: "reduce",
  deviceScaleFactor: 1,
});

const errors = new WeakMap<object, string[]>();
test.beforeEach(async ({ page }) => {
  const caught: string[] = [];
  errors.set(page, caught);
  page.on("pageerror", (error) => caught.push(error.message));
  // Keep the real dice engine and persistence. Only entropy and wall-clock time
  // are fixed; timers, service workers and IndexedDB transactions run normally.
  await page.clock.setFixedTime(new Date("2026-10-11T12:00:00Z"));
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await page.goto("/");
  await ready(page);
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page), "UI must not throw uncaught browser errors").toEqual(
    [],
  );
});

test("first launch exposes the compact dashboard and default campaign", async ({
  page,
}) => {
  await expect(
    page
      .getByRole("tablist", { name: "Campaign screens", exact: true })
      .getByRole("tab", {
        name: "Session screen",
        selected: true,
        exact: true,
      }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Initiative tracker", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Dice roller", exact: true }),
  ).toBeVisible();
  await expectAria(page.getByRole("banner"), "toolbar.aria.yml");
  await expect(page).toHaveScreenshot("dashboard-light.png");
});

for (const mode of ["Light", "Dark"] as const) {
  test(`combat and dice UI in ${mode.toLowerCase()} mode survives an offline reload`, async ({
    page,
    context,
  }) => {
    await appearance(page, mode);
    await encounter(page);
    const combat = page.getByRole("region", {
      name: "Initiative tracker",
      exact: true,
    });
    const dice = page.getByRole("region", { name: "Dice roller", exact: true });
    await expect(
      combat.getByRole("button", { name: "Set HP for Mira", exact: true }),
    ).toHaveText("19/20");
    await expectAria(combat, "combat-active.aria.yml");
    await expectAria(dice, "dice-result.aria.yml");
    await neutralDashboard(page);
    await expect(page).toHaveScreenshot(`encounter-${mode.toLowerCase()}.png`);
    // Acquire the worker controller before disabling the network.
    await page.reload();
    await ready(page);
    await context.setOffline(true);
    await page.reload();
    await ready(page);
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      mode.toLowerCase(),
    );
    await expectAria(combat, "combat-active.aria.yml");
    await expectAria(dice, "dice-result.aria.yml");
    await neutralDashboard(page);
    await expect(page).toHaveScreenshot(`encounter-${mode.toLowerCase()}.png`);
    await page.getByRole("button", { name: "Next turn", exact: true }).click();
    await expect(combat.locator(".is-active")).toContainText("Gatekeeper");
    await saved(page);
  });
}

test("placement UI reports collisions and resizing is undoable and persistent", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Arrange", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add widget", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Position and size/ }),
  ).toHaveCount(0);
  const grip = page.getByRole("button", {
    name: "Drag Dice roller",
    exact: true,
  });
  await grip.press("ArrowLeft");
  await expect(
    page.getByRole("region", { name: "Dice roller", exact: true }),
  ).toHaveCSS("grid-column-start", "7");
  await expect(
    page.getByRole("status").filter({ hasText: "Cannot place there" }),
  ).toContainText("Cannot place there");
  await resizeWidget(page, "Dice roller", 4, 4);
  const dice = page.getByRole("region", { name: "Dice roller", exact: true });
  await expect(dice).toHaveCSS("grid-row-end", "span 4");
  await page
    .getByRole("button", { name: "Undo layout change", exact: true })
    .click();
  await expect(dice).toHaveCSS("grid-row-end", "span 5");
  await page
    .getByRole("button", { name: "Redo layout change", exact: true })
    .click();
  await expect(dice).toHaveCSS("grid-row-end", "span 4");
  await saved(page);
  await expect(page).toHaveScreenshot("dashboard-arrange.png");
  await page.reload();
  await ready(page);
  await expect(dice).toHaveCSS("grid-row-end", "span 4");
});

test("Configure saves the shared tool name without a widget settings menu", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Widget menu Dice roller", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Widget settings", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("group", { name: "Dice roller actions", exact: true })
    .getByRole("button", { name: "Remove from screen", exact: true })
    .press("Escape");
  await page
    .getByRole("region", { name: "Dice roller", exact: true })
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("textbox", { name: "Tool name", exact: true })
    .fill("Travel rolls");
  await expectAria(dialog, "configure-dice.aria.yml");
  await expect(dialog).toHaveScreenshot("configure-dice.png");
  await dialog.getByRole("button", { name: "Save tool", exact: true }).click();
  await saved(page);
  await page.reload();
  await ready(page);
  await expect(
    page.getByRole("heading", { name: "Travel rolls", exact: true }),
  ).toBeVisible();
});

test("library filters spells, opens a preview and pins the result", async ({
  page,
}) => {
  const browse = await library(page, "Flame Dart");
  await browse
    .getByRole("combobox", { name: "Content type", exact: true })
    .selectOption("spell");
  await expect(browse.getByRole("status")).toHaveText(
    "1 results · available offline",
  );
  await expectAria(browse, "library-spell-search.aria.yml");
  await expect(browse).toHaveScreenshot("library-spell-search.png");
  await browse.getByRole("button", { name: /^Flame Dart spell/ }).click();
  const preview = page.getByRole("dialog", { name: "Flame Dart", exact: true });
  await expectAria(preview, "spell-preview.aria.yml");
  await expect(preview).toHaveScreenshot("spell-preview.png");
  await preview
    .getByRole("button", { name: "Pin to screen", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await saved(page);
  const pinned = page.getByRole("region", { name: "Flame Dart", exact: true });
  await expect(pinned).toContainText("1d10");
  await expectAria(pinned, "pinned-spell.aria.yml");
  await page.reload();
  await ready(page);
  await expectAria(pinned, "pinned-spell.aria.yml");
});

test("Markdown notes suggest keyboard references and render the saved note", async ({
  page,
}) => {
  await openWidgetPicker(page);
  await page.getByRole("button", { name: /^Notes Markdown notes/ }).click();
  await page.getByRole("button", { name: "Expand Notes", exact: true }).click();
  const expanded = page.getByRole("dialog", { name: "Notes", exact: true });
  const editor = expanded.getByRole("textbox", {
    name: "Note text",
    exact: true,
  });
  await editor.fill(
    "# Tonight\n\n- [ ] Open the northern gate\n- [ ] Check @Initiative",
  );
  const suggestions = expanded.getByRole("listbox", {
    name: "Reference suggestions",
    exact: true,
  });
  await expect(suggestions).toBeVisible();
  await expectAria(suggestions, "note-suggestions.aria.yml");
  await saved(page);
  await expect(expanded).toHaveScreenshot("note-reference-editor.png");
  await editor.press("Enter");
  await expect(editor).toHaveValue(/\[Initiative\]\(slate:/);
  await expanded
    .getByRole("button", { name: "Read note", exact: true })
    .click();
  await expect(
    expanded.getByRole("heading", { name: "Tonight", exact: true }),
  ).toBeVisible();
  await expectAria(expanded, "note-reading.aria.yml");
  await expect(expanded).toHaveScreenshot("note-reading.png");
  await expanded
    .getByRole("button", { name: "Initiative", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Initiative", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await saved(page);
  await page.reload();
  await ready(page);
  const note = page.getByRole("region", { name: "Notes", exact: true });
  await expect(
    note.getByRole("heading", { name: "Tonight", exact: true }),
  ).toBeVisible();
  await expect(
    note.getByRole("button", { name: "Initiative", exact: true }),
  ).toBeVisible();
});

test("rule diagrams load locally and retain their visual layout", async ({
  page,
}) => {
  await library(page, "Cones & Lines");
  await page.getByRole("button", { name: /^Cones & Lines rule/ }).click();
  const preview = page.getByRole("dialog", {
    name: "Cones & Lines",
    exact: true,
  });
  await expect(preview.getByRole("img")).toHaveCount(2);
  await expect
    .poll(() =>
      preview
        .getByRole("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              image instanceof HTMLImageElement &&
              image.complete &&
              image.naturalWidth > 0 &&
              image.src.startsWith("data:"),
          ),
        ),
    )
    .toBe(true);
  await expectAria(preview, "rule-diagrams.aria.yml");
  await expect(preview).toHaveScreenshot("rule-diagrams.png");
});

test("mobile dark previews fit, navigate back and restore focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await appearance(page, "Dark");
  await library(page, "Initiative");
  const row = page.getByRole("button", { name: /^Initiative rule/ });
  await row.click();
  const preview = page.getByRole("dialog", { name: "Initiative", exact: true });
  await expectAria(preview, "mobile-rule-preview.aria.yml");
  await expect(page).toHaveScreenshot("mobile-rule-dark.png");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await preview
    .getByRole("button", { name: "Turn Order", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Turn Order", exact: true })
    .getByRole("button", { name: "Back", exact: true })
    .click();
  await expect(preview).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(row).toBeFocused();
});

test("mobile toolbar and viewport-filling tile grid retain their compact layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page).toHaveScreenshot("mobile-dashboard-light.png");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight),
  ).toBeLessThanOrEqual(844);
  // Open the placeholder without scrolling the page or changing its placement.
  await page
    .getByRole("button", { name: "Expand Dice roller", exact: true })
    .click();
  const expanded = page.getByRole("dialog", {
    name: "Dice roller",
    exact: true,
  });
  const formula = expanded.getByRole("textbox", {
    name: "Dice formula",
    exact: true,
  });
  await formula.focus();
  await formula.fill("2d6 + 3");
  await formula.press("Enter");
  await expect(expanded.locator(".result-total")).toHaveText("11");
  await saved(page);
  await expect(expanded).toHaveScreenshot("mobile-dice-result.png");
});

test("campaign manager exposes isolation and a keyboard-accessible creation form", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Switch campaign: My Campaign", exact: true })
    .click();
  const manager = page.getByRole("dialog");
  await expectAria(manager, "campaign-manager.aria.yml");
  await expect(manager).toHaveScreenshot("campaign-manager.png");
  await manager
    .getByRole("textbox", { name: "New campaign", exact: true })
    .fill("Sunday table");
  await manager
    .getByRole("button", { name: "Create campaign", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", {
      name: "Switch campaign: Sunday table",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".combatant")).toHaveCount(0);
  await expect(page.locator(".result-total")).toHaveCount(0);
  await saved(page);
});

for (const mode of ["Light", "Dark"] as const) {
  test(`Sidekick Modern palette in ${mode.toLowerCase()} mode persists`, async ({
    page,
  }) => {
    await appearance(page, mode);
    await page.getByRole("button", { name: "Appearance", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByRole("combobox", { name: "Palette", exact: true })
      .selectOption("stone");
    await dialog
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await neutralDashboard(page);
    await expect(page.locator("html")).toHaveAttribute("data-palette", "stone");
    await expect(page.locator("body")).toHaveCSS("font-family", /Geist/);
    await expect(page.locator(".brand > span")).toHaveCSS(
      "font-family",
      /Alegreya Sans/,
    );
    await expect(page).toHaveScreenshot(
      `dashboard-modern-${mode.toLowerCase()}.png`,
    );
    await page.reload();
    await ready(page);
    await expect(page.locator("html")).toHaveAttribute("data-palette", "stone");
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      mode.toLowerCase(),
    );
  });
}
