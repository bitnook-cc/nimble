import { openWidgetPicker } from "./ui-fixtures";
import { expect, test } from "@playwright/test";
import { ready, saved, expectAria, appearance } from "./ui-fixtures";

test.use({
  viewport: { width: 1280, height: 900 },
  locale: "en-GB",
  timezoneId: "UTC",
  colorScheme: "light",
  reducedMotion: "reduce",
});
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-11T12:00:00Z"));
  await page.goto("/");
  await ready(page);
});

test("monster search previews statblocks, adds separate enemies and survives offline reload with undo", async ({
  page,
  context,
}) => {
  const tracker = page.getByRole("region", {
    name: "Initiative tracker",
    exact: true,
  });
  await tracker.getByRole("tab", { name: "Monsters", exact: true }).click();
  await tracker
    .getByRole("searchbox", { name: "Search monsters", exact: true })
    .fill("Goblin");
  await expect(
    tracker
      .getByRole("list", { name: "Monster search results" })
      .getByRole("listitem"),
  ).toHaveCount(6);
  await expectAria(
    tracker.getByRole("tabpanel", { name: "Monsters", exact: true }),
    "monster-search.aria.yml",
  );
  await expect(tracker).toHaveScreenshot("monster-search.png");
  await tracker
    .getByRole("button", { name: "Preview Goblin", exact: true })
    .click();
  const preview = page.getByRole("dialog", { name: "Goblin", exact: true });
  await expect(preview).toContainText("15");
  await expect(preview).toContainText("Goblins:");
  await expect(
    preview.getByRole("heading", { name: "Actions", exact: true }),
  ).toBeVisible();
  await preview
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  const add = tracker.getByRole("button", {
    name: "Add Goblin to encounter",
    exact: true,
  });
  await add.click();
  await add.click();
  await expect(tracker.getByRole("status")).toHaveText(
    "Goblin added to encounter.",
  );
  await tracker.getByRole("tab", { name: "Combatants", exact: true }).click();
  await expect(
    tracker.getByRole("button", { name: "Edit Goblin", exact: true }),
  ).toHaveCount(2);
  await tracker
    .getByRole("button", { name: "Damage Goblin", exact: true })
    .first()
    .click();
  await expect(
    tracker
      .getByRole("button", { name: "Set HP for Goblin", exact: true })
      .first(),
  ).toHaveText("14/15");
  await expect(
    tracker
      .getByRole("button", { name: "Set HP for Goblin", exact: true })
      .last(),
  ).toHaveText("15/15");
  await tracker.getByRole("tab", { name: "Monsters", exact: true }).click();
  await expect(
    tracker.getByRole("searchbox", { name: "Search monsters", exact: true }),
  ).toHaveValue("Goblin");
  await tracker.getByRole("tab", { name: "Combatants", exact: true }).click();
  await saved(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await expect(
    tracker
      .getByRole("button", { name: "Set HP for Goblin", exact: true })
      .first(),
  ).toHaveText("14/15");
  await tracker
    .getByRole("button", { name: "Undo combat change", exact: true })
    .click();
  await expect(
    tracker
      .getByRole("button", { name: "Set HP for Goblin", exact: true })
      .first(),
  ).toHaveText("15/15");
  await tracker
    .getByRole("button", { name: "View statblock for Goblin", exact: true })
    .first()
    .click();
  const snapshot = page.getByRole("dialog", {
    name: "Goblin statblock",
    exact: true,
  });
  await expect(snapshot).toContainText("Encounter snapshot");
  await expect(snapshot).toContainText("Goblins:");
  await expect(snapshot).toHaveScreenshot("monster-statblock.png");
  await snapshot.getByRole("button", { name: "1d6+2", exact: true }).click();
  await expect(snapshot.getByRole("status")).toBeVisible();
});

test("notes mention monsters with offline previews and pin the selected statblock", async ({
  page,
  context,
}) => {
  await openWidgetPicker(page);
  await page.getByRole("button", { name: /^Notes Markdown notes/ }).click();
  await page.getByRole("button", { name: "Expand Notes", exact: true }).click();
  const note = page.getByRole("dialog", { name: "Notes", exact: true });
  const editor = note.getByRole("textbox", { name: "Note text", exact: true });
  await editor.fill("# The ambush\n\nTwo @Goblin");
  await note
    .getByRole("option", { name: "Goblin monster · Nexus", exact: true })
    .click();
  await expect(editor).toHaveValue(/\[Goblin\]\(slate:nimble-gmg/);
  await note.getByRole("button", { name: "Read note", exact: true }).click();
  await saved(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await page
    .getByRole("region", { name: "Notes", exact: true })
    .getByRole("button", { name: "Goblin", exact: true })
    .click();
  const monster = page.getByRole("dialog", { name: "Goblin", exact: true });
  await expect(
    monster.getByRole("heading", { name: "Actions", exact: true }),
  ).toBeVisible();
  await monster
    .getByRole("button", { name: "Pin to screen", exact: true })
    .click();
  await monster
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Goblin", exact: true }),
  ).toContainText("15");
});

test("campaign monster creation and edits preserve existing combat snapshots", async ({
  page,
}) => {
  const tracker = page.getByRole("region", {
    name: "Initiative tracker",
    exact: true,
  });
  await tracker
    .getByRole("tab", { name: "Combatants", exact: true })
    .press("ArrowRight");
  await expect(
    tracker.getByRole("tab", { name: "Monsters", exact: true }),
  ).toBeFocused();
  await tracker
    .getByRole("button", { name: "Manage monsters", exact: true })
    .click();
  const library = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await expect(
    library.getByRole("combobox", { name: "Content type", exact: true }),
  ).toHaveValue("monster");
  await library
    .getByRole("button", { name: "Create content", exact: true })
    .click();
  await library
    .getByLabel("New content title", { exact: true })
    .fill("Moss guardian");
  await library.getByLabel("Monster HP", { exact: true }).fill("33");
  await library.getByLabel("Monster level", { exact: true }).fill("3");
  await library
    .getByLabel("New content Markdown", { exact: true })
    .fill("## Actions\n\nRoots bind trespassers.");
  await library
    .getByRole("button", { name: "Create reference", exact: true })
    .click();
  const preview = page.getByRole("dialog", {
    name: "Moss guardian",
    exact: true,
  });
  await preview
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await library
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await tracker
    .getByRole("searchbox", { name: "Search monsters", exact: true })
    .fill("Moss guardian");
  await tracker
    .getByRole("button", {
      name: "Add Moss guardian to encounter",
      exact: true,
    })
    .click();
  await tracker
    .getByRole("button", { name: "Preview Moss guardian", exact: true })
    .click();
  await preview
    .getByRole("button", { name: "Edit content", exact: true })
    .click();
  await preview.getByLabel("Monster HP", { exact: true }).fill("55");
  await preview
    .getByRole("textbox", { name: "Markdown content", exact: true })
    .fill("## Actions\n\nChanged library ability.");
  await preview
    .getByRole("button", { name: "Save content", exact: true })
    .click();
  await preview
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await tracker.getByRole("tab", { name: "Combatants", exact: true }).click();
  await expect(
    tracker.getByRole("button", {
      name: "Set HP for Moss guardian",
      exact: true,
    }),
  ).toHaveText("33/33");
  await tracker
    .getByRole("button", {
      name: "View statblock for Moss guardian",
      exact: true,
    })
    .click();
  const snapshot = page.getByRole("dialog", {
    name: "Moss guardian statblock",
    exact: true,
  });
  await expect(snapshot).toContainText("Roots bind trespassers");
  await expect(snapshot).not.toContainText("Changed library ability");
});

test("mobile dark command-palette monster search supports nested previews and encounter additions", async ({
  page,
}) => {
  await appearance(page, "Dark");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press("Alt+p");
  await page
    .getByRole("combobox", { name: "Search widgets", exact: true })
    .fill("Initiative");
  await page.keyboard.press("Enter");
  const tracker = page.getByRole("dialog", {
    name: "Initiative tracker",
    exact: true,
  });
  await tracker.getByRole("tab", { name: "Monsters", exact: true }).click();
  await tracker
    .getByRole("searchbox", { name: "Search monsters", exact: true })
    .fill("Goblin");
  await expect(tracker).toHaveScreenshot("monster-search-mobile-dark.png");
  await tracker
    .getByRole("button", { name: "Preview Goblin", exact: true })
    .click();
  const preview = page.getByRole("dialog", { name: "Goblin", exact: true });
  await expect(preview).toBeVisible();
  const bounds = (await preview.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await preview
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(
    tracker.getByRole("button", { name: "Preview Goblin", exact: true }),
  ).toBeFocused();
  await tracker
    .getByRole("button", { name: "Add Goblin to encounter", exact: true })
    .click();
  await tracker.getByRole("tab", { name: "Combatants", exact: true }).click();
  await expect(
    tracker.getByRole("button", { name: "Edit Goblin", exact: true }),
  ).toBeVisible();
});
