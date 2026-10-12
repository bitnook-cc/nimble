import { expect, test, type Page } from "@playwright/test";
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
  page.on("pageerror", (e) => caught.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-11T12:00:00Z"));
  await page.goto("/");
  await ready(page);
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});
const tracker = (page: Page) =>
  page.getByRole("region", { name: "Initiative tracker", exact: true });
const guard = {
  type: "monsters",
  id: "milestone-guard",
  attributes: {
    name: "Moon guard",
    hp: 20,
    hpPerHero: 5,
    level: "1/2",
    armor: "medium",
    abilities: [{ name: "Moon shield", description: "Resist cold." }],
    actions: [
      {
        name: "Spear",
        damage: { roll: "1d6+2" },
        description: "On damage: Prone.",
      },
    ],
  },
};
const encounter = {
  type: "encounters",
  id: "moon-gate",
  attributes: {
    name: "Moon gate",
    description: "Guards block the ruined gate.",
    heroCount: 4,
    heroLevel: 2,
  },
  relationships: {
    monsters: {
      data: [
        {
          type: "monsters",
          id: guard.id,
          meta: { quantity: 1, isPerHero: true, heroesPerMonster: 2 },
        },
      ],
    },
  },
};
async function upload(page: Page, value: unknown) {
  const dialog = page.getByRole("dialog", {
    name: "Import and export content",
    exact: true,
  });
  await dialog
    .getByLabel("Import content JSON", { exact: true })
    .setInputFiles({
      name: "content.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(value)),
    });
  await expect(
    dialog.getByRole("heading", { name: /Import preview/ }),
  ).toBeVisible();
  return dialog;
}
async function install(page: Page, value: unknown, mode = "skip") {
  const dialog = await upload(page, value);
  await dialog
    .getByRole("combobox", { name: "Matching records", exact: true })
    .selectOption(mode);
  await dialog
    .getByRole("button", { name: "Import into campaign", exact: true })
    .click();
  await expect(dialog.getByRole("status")).toContainText("imported and saved");
  return dialog;
}
async function itemTool(page: Page) {
  await page.keyboard.press("Alt+p");
  const palette = page.getByRole("dialog", {
    name: "Command palette",
    exact: true,
  });
  await palette
    .getByRole("combobox", { name: "Search widgets", exact: true })
    .fill("Item library");
  await palette
    .getByRole("option", { name: "Item library", exact: true })
    .click();
  return page.getByRole("dialog", { name: "Item library", exact: true });
}

test("structured item editing, favourites and filters persist offline and export with loss warnings", async ({
  page,
  context,
}) => {
  const tool = await itemTool(page);
  await tool.getByRole("button", { name: "New item", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "New item", exact: true });
  await editor.getByLabel("Item name", { exact: true }).fill("Storm lantern");
  await editor.getByLabel("Item type", { exact: true }).fill("Wondrous");
  await editor
    .getByRole("combobox", { name: "Rarity", exact: true })
    .selectOption("rare");
  await editor.getByLabel("Item tags", { exact: true }).fill("light, storm");
  await editor
    .getByLabel("Description (Markdown)", { exact: true })
    .fill("A silver lantern that burns in rain.");
  await editor.getByLabel("Price", { exact: true }).fill("25");
  await editor.getByLabel("Inventory slots", { exact: true }).fill("1");
  await editor.getByLabel("Uses (capacity)", { exact: true }).fill("3");
  await editor
    .getByRole("button", { name: "Add property", exact: true })
    .click();
  await editor.getByLabel("Property name 1", { exact: true }).fill("fuel");
  await editor.getByLabel("Property value 1", { exact: true }).fill("moon oil");
  await editor.getByRole("button", { name: "Save item", exact: true }).click();
  await tool
    .getByRole("button", { name: "Favourite Storm lantern", exact: true })
    .click();
  await tool.getByLabel("Favourites only", { exact: true }).check();
  await tool
    .getByRole("combobox", { name: "Item rarity filter", exact: true })
    .selectOption("rare");
  await expect(
    tool
      .getByRole("list", { name: "Item search results" })
      .getByRole("listitem"),
  ).toHaveCount(1);
  await tool
    .getByRole("button", { name: "Preview Storm lantern", exact: true })
    .click();
  const preview = page.getByRole("dialog", {
    name: "Storm lantern",
    exact: true,
  });
  await expect(preview).toContainText("25 gp");
  await expect(preview).toContainText("moon oil");
  await preview
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await tool
    .getByRole("button", { name: "Import / export items", exact: true })
    .click();
  const exchange = page.getByRole("dialog", {
    name: "Import and export content",
    exact: true,
  });
  await exchange
    .getByRole("combobox", { name: "Export format", exact: true })
    .selectOption("nexus");
  await exchange
    .getByRole("button", { name: "Preview export", exact: true })
    .click();
  await expect(
    exchange.getByRole("list", { name: "Export warnings" }),
  ).toContainText("price");
  await expect(
    exchange.getByRole("list", { name: "Export warnings" }),
  ).toContainText("slots");
  const download = page.waitForEvent("download");
  await exchange
    .getByRole("button", { name: "Download export", exact: true })
    .click();
  await download;
  await exchange
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(tool).toHaveScreenshot("item-library-light.png");
  await page.keyboard.press("Escape");
  await saved(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  const restored = await itemTool(page);
  await expect(
    restored.getByLabel("Favourites only", { exact: true }),
  ).toBeChecked();
  await expect(
    restored.getByRole("combobox", { name: "Item rarity filter", exact: true }),
  ).toHaveValue("rare");
  await restored
    .getByRole("button", { name: "Edit Storm lantern", exact: true })
    .click();
  const edit = page.getByRole("dialog", { name: "Edit item", exact: true });
  await expect(edit.getByLabel("Price", { exact: true })).toHaveValue("25");
  await edit.getByLabel("Item name", { exact: true }).fill("Storm lantern II");
  await edit.getByRole("button", { name: "Save item", exact: true }).click();
  await expect(
    restored.getByRole("button", {
      name: "Preview Storm lantern II",
      exact: true,
    }),
  ).toBeVisible();
});

test("encounter drafts block combat until full monsters are imported, then scale, snapshot and undo", async ({
  page,
  context,
}) => {
  await combatant(page, "Original guard", 10);
  await tracker(page)
    .getByRole("button", { name: "Load encounter", exact: true })
    .click();
  const library = page.getByRole("dialog", {
    name: "Load encounter",
    exact: true,
  });
  await library
    .getByRole("button", { name: "Import / export encounters", exact: true })
    .click();
  const mini = {
    ...guard,
    attributes: { name: guard.attributes.name, hp: 20, level: "1/2" },
  };
  let exchange = await install(page, { data: encounter, included: [mini] });
  await exchange
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await library.getByRole("button", { name: /Moon gate/ }).click();
  await expect(
    library.getByRole("button", { name: "Start encounter", exact: true }),
  ).toBeDisabled();
  await expect(
    library.getByRole("list", { name: "Resolved encounter entries" }),
  ).toContainText("Missing full statblock");
  await library
    .getByRole("button", { name: "Import / export encounters", exact: true })
    .click();
  exchange = await install(page, { data: guard }, "replace");
  await exchange
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await library.getByLabel("Party size", { exact: true }).fill("2.5");
  await expect(
    library.getByRole("button", { name: "Start encounter", exact: true }),
  ).toBeDisabled();
  await library.getByLabel("Party size", { exact: true }).fill("5");
  await expect(
    library.getByRole("list", { name: "Resolved encounter entries" }),
  ).toContainText("rounded up from 2.5");
  await library
    .getByRole("heading", { name: "Load encounter", exact: true })
    .click();
  await expect(library).toHaveScreenshot("encounter-import-light.png");
  await library
    .getByRole("button", { name: "Start encounter", exact: true })
    .click();
  await library
    .getByRole("button", { name: "Replace current combat", exact: true })
    .click();
  await expect(
    tracker(page).getByRole("button", { name: "Edit Moon guard", exact: true }),
  ).toHaveCount(3);
  await expect(
    tracker(page)
      .getByRole("button", { name: "Set HP for Moon guard", exact: true })
      .first(),
  ).toHaveText("25/25");
  await saved(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await tracker(page)
    .getByRole("button", { name: "View statblock for Moon guard", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "Moon guard statblock", exact: true }),
  ).toContainText("Moon shield");
  await page.keyboard.press("Escape");
  await tracker(page)
    .getByRole("button", { name: "Undo combat change", exact: true })
    .click();
  await expect(
    tracker(page).getByRole("button", {
      name: "Edit Original guard",
      exact: true,
    }),
  ).toBeVisible();
});

test("team members and HP-less hazards load with independent combat state", async ({
  page,
}) => {
  await tracker(page)
    .getByRole("button", { name: "Load encounter", exact: true })
    .click();
  const library = page.getByRole("dialog", {
    name: "Load encounter",
    exact: true,
  });
  await library
    .getByRole("button", { name: "Import / export encounters", exact: true })
    .click();
  const team = {
    type: "monsters",
    id: "duo",
    attributes: {
      name: "Twin sentinels",
      level: 4,
      subtype: "team",
      legendary: true,
      abilities: [],
      actions: [],
      members: [
        { name: "Ash", hp: 30, abilities: [], actions: [] },
        { name: "Snow", hp: 20, hpPerHero: 5, abilities: [], actions: [] },
      ],
    },
  };
  const hazard = {
    type: "monsters",
    id: "mist",
    attributes: {
      name: "Sleeping mist",
      hazard: true,
      level: 1,
      abilities: [{ name: "Drowsy", description: "WILL save or sleep." }],
      actions: [],
    },
  };
  const e = {
    ...encounter,
    attributes: { ...encounter.attributes, name: "Twin watch" },
    relationships: {
      monsters: {
        data: ["duo", "mist"].map((id) => ({
          type: "monsters",
          id,
          meta: { quantity: 1, isPerHero: false, heroesPerMonster: 1 },
        })),
      },
    },
  };
  const exchange = await install(page, { data: e, included: [team, hazard] });
  await exchange
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await library.getByRole("button", { name: /Twin watch/ }).click();
  await library
    .getByRole("button", { name: "Start encounter", exact: true })
    .click();
  await expect(
    tracker(page).getByRole("button", { name: "Edit Ash", exact: true }),
  ).toBeVisible();
  await expect(
    tracker(page).getByRole("button", { name: "Set HP for Snow", exact: true }),
  ).toHaveText("20/20");
  await tracker(page)
    .getByRole("button", { name: "Sleeping mist", exact: true })
    .click();
  const preview = page.getByRole("dialog", {
    name: "Sleeping mist hazard",
    exact: true,
  });
  await expect(preview).toContainText("WILL save or sleep.");
  await expect(preview.locator("dt").filter({ hasText: /^HP$/ })).toHaveCount(
    0,
  );
  await preview
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await tracker(page)
    .getByRole("button", { name: "Remove hazard Sleeping mist", exact: true })
    .click();
  await expect(
    tracker(page).getByRole("button", { name: "Sleeping mist", exact: true }),
  ).toHaveCount(0);
  await tracker(page)
    .getByRole("button", { name: "Undo combat change", exact: true })
    .click();
  await expect(
    tracker(page).getByRole("button", { name: "Sleeping mist", exact: true }),
  ).toBeVisible();
});

test("invalid imports leave the campaign unchanged and Nimbrew previews nested actions", async ({
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
    .getByRole("button", { name: "Import / export content", exact: true })
    .click();
  const exchange = page.getByRole("dialog", {
    name: "Import and export content",
    exact: true,
  });
  await exchange
    .getByLabel("Import content JSON", { exact: true })
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        '{"data":{"type":"monsters","id":"bad","attributes":{"name":"Bad","hp":-2}}}',
      ),
    });
  await expect(exchange.getByRole("alert")).toBeVisible();
  await expect(
    exchange.getByRole("button", { name: "Import into campaign", exact: true }),
  ).toHaveCount(0);
  await install(page, {
    name: "Night keeper",
    CR: "Level 4 Solo",
    hp: "60",
    armor: "H",
    speed: "Fly 8",
    passives: [],
    actions: [
      {
        type: "multi",
        name: "Choose one",
        actions: [{ type: "single", name: "Claws", desc: "3d6 damage." }],
      },
    ],
    bloodied: "Raging",
    laststand: "Ten more damage.",
  });
  await exchange
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Night keeper");
  await library.getByRole("button", { name: /^Night keeper monster/ }).click();
  const preview = page.getByRole("dialog", {
    name: "Night keeper",
    exact: true,
  });
  await expect(preview).toContainText("Claws");
  await expect(preview).toContainText("Raging");
});

test("mobile dark item editor stays inside the viewport and restores popup focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await appearance(page, "Dark");
  const tool = await itemTool(page);
  const trigger = tool.getByRole("button", { name: "New item", exact: true });
  await trigger.click();
  const editor = page.getByRole("dialog", { name: "New item", exact: true });
  await editor
    .getByLabel("Item name", { exact: true })
    .fill("Traveler’s compass");
  await expect(editor).toHaveScreenshot("item-editor-mobile-dark.png");
  const box = await editor.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await editor.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("main")).toBeVisible();
});
