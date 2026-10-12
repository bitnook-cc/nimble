import { test, slateURL } from "./browser-fixtures";
import { resizeWidget } from "./ui-fixtures";
import { openWidgetPicker } from "./ui-fixtures";
import { expect } from "@playwright/test";
import { saved } from "./ui-fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto(slateURL(page));
  await expect(page.getByRole("main", { name: "GM screen" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Workspace status", exact: true }),
  ).toContainText(
    page.url().includes(":3011") ? "Development preview" : /offline play/,
  );
});

test("outside clicks dismiss toolbar dialogs without closing on padding or a drag from inside", async ({
  page,
}) => {
  for (const trigger of [
    "Appearance",
    "Manage screens",
    "12 × 8 grid",
    "Campaign library",
  ]) {
    const opener = page.getByRole("button", { name: trigger, exact: true });
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Empty padding is still part of the popup.
    await dialog.click({ position: { x: 8, y: 8 } });
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    if (!bounds) throw new Error("Dialog has no bounds.");
    await page.mouse.move(bounds.x + 8, bounds.y + 8);
    await page.mouse.down();
    await page.mouse.move(2, 2);
    await page.mouse.up();
    await expect(dialog).toBeVisible();
    await page.mouse.click(2, 2, { button: "right" });
    await expect(dialog).toBeVisible();
    await page.mouse.click(2, 2);
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  }
});

test("outside clicks close only the topmost popup over a library or quick widget", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  const library = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Flame Dart");
  const entry = library.getByRole("button", { name: /^Flame Dart.*spell/ });
  await entry.click();
  const preview = page.getByRole("dialog", { name: "Flame Dart", exact: true });
  await expect(preview).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(preview).toHaveCount(0);
  await expect(library).toBeVisible();
  await expect(entry).toBeFocused();
  await page.mouse.click(2, 2);
  await expect(library).toHaveCount(0);

  const opener = page.getByRole("button", {
    name: "Command palette",
    exact: true,
  });
  await opener.click();
  const palette = page.getByRole("dialog", {
    name: "Command palette",
    exact: true,
  });
  await palette
    .getByRole("combobox", { name: "Search widgets", exact: true })
    .fill("Dice roller");
  await palette
    .getByRole("option", { name: "Dice roller", exact: true })
    .click();
  const dice = page.getByRole("dialog", { name: "Dice roller", exact: true });
  const configure = dice.getByRole("button", {
    name: "Configure tool",
    exact: true,
  });
  await configure.click();
  const settings = page.getByRole("dialog", {
    name: "Configure Dice roller",
    exact: true,
  });
  await settings
    .getByRole("textbox", { name: "Tool name", exact: true })
    .fill("Discard this draft");
  await page.mouse.click(2, 2);
  await expect(settings).toHaveCount(0);
  await expect(dice).toBeVisible();
  await expect(configure).toBeFocused();
  await page.mouse.click(2, 2);
  await expect(dice).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(
    page.getByRole("region", { name: "Dice roller", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Discard this draft", exact: true }),
  ).toHaveCount(0);
});

test.describe("touch dismissal", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test("outside taps close the topmost popup without passing through to the dashboard", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "Expand Initiative tracker", exact: true })
      .click();
    const tracker = page.getByRole("dialog", {
      name: "Initiative tracker",
      exact: true,
    });
    await tracker
      .getByRole("button", { name: "Add combatant", exact: true })
      .click();
    const add = page.getByRole("dialog", {
      name: "Add combatant",
      exact: true,
    });
    await expect(add).toBeVisible();
    await page.touchscreen.tap(2, 2);
    await expect(add).toHaveCount(0);
    await expect(tracker).toBeVisible();
    await page.touchscreen.tap(2, 2);
    await expect(tracker).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("main", { name: "GM screen" })).toBeVisible();
  });
});

test("Configure stays open and saves the tool name alongside arrangement", async ({
  page,
}) => {
  const dice = page.getByRole("region", { name: "Dice roller", exact: true });
  await expect(
    page.getByRole("button", {
      name: /^(Collapse|Show) (Dice roller|Initiative tracker)$/,
    }),
  ).toHaveCount(0);
  for (let cycle = 0; cycle < 2; cycle++) {
    await dice
      .getByRole("button", { name: "Configure tool", exact: true })
      .click();
    const settings = page.getByRole("dialog", {
      name: "Configure Dice roller",
      exact: true,
    });
    await expect(settings).toBeVisible();
    await settings
      .getByRole("textbox", { name: "Tool name", exact: true })
      .fill("Travel rolls");
    if (!cycle) await page.keyboard.press("Escape");
    else
      await settings
        .getByRole("button", { name: "Save tool", exact: true })
        .click();
    await expect(settings).toHaveCount(0);
  }
  const renamed = page.getByRole("region", {
    name: "Travel rolls",
    exact: true,
  });
  await resizeWidget(page, "Travel rolls", 4, 4);
  await expect(renamed).toHaveCSS("grid-row-end", "span 4");
  await saved(page);
  await page.reload();
  await expect(
    renamed.getByRole("textbox", { name: "Dice formula", exact: true }),
  ).toBeVisible();
  await expect(renamed).toHaveCSS("grid-row-end", "span 4");
});

test("combatants can be added and edited on the grid and in a nested expanded view", async ({
  page,
}) => {
  const tracker = page.getByRole("region", {
    name: "Initiative tracker",
    exact: true,
  });
  await tracker
    .getByRole("button", { name: "Add combatant", exact: true })
    .click();
  const add = page.getByRole("dialog", { name: "Add combatant", exact: true });
  await expect(add).toBeVisible();
  await add.getByRole("textbox", { name: "Name", exact: true }).fill("Mara");
  await add
    .getByRole("spinbutton", { name: "Maximum HP", exact: true })
    .fill("30");
  await add.getByRole("button", { name: "Add combatant", exact: true }).click();
  await expect(add).toHaveCount(0);
  await tracker.getByRole("button", { name: "Edit Mara", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Edit Mara", exact: true });
  await edit
    .getByRole("spinbutton", { name: "Current HP", exact: true })
    .fill("24");
  await edit.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    tracker.getByRole("button", { name: "Set HP for Mara", exact: true }),
  ).toContainText("24");
  await tracker
    .getByRole("button", { name: "Expand Initiative tracker", exact: true })
    .click();
  const expanded = page.getByRole("dialog", {
    name: "Initiative tracker",
    exact: true,
  });
  await expanded
    .getByRole("button", { name: "Edit Mara", exact: true })
    .click();
  await expect(edit).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(edit).toHaveCount(0);
  await expect(expanded).toBeVisible();
  await expect(
    expanded.getByRole("button", { name: "Edit Mara", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(expanded).toHaveCount(0);
  await saved(page);
  await page.reload();
  await expect(
    tracker.getByRole("button", { name: "Set HP for Mara", exact: true }),
  ).toContainText("24");
});

test("command palette survives development effect replay and nested combat dialogs", async ({
  page,
}) => {
  for (let cycle = 0; cycle < 2; cycle++) {
    await page.keyboard.press("Alt+p");
    const palette = page.getByRole("dialog", {
      name: "Command palette",
      exact: true,
    });
    const search = palette.getByRole("combobox", {
      name: "Search widgets",
      exact: true,
    });
    await expect(search).toBeFocused();
    if (!cycle) {
      await page.keyboard.press("Alt+p");
      await expect(palette).toHaveCount(0);
      continue;
    }
    await search.fill("initiative");
    await search.press("Enter");
  }
  const tracker = page.getByRole("dialog", {
    name: "Initiative tracker",
    exact: true,
  });
  await tracker
    .getByRole("button", { name: "Add combatant", exact: true })
    .click();
  const add = page.getByRole("dialog", { name: "Add combatant", exact: true });
  await expect(add).toBeVisible();
  await add
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Oak guard");
  await add.getByRole("button", { name: "Add combatant", exact: true }).click();
  await expect(
    tracker.getByRole("button", { name: "Edit Oak guard", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tracker).toHaveCount(0);
  await expect(
    page
      .getByRole("region", { name: "Initiative tracker", exact: true })
      .getByRole("button", { name: "Edit Oak guard", exact: true }),
  ).toBeVisible();
});

test("toolbar popups stay open and can be reopened after dismissal", async ({
  page,
}) => {
  for (const trigger of [
    "Add widget at column 1, row 6",
    "12 × 8 grid",
    "Manage screens",
    "Appearance",
    "Campaign library",
    "Switch campaign: My Campaign",
  ]) {
    for (let cycle = 0; cycle < 2; cycle++) {
      await page.getByRole("button", { name: trigger, exact: true }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
    }
  }
});

test("party setup stays open above an expanded tracker and adds the saved PC", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Expand Initiative tracker", exact: true })
    .click();
  const tracker = page.getByRole("dialog", {
    name: "Initiative tracker",
    exact: true,
  });
  await tracker
    .getByRole("button", { name: "Set up party", exact: true })
    .click();
  const party = page.getByRole("dialog", {
    name: "Campaign party",
    exact: true,
  });
  await expect(party).toBeVisible();
  await party
    .getByRole("button", { name: "Add character", exact: true })
    .click();
  await party.getByLabel("Character name", { exact: true }).fill("Mira");
  await party
    .getByRole("button", { name: "Save character", exact: true })
    .click();
  await expect(party.getByRole("listitem")).toHaveCount(1);
  await party
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(tracker).toBeVisible();
  await tracker.getByRole("button", { name: "Add party", exact: true }).click();
  await expect(
    tracker.getByRole("button", { name: "Edit Mira", exact: true }),
  ).toBeVisible();
  await tracker
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Initiative tracker", exact: true })
      .getByRole("button", { name: "Edit Mira", exact: true }),
  ).toBeVisible();
});

test("inline note search survives development effect replay above its parent dialog", async ({
  page,
}) => {
  await page.keyboard.press("Alt+p");
  await page
    .getByRole("combobox", { name: "Search widgets", exact: true })
    .fill("Notes");
  await page.keyboard.press("Enter");
  const note = page.getByRole("dialog", { name: "Notes", exact: true });
  const editor = note.getByRole("textbox", { name: "Note text", exact: true });
  const list = note.getByRole("listbox", {
    name: "Reference suggestions",
    exact: true,
  });
  await editor.fill("Recall @Initiative");
  await expect(list).toBeVisible();
  await editor.press("Escape");
  await expect(list).toHaveCount(0);
  await expect(note).toBeVisible();
  await editor.press("Backspace");
  await expect(list).toBeVisible();
  await list.getByRole("option", { name: /^Initiative rule/ }).click();
  await expect(editor).toHaveValue(/^Recall \[Initiative\]\(slate:/);
  await expect(editor).toBeFocused();
});

test("monster search and statblock dialogs work in an expanded tracker during development", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Expand Initiative tracker", exact: true })
    .click();
  const tracker = page.getByRole("dialog", {
    name: "Initiative tracker",
    exact: true,
  });
  await tracker.getByRole("tab", { name: "Monsters", exact: true }).click();
  await tracker
    .getByRole("searchbox", { name: "Search monsters", exact: true })
    .fill("Goblin");
  await tracker
    .getByRole("button", { name: "Preview Goblin", exact: true })
    .click();
  const preview = page.getByRole("dialog", { name: "Goblin", exact: true });
  await expect(preview).toBeVisible();
  await preview
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(tracker).toBeVisible();
  await tracker
    .getByRole("button", { name: "Add Goblin to encounter", exact: true })
    .click();
  await tracker.getByRole("tab", { name: "Combatants", exact: true }).click();
  await tracker
    .getByRole("button", { name: "View statblock for Goblin", exact: true })
    .click();
  const snapshot = page.getByRole("dialog", {
    name: "Goblin statblock",
    exact: true,
  });
  await expect(snapshot).toBeVisible();
  await snapshot
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(
    tracker.getByRole("button", {
      name: "View statblock for Goblin",
      exact: true,
    }),
  ).toBeFocused();
});

test("NPC generator editors remain open through development effect replay and return focus", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Command palette", exact: true })
    .click();
  const search = page.getByRole("dialog", {
    name: "Command palette",
    exact: true,
  });
  await search
    .getByRole("combobox", { name: "Search widgets", exact: true })
    .fill("npc");
  await search
    .getByRole("option", { name: "NPC generator", exact: true })
    .click();
  const npc = page.getByRole("dialog", { name: "NPC generator", exact: true });
  await npc
    .getByRole("button", { name: "Manage generators", exact: true })
    .click();
  const library = page.getByRole("dialog", {
    name: "NPC generators",
    exact: true,
  });
  await library
    .getByRole("button", { name: "New generator", exact: true })
    .click();
  const editor = page.getByRole("dialog", {
    name: "Edit NPC generator",
    exact: true,
  });
  await expect(editor).toBeVisible();
  await editor.getByLabel("Generator name", { exact: true }).fill("Travellers");
  await editor
    .getByRole("button", { name: "Save generator", exact: true })
    .click();
  await expect(editor).toHaveCount(0);
  await expect(
    library.getByRole("button", { name: "New generator", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    npc.getByRole("button", { name: "Manage generators", exact: true }),
  ).toBeFocused();
  await npc
    .getByLabel("Name style")
    .selectOption({ label: "Travellers · Campaign" });
  await npc.getByRole("button", { name: "Generate NPC", exact: true }).click();
  await expect(npc.locator(".npc-name-row h3")).toHaveText("Rowan");
  await saved(page);
});

test("utility configuration and nested reference selection remain open during development effect replay", async ({
  page,
}) => {
  const caught: string[] = [];
  page.on("pageerror", (e) => caught.push(e.message));
  await page.keyboard.press("Alt+p");
  const palette = page.getByRole("dialog", {
    name: "Command palette",
    exact: true,
  });
  await palette
    .getByLabel("Search widgets", { exact: true })
    .fill("Random table");
  await palette
    .getByRole("option", { name: "Random table", exact: true })
    .click();
  const tool = page.getByRole("dialog", { name: "Random table", exact: true });
  await tool.getByRole("button", { name: "Create table", exact: true }).click();
  const editor = page.getByRole("dialog", {
    name: "Create random table",
    exact: true,
  });
  await expect(editor).toBeVisible();
  await editor
    .getByRole("button", { name: "Insert reference", exact: true })
    .first()
    .click();
  const library = page.getByRole("dialog", {
    name: "Choose reference",
    exact: true,
  });
  await library.getByLabel("Search content", { exact: true }).fill("Grappled");
  await library.getByRole("button", { name: /^Grappled/ }).click();
  await expect(editor).toBeVisible();
  await editor.getByRole("button", { name: "Save table", exact: true }).click();
  await expect(
    tool.getByRole("button", { name: "Create table", exact: true }),
  ).toBeFocused();
  await tool.getByRole("button", { name: "Roll table", exact: true }).click();
  await expect(
    tool.getByRole("region", { name: "Table result", exact: true }),
  ).toBeVisible();
  await saved(page);
  expect(caught).toEqual([]);
});

test("encounter authoring and nested statblock previews survive development effect replay", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Expand Initiative tracker", exact: true })
    .click();
  const expanded = page.getByRole("dialog", {
    name: "Initiative tracker",
    exact: true,
  });
  await expanded
    .getByRole("button", { name: "Load encounter", exact: true })
    .click();
  const loader = page.getByRole("dialog", {
    name: "Load encounter",
    exact: true,
  });
  await loader
    .getByRole("button", { name: "New encounter", exact: true })
    .click();
  const form = page.getByRole("dialog", { name: "New encounter", exact: true });
  await form
    .getByLabel("Encounter title", { exact: true })
    .fill("Forest watch");
  await form
    .getByRole("searchbox", {
      name: "Search encounter statblocks",
      exact: true,
    })
    .fill("Bandit");
  await form
    .getByRole("button", { name: /^Add .+ to composition$/ })
    .first()
    .click();
  const composition = form.getByRole("region", {
    name: "Encounter composition",
    exact: true,
  });
  await expect(composition.getByRole("listitem")).toHaveCount(1);
  await form.getByLabel("Quantity 1", { exact: true }).fill("2");
  const trigger = composition.locator(".reference-link").first();
  const name = await trigger.innerText();
  await trigger.click();
  const statblock = page.getByRole("dialog", { name, exact: true });
  await expect(statblock).toBeVisible();
  await statblock
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(trigger).toBeFocused();
  await form
    .getByRole("button", { name: "Save encounter", exact: true })
    .click();
  await expect(form).toHaveCount(0);
  await expect(
    loader.getByRole("heading", { name: "Forest watch", exact: true }),
  ).toBeVisible();
  await loader
    .getByRole("button", { name: "Start encounter", exact: true })
    .click();
  await expect(loader).toHaveCount(0);
  await expect(
    expanded.getByRole("button", { name: `Edit ${name}`, exact: true }),
  ).toHaveCount(2);
  await saved(page);
});

test("compact time settings survive development effect replay and return focus to the mode controls", async ({
  page,
}) => {
  const caught: string[] = [];
  page.on("pageerror", (e) => caught.push(e.message));
  await page.keyboard.press("Alt+p");
  const palette = page.getByRole("dialog", {
    name: "Command palette",
    exact: true,
  });
  await palette
    .getByLabel("Search widgets", { exact: true })
    .fill("Clock & timer");
  await palette
    .getByRole("option", { name: "Clock & timer", exact: true })
    .click();
  const time = page.getByRole("dialog", { name: "Clock & timer", exact: true });
  await time.getByRole("button", { name: "Timer mode", exact: true }).click();
  await time
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  const editor = page.getByRole("dialog", {
    name: "Configure Clock & timer",
    exact: true,
  });
  await expect(editor).toBeVisible();
  await editor.getByLabel("Duration (seconds)", { exact: true }).fill("5");
  await editor.getByRole("button", { name: "Save tool", exact: true }).click();
  await expect(
    time.getByRole("button", { name: "Configure tool", exact: true }),
  ).toBeFocused();
  await expect(time.getByLabel("Time remaining", { exact: true })).toHaveText(
    "00:00:05",
  );
  await time
    .getByRole("button", { name: "Start / resume", exact: true })
    .click();
  await time.getByRole("button", { name: "Clock mode", exact: true }).click();
  await time
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  await expect(editor).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    time.getByRole("button", { name: "Configure tool", exact: true }),
  ).toBeFocused();
  await expect(
    time.getByRole("button", { name: "Clock mode", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await saved(page);
  expect(caught).toEqual([]);
});

test("grid and expanded headers configure the saved tool and restore focus", async ({
  page,
}) => {
  const tile = page.getByRole("region", { name: "Dice roller", exact: true });
  const gear = tile
    .locator(".widget-header")
    .getByRole("button", { name: "Configure tool", exact: true });
  await expect(gear).toHaveText("");
  await expect(gear).toHaveAttribute("title", "Configure");
  await expect(gear.locator("svg")).toHaveCount(1);
  await expect(
    tile
      .locator(".widget-content")
      .getByRole("button", { name: "Configure tool" }),
  ).toHaveCount(0);
  await gear.click();
  const settings = page.getByRole("dialog", {
    name: "Configure Dice roller",
    exact: true,
  });
  await settings
    .getByLabel("Tool name", { exact: true })
    .fill("Cancelled title");
  await page.keyboard.press("Escape");
  await expect(settings).toHaveCount(0);
  await expect(gear).toBeFocused();
  await expect(tile.getByRole("heading")).toHaveText("Dice roller");

  await tile
    .getByRole("button", { name: "Expand Dice roller", exact: true })
    .click();
  const expanded = page.getByRole("dialog", {
    name: "Dice roller",
    exact: true,
  });
  const expandedGear = expanded
    .locator(".modal-heading")
    .getByRole("button", { name: "Configure tool", exact: true });
  await expect(expandedGear).toHaveText("");
  await expandedGear.click();
  await settings.getByLabel("Tool name", { exact: true }).fill("Travel dice");
  await settings
    .getByRole("button", { name: "Save tool", exact: true })
    .click();
  const renamed = page.getByRole("dialog", {
    name: "Travel dice",
    exact: true,
  });
  await expect(renamed).toBeVisible();
  await expect(
    renamed
      .locator(".modal-heading")
      .getByRole("button", { name: "Configure tool", exact: true }),
  ).toBeFocused();
  await renamed
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await saved(page);
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Travel dice", exact: true }),
  ).toBeVisible();
});

test("utility configuration is available in grid and expanded headers", async ({
  page,
}) => {
  await openWidgetPicker(page);
  const catalogue = page.getByRole("dialog", {
    name: "Add a widget",
    exact: true,
  });
  await catalogue.getByLabel("Search widgets").fill("Counter");
  await catalogue.getByRole("button", { name: /^Counter/ }).click();
  const tile = page.getByRole("region", { name: "Counter", exact: true });
  const gear = tile
    .locator(".widget-header")
    .getByRole("button", { name: "Configure tool", exact: true });
  await expect(gear).toHaveText("");
  await expect(
    tile
      .locator(".widget-content")
      .getByRole("button", { name: "Configure tool" }),
  ).toHaveCount(0);
  await gear.click();
  const settings = page.getByRole("dialog", {
    name: "Configure Counter",
    exact: true,
  });
  await settings.getByLabel("Step size", { exact: true }).fill("2");
  await settings
    .getByRole("button", { name: "Save tool", exact: true })
    .click();
  await expect(gear).toBeFocused();
  await tile
    .getByRole("button", { name: "Expand Counter", exact: true })
    .click();
  const expanded = page.getByRole("dialog", { name: "Counter", exact: true });
  const expandedGear = expanded
    .locator(".modal-heading")
    .getByRole("button", { name: "Configure tool", exact: true });
  await expandedGear.click();
  await expect(settings.getByLabel("Step size", { exact: true })).toHaveValue(
    "2",
  );
  await settings
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(expandedGear).toBeFocused();
  await expanded
    .getByRole("button", { name: "Increase counter", exact: true })
    .click();
  await expect(
    expanded.getByLabel("Counter value", { exact: true }),
  ).toHaveText("2");
});

for (const name of [
  "Dice roller",
  "Initiative tracker",
  "NPC generator",
  "Notes",
  "Reference",
  "Item library",
  "Random table",
  "Clock & timer",
  "Counter",
  "Image card",
  "Checklist",
]) {
  test(
    "quick-access header configures " + name + " with an icon only",
    async ({ page }) => {
      await page.keyboard.press("Alt+p");
      const palette = page.getByRole("dialog", {
        name: "Command palette",
        exact: true,
      });
      await palette.getByLabel("Search widgets", { exact: true }).fill(name);
      await palette.getByRole("option", { name, exact: true }).click();
      const popup = page.getByRole("dialog", { name, exact: true });
      const gear = popup
        .locator(".command-heading")
        .getByRole("button", { name: "Configure tool", exact: true });
      await expect(gear).toHaveText("");
      await expect(gear.locator("svg")).toHaveCount(1);
      await expect(
        popup
          .locator(".command-widget-body")
          .getByRole("button", { name: "Configure tool", exact: true }),
      ).toHaveCount(0);
      await gear.focus();
      await page.keyboard.press("Enter");
      const settings = page.getByRole("dialog", {
        name: "Configure " + name,
        exact: true,
      });
      await expect(
        settings.getByLabel("Tool name", { exact: true }),
      ).toBeVisible();
      await settings
        .getByRole("button", { name: "Close dialog", exact: true })
        .click();
      await expect(gear).toBeFocused();
      await expect(popup).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(popup).toHaveCount(0);
    },
  );
}

test("phone arrangement keeps Configure and the widget menu available", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Arrange", exact: true }).click();
  const tile = page.getByRole("region", { name: "Dice roller", exact: true });
  const gear = tile
    .locator(".widget-header")
    .getByRole("button", { name: "Configure tool", exact: true });
  const menu = tile.getByRole("button", {
    name: "Widget menu Dice roller",
    exact: true,
  });
  await expect(gear).toBeVisible();
  await expect(menu).toBeVisible();
  await gear.click();
  const settings = page.getByRole("dialog", {
    name: "Configure Dice roller",
    exact: true,
  });
  await expect(settings).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(gear).toBeFocused();
  await menu.click();
  await expect(
    tile.getByRole("group", { name: "Dice roller actions", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("banner", { name: "Screen controls" })
    .click({ position: { x: 1, y: 1 } });
  await expect(
    tile.getByRole("group", { name: "Dice roller actions", exact: true }),
  ).toHaveCount(0);
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(
    tile.getByRole("button", { name: "Position and size", exact: true }),
  ).toHaveCount(0);
  await expect(
    tile.getByRole("button", { name: "Widget settings", exact: true }),
  ).toHaveCount(0);
  await tile
    .getByRole("button", { name: "Remove from screen", exact: true })
    .click();
  await expect(tile).toHaveCount(0);
});
