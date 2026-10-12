import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { appearance, combatant, ready, saved } from "./ui-fixtures";

test.use({
  viewport: { width: 1280, height: 900 },
  locale: "en-GB",
  timezoneId: "UTC",
  colorScheme: "light",
  reducedMotion: "reduce",
});
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const caught: string[] = [];
  errors.set(page, caught);
  page.on("pageerror", (error) => caught.push(error.message));
  await page.clock.setFixedTime(new Date("2026-10-11T12:00:00Z"));
  await page.goto("/");
  await ready(page);
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});
const tracker = (page: Page) =>
  page.getByRole("region", { name: "Initiative tracker", exact: true });
const editor = (page: Page, name = "New encounter") =>
  page.getByRole("dialog", { name, exact: true });
const library = (page: Page, name = "Encounter library") =>
  page.getByRole("dialog", { name, exact: true });
const guard = {
  type: "monsters",
  id: "builder-guard",
  attributes: {
    name: "Moon guard",
    level: "1/2",
    hp: 20,
    hpPerHero: 4,
    armor: "medium",
    abilities: [{ name: "Moon shield", description: "Resist cold." }],
    actions: [],
  },
};
const team = {
  type: "monsters",
  id: "builder-team",
  attributes: {
    name: "Twin sentinels",
    level: 4,
    subtype: "team",
    legendary: true,
    abilities: [],
    actions: [],
    members: [
      { name: "Ash", hp: 30, abilities: [], actions: [] },
      { name: "Snow", hp: 20, abilities: [], actions: [] },
    ],
  },
};
const hazard = {
  type: "monsters",
  id: "builder-hazard",
  attributes: {
    name: "Sleeping mist",
    level: 1,
    hazard: true,
    abilities: [{ name: "Sleep", description: "WILL save or sleep." }],
    actions: [],
  },
};
async function importStatblocks(page: Page) {
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  const campaignLibrary = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await campaignLibrary
    .getByRole("button", { name: "Import / export content", exact: true })
    .click();
  const exchange = page.getByRole("dialog", {
    name: "Import and export content",
    exact: true,
  });
  await exchange
    .getByLabel("Import content JSON", { exact: true })
    .setInputFiles({
      name: "statblocks.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ data: [guard, team, hazard] })),
    });
  await exchange
    .getByRole("button", { name: "Import into campaign", exact: true })
    .click();
  await expect(exchange.getByRole("status")).toContainText(
    "imported and saved",
  );
  await exchange
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await campaignLibrary
    .getByRole("button", { name: "Manage encounters", exact: true })
    .click();
  return library(page);
}
async function addStatblock(
  page: Page,
  name: string,
  dialogName = "New encounter",
) {
  const form = editor(page, dialogName);
  await form
    .getByRole("searchbox", {
      name: "Search encounter statblocks",
      exact: true,
    })
    .fill(name);
  await form
    .getByRole("button", { name: `Add ${name} to composition`, exact: true })
    .click();
}
async function authored(page: Page) {
  await importStatblocks(page);
  await library(page)
    .getByRole("button", { name: "New encounter", exact: true })
    .click();
  const form = editor(page);
  await form.getByLabel("Encounter title", { exact: true }).fill("Moon gate");
  await form.getByLabel("Default party size", { exact: true }).fill("5");
  await form.getByLabel("Party level", { exact: true }).fill("2");
  await form
    .getByLabel("Encounter description (Markdown)", { exact: true })
    .fill("Guards challenge the party at the ruined gate.");
  await addStatblock(page, "Moon guard");
  await form
    .getByRole("combobox", { name: "Quantity mode 1", exact: true })
    .selectOption("scaled");
  await form.getByLabel("Heroes per quantity 1", { exact: true }).fill("2");
  await addStatblock(page, "Twin sentinels");
  await addStatblock(page, "Sleeping mist");
  await form
    .getByLabel("GM annotations", { exact: true })
    .fill("The guards may negotiate.");
  return form;
}
async function closeAll(page: Page) {
  while (await page.getByRole("dialog").count())
    await page.keyboard.press("Escape");
  await saved(page);
}

for (const width of [1280, 390]) {
  test(`toolbar encounter manager saves campaign drafts offline and restores focus at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const opener = page.getByRole("button", {
      name: "Encounter manager",
      exact: true,
    });
    await opener.focus();
    await opener.press("Enter");
    const manager = library(page);
    await expect(manager).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await manager
      .getByRole("button", { name: "New encounter", exact: true })
      .click();
    await editor(page)
      .getByLabel("Encounter title", { exact: true })
      .fill("Tomorrow's ambush");
    await editor(page)
      .getByRole("button", { name: "Save encounter", exact: true })
      .click();
    await expect(
      manager.getByRole("button", {
        name: "Tomorrow's ambush 0 entries",
        exact: true,
      }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
    await expect(opener).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(".widget-card")).toHaveCount(2);
    await saved(page);
    await page.reload();
    await ready(page);
    await context.setOffline(true);
    await page.reload();
    await ready(page);
    await opener.click();
    await manager
      .getByRole("searchbox", { name: "Search encounters", exact: true })
      .fill("ambush");
    await manager
      .getByRole("button", { name: "Tomorrow's ambush 0 entries", exact: true })
      .click();
    await expect(
      manager.getByRole("button", { name: "Edit encounter", exact: true }),
    ).toBeVisible();
    await expect(
      manager.getByRole("button", {
        name: "Import / export encounters",
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", {
        name: "Switch campaign: My Campaign",
        exact: true,
      })
      .click();
    await page.getByLabel("New campaign", { exact: true }).fill("Other table");
    await page
      .getByRole("button", { name: "Create campaign", exact: true })
      .click();
    await saved(page);
    await opener.click();
    await expect(
      manager
        .getByRole("list", { name: "Saved encounters", exact: true })
        .getByRole("listitem"),
    ).toHaveCount(0);
  });
}

test("authors, previews, reorders, duplicates and edits independent encounters offline", async ({
  page,
  context,
}) => {
  const form = await authored(page);
  await expect(
    form.getByRole("region", { name: "Encounter readiness" }),
  ).toContainText("5 enemy combatants · 1 hazards");
  await expect(
    form.getByRole("region", { name: "Encounter composition" }),
  ).toContainText("rounded up from 2.5");
  await form
    .getByRole("button", { name: "Preview Sleeping mist", exact: true })
    .click();
  const preview = page.getByRole("dialog", {
    name: "Sleeping mist",
    exact: true,
  });
  await expect(preview).toContainText("WILL save or sleep.");
  await page.keyboard.press("Escape");
  await expect(
    form.getByRole("button", { name: "Preview Sleeping mist", exact: true }),
  ).toBeFocused();
  await form
    .getByRole("button", { name: "Move entry 3 up", exact: true })
    .click();
  await expect(
    form
      .getByRole("region", { name: "Encounter composition" })
      .getByRole("listitem")
      .nth(1),
  ).toContainText("Sleeping mist");
  await form
    .getByRole("button", { name: "Save encounter", exact: true })
    .click();
  const encounterLibrary = library(page);
  await expect(
    encounterLibrary.getByRole("heading", { name: "Moon gate", exact: true }),
  ).toBeVisible();
  await encounterLibrary
    .getByRole("button", { name: "Duplicate encounter", exact: true })
    .click();
  await encounterLibrary
    .getByRole("button", { name: "Edit encounter", exact: true })
    .click();
  const edit = editor(page, "Edit encounter");
  await expect(edit.getByLabel("Encounter title", { exact: true })).toHaveValue(
    "Moon gate (copy)",
  );
  await edit.getByLabel("Encounter title", { exact: true }).fill("Night watch");
  await edit.getByLabel("Quantity 1", { exact: true }).fill("2");
  await edit
    .getByRole("button", { name: "Remove entry 2", exact: true })
    .click();
  await edit
    .getByRole("button", { name: "Save encounter", exact: true })
    .click();
  await closeAll(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await tracker(page)
    .getByRole("button", { name: "Load encounter", exact: true })
    .click();
  const loader = library(page, "Load encounter");
  await loader.getByRole("button", { name: /^Moon gate 3 entries$/ }).click();
  await expect(
    loader.getByRole("list", { name: "Resolved encounter entries" }),
  ).toContainText("rounded up from 2.5");
  await expect(loader).toContainText("The guards may negotiate.");
  await loader.getByRole("button", { name: /^Night watch 2 entries$/ }).click();
  await expect(
    loader.getByRole("region", { name: "Encounter readiness" }),
  ).toContainText("7 combatants · 0 hazards");
  await loader
    .getByRole("button", { name: "Edit encounter", exact: true })
    .click();
  await expect(
    editor(page, "Edit encounter").getByLabel("Quantity 1", { exact: true }),
  ).toHaveValue("2");
  await editor(page, "Edit encounter")
    .getByLabel("Encounter title", { exact: true })
    .fill("Unsaved change");
  await editor(page, "Edit encounter")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(
    loader.getByRole("heading", { name: "Night watch", exact: true }),
  ).toBeVisible();
});

test("starts a saved composition with party PCs, confirms replacement and supports combat undo", async ({
  page,
  context,
}) => {
  const form = await authored(page);
  await form
    .getByRole("button", { name: "Save encounter", exact: true })
    .click();
  await closeAll(page);
  await page
    .getByRole("button", { name: "Campaign party", exact: true })
    .click();
  const party = page.getByRole("dialog", {
    name: "Campaign party",
    exact: true,
  });
  await party
    .getByRole("button", { name: "Add character", exact: true })
    .click();
  await party.getByLabel("Character name", { exact: true }).fill("Mira");
  await party
    .getByRole("button", { name: "Save character", exact: true })
    .click();
  await closeAll(page);
  await combatant(page, "Old fight", 12);
  await tracker(page)
    .getByRole("button", { name: "Load encounter", exact: true })
    .click();
  const loader = library(page, "Load encounter");
  await loader.getByRole("button", { name: /^Moon gate 3 entries$/ }).click();
  await expect(
    loader.getByRole("region", { name: "Encounter readiness" }),
  ).toContainText("6 combatants · 1 hazards");
  await loader
    .getByRole("button", { name: "Start encounter", exact: true })
    .click();
  await loader
    .getByRole("button", { name: "Keep current combat", exact: true })
    .click();
  await expect(loader).toBeVisible();
  await loader
    .getByRole("button", { name: "Start encounter", exact: true })
    .click();
  await loader
    .getByRole("button", { name: "Replace current combat", exact: true })
    .click();
  await expect(
    tracker(page).getByRole("button", { name: "Edit Mira", exact: true }),
  ).toBeVisible();
  await expect(
    tracker(page).getByRole("button", { name: "Edit Moon guard", exact: true }),
  ).toHaveCount(3);
  await expect(
    tracker(page)
      .getByRole("button", { name: "Set HP for Moon guard", exact: true })
      .first(),
  ).toHaveText("20/20");
  await expect(
    tracker(page).getByRole("button", { name: "Edit Ash", exact: true }),
  ).toBeVisible();
  await expect(
    tracker(page).getByRole("button", { name: "Sleeping mist", exact: true }),
  ).toBeVisible();
  await saved(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await tracker(page)
    .getByRole("button", { name: "Undo combat change", exact: true })
    .click();
  await expect(
    tracker(page).getByRole("button", { name: "Edit Old fight", exact: true }),
  ).toBeVisible();
  await expect(
    tracker(page).getByRole("button", { name: "Edit Mira", exact: true }),
  ).toHaveCount(0);
});

test("empty drafts and excessive quantities stay editable and cannot start combat", async ({
  page,
}) => {
  await importStatblocks(page);
  await library(page)
    .getByRole("button", { name: "New encounter", exact: true })
    .click();
  await editor(page)
    .getByLabel("Encounter title", { exact: true })
    .fill("Draft");
  await editor(page)
    .getByRole("button", { name: "Save encounter", exact: true })
    .click();
  await closeAll(page);
  await tracker(page)
    .getByRole("button", { name: "Load encounter", exact: true })
    .click();
  const loader = library(page, "Load encounter");
  await loader.getByRole("button", { name: /^Draft 0 entries$/ }).click();
  await expect(
    loader.getByRole("button", { name: "Start encounter", exact: true }),
  ).toBeDisabled();
  await loader
    .getByRole("button", { name: "Edit encounter", exact: true })
    .click();
  await addStatblock(page, "Moon guard", "Edit encounter");
  const edit = editor(page, "Edit encounter");
  await edit.getByLabel("Quantity 1", { exact: true }).fill("100");
  await edit
    .getByRole("combobox", { name: "Quantity mode 1", exact: true })
    .selectOption("scaled");
  await expect(
    edit.getByRole("region", { name: "Encounter readiness" }),
  ).toContainText("400 combatants");
  await edit
    .getByRole("button", { name: "Save encounter", exact: true })
    .click();
  await expect(
    loader.getByRole("button", { name: "Start encounter", exact: true }),
  ).toBeDisabled();
  await loader
    .getByRole("button", { name: "Edit encounter", exact: true })
    .click();
  await edit
    .getByRole("combobox", { name: "Quantity mode 1", exact: true })
    .selectOption("fixed");
  await edit.getByLabel("Quantity 1", { exact: true }).fill("1");
  await edit
    .getByRole("button", { name: "Save encounter", exact: true })
    .click();
  await expect(
    loader.getByRole("button", { name: "Start encounter", exact: true }),
  ).toBeEnabled();
  await loader
    .getByRole("button", { name: "Edit encounter", exact: true })
    .click();
  await edit
    .getByRole("button", { name: "Delete encounter", exact: true })
    .click();
  await edit
    .getByRole("button", { name: "Keep encounter", exact: true })
    .click();
  await expect(edit).toBeVisible();
  await edit
    .getByRole("button", { name: "Delete encounter", exact: true })
    .click();
  await edit
    .getByRole("button", { name: "Confirm delete encounter", exact: true })
    .click();
  await expect(
    loader
      .getByRole("list", { name: "Saved encounters" })
      .getByRole("listitem"),
  ).toHaveCount(0);
});

for (const mode of ["Light", "Dark"] as const)
  test(`encounter builder has accessible controls and a reviewed ${mode.toLowerCase()} snapshot`, async ({
    page,
  }) => {
    await appearance(page, mode);
    const form = await authored(page);
    await form
      .getByRole("searchbox", {
        name: "Search encounter statblocks",
        exact: true,
      })
      .fill("Moon");
    await form.getByRole("heading", { name: /Composition/ }).click();
    await expect(form).toHaveScreenshot(
      `encounter-builder-${mode.toLowerCase()}.png`,
    );
    const audit = await new AxeBuilder({ page })
      .include('[role="dialog"],dialog')
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
    await form.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(
      library(page).getByRole("button", { name: "New encounter", exact: true }),
    ).toBeFocused();
  });

test("mobile dark builder fits the viewport with nested preview and keyboard focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await appearance(page, "Dark");
  const form = await authored(page);
  await form.evaluate((dialog) => {
    dialog.scrollTop = 0;
  });
  await expect(form).toHaveScreenshot("encounter-builder-mobile-dark.png");
  const box = await form.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  const widths = await form.evaluate((dialog) => ({
    width: dialog.clientWidth,
    scroll: dialog.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.width);
  const audit = await new AxeBuilder({ page })
    .include("dialog[open]")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await form.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    library(page).getByRole("button", { name: "New encounter", exact: true }),
  ).toBeFocused();
});

test("library preview edits use the full builder and selected exports warn about omitted statblocks", async ({
  page,
}) => {
  const form = await authored(page);
  await form
    .getByRole("button", { name: "Save encounter", exact: true })
    .click();
  await closeAll(page);
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  const campaignLibrary = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await campaignLibrary
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Moon gate");
  await campaignLibrary
    .getByRole("button", { name: /^Moon gate encounter/ })
    .click();
  const preview = page.getByRole("dialog", { name: "Moon gate", exact: true });
  await preview
    .getByRole("button", { name: "Edit content", exact: true })
    .click();
  await expect(
    preview
      .getByRole("region", { name: "Encounter composition" })
      .getByRole("listitem"),
  ).toHaveCount(3);
  await preview.getByLabel("Quantity 1", { exact: true }).fill("2");
  await preview
    .getByRole("button", { name: "Save encounter", exact: true })
    .click();
  await expect(preview).toContainText("2 per 2 heroes");
  await preview
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await campaignLibrary
    .getByRole("button", { name: "Import / export content", exact: true })
    .click();
  const exchange = page.getByRole("dialog", {
    name: "Import and export content",
    exact: true,
  });
  await exchange.getByText("Select records (4)", { exact: true }).click();
  await exchange
    .getByRole("checkbox", { name: "Moon guard · monster", exact: true })
    .uncheck();
  await exchange
    .getByRole("button", { name: "Preview export", exact: true })
    .click();
  await expect(
    exchange.getByRole("list", { name: "Export warnings" }),
  ).toContainText("Moon guard is referenced but not included");
  await expect(
    exchange.getByRole("list", { name: "Export warnings" }),
  ).toContainText("campaign ZIP");
});
