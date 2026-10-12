import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { appearance, combatant, ready, saved } from "./ui-fixtures";

test.use({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await ready(page);
});
const tracker = (page: Page) =>
  page.getByRole("region", { name: "Initiative tracker", exact: true });
async function addMonster(page: Page, name: string) {
  const tool = tracker(page);
  await tool.getByRole("tab", { name: "Monsters", exact: true }).click();
  await tool
    .getByRole("searchbox", { name: "Search monsters", exact: true })
    .fill(name);
  await tool
    .getByRole("button", { name: `Add ${name} to encounter`, exact: true })
    .click();
  await tool.getByRole("tab", { name: "Combatants", exact: true }).click();
}
async function hp(page: Page, name: string, value: number) {
  await tracker(page)
    .getByRole("button", { name: `Set HP for ${name}`, exact: true })
    .click();
  const edit = page.getByRole("dialog", {
    name: /^Edit /,
    exact: true,
  });
  await edit.getByLabel("Current HP", { exact: true }).fill(String(value));
  await edit.getByRole("button", { name: "Save changes", exact: true }).click();
}
async function importMonsters(page: Page) {
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
      name: "combat-fixtures.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          data: [
            {
              type: "monsters",
              id: "difficulty-guard",
              attributes: {
                name: "Level two guard",
                level: 2,
                hp: 10,
                abilities: [],
                actions: [],
              },
            },
            {
              type: "monsters",
              id: "difficulty-team",
              attributes: {
                name: "Legendary twins",
                level: 2,
                legendary: true,
                subtype: "team",
                bloodied: "At half HP, enrage.",
                lastStand: "4 more damage and it dies.",
                members: [
                  { name: "Twin Ash", hp: 10, abilities: [], actions: [] },
                  { name: "Twin Snow", hp: 10, abilities: [], actions: [] },
                ],
                abilities: [],
                actions: [],
              },
            },
          ],
        }),
      ),
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
  return library;
}

test("encounter difficulty recomputes the actual level budget and survives offline reload", async ({
  page,
  context,
}) => {
  const library = await importMonsters(page);
  await library
    .getByRole("button", { name: "Manage encounters", exact: true })
    .click();
  const encounters = page.getByRole("dialog", {
    name: "Encounter library",
    exact: true,
  });
  await encounters
    .getByRole("button", { name: "New encounter", exact: true })
    .click();
  const edit = page.getByRole("dialog", { name: "New encounter", exact: true });
  await edit
    .getByLabel("Encounter title", { exact: true })
    .fill("Balanced guard patrol");
  await edit.getByLabel("Default party size", { exact: true }).fill("4");
  await edit.getByLabel("Party level", { exact: true }).fill("2");
  await edit
    .getByRole("searchbox", {
      name: "Search encounter statblocks",
      exact: true,
    })
    .fill("Level two guard");
  await edit
    .getByRole("button", {
      name: "Add Level two guard to composition",
      exact: true,
    })
    .click();
  const rating = edit.getByRole("region", {
    name: "Encounter difficulty",
    exact: true,
  });
  for (const [quantity, label] of [
    [1, "Easy"],
    [3, "Medium"],
    [4, "Hard"],
    [6, "Very deadly"],
  ] as const) {
    await edit.getByLabel("Quantity 1", { exact: true }).fill(String(quantity));
    await expect(rating.locator("strong")).toHaveText(label);
  }
  await edit.getByLabel("Quantity 1", { exact: true }).fill("4");
  await expect(rating).toContainText("Monster levels 8 · Party levels 8");
  await rating
    .getByText("Difficulty guidance · GMG v1", { exact: true })
    .click();
  await expect(rating).toHaveScreenshot("encounter-difficulty-light.png");
  expect(
    (await new AxeBuilder({ page }).include("dialog").analyze()).violations,
  ).toEqual([]);
  await edit
    .getByRole("button", { name: "Save encounter", exact: true })
    .click();
  while (await page.getByRole("dialog").count())
    await page.keyboard.press("Escape");
  await saved(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Campaign library", exact: true })
    .getByRole("button", { name: "Manage encounters", exact: true })
    .click();
  await encounters
    .getByRole("button", {
      name: "Balanced guard patrol 1 entries",
      exact: true,
    })
    .click();
  await expect(
    encounters.getByRole("region", { name: "Encounter difficulty" }),
  ).toContainText("Hard");
});

test("legendary actions interleave heroes, retain Last Stand at zero HP and persist offline with undo", async ({
  page,
  context,
}) => {
  const name = "Pudge the Blunderer",
    tool = tracker(page);
  await combatant(page, "Mira", 20);
  await combatant(page, "Rook", 15);
  await combatant(page, "Follower", 10, "ally");
  await addMonster(page, name);
  await tool.getByRole("button", { name: "Begin combat", exact: true }).click();
  await tool.getByRole("button", { name: "Next turn", exact: true }).click();
  await expect(
    tool.getByRole("region", { name: "Legendary action" }),
  ).toContainText("acts after Mira");
  await tool
    .getByRole("button", { name: "Complete legendary action", exact: true })
    .click();
  await expect(tool.locator(".turn-status")).toContainText("Rook");
  await tool.getByRole("button", { name: "Next turn", exact: true }).click();
  await expect(
    tool.getByRole("region", { name: "Legendary action" }),
  ).toContainText("acts after Rook");
  await tool
    .getByRole("button", { name: "Complete legendary action", exact: true })
    .click();
  await expect(tool.locator(".turn-status")).toContainText("Follower");
  await tool.getByRole("button", { name: "Next turn", exact: true }).click();
  await expect(
    tool.getByRole("region", { name: "Legendary action" }),
  ).toHaveCount(0);
  await expect(tool.locator(".turn-status")).toContainText("Mira");
  await hp(page, name, 37);
  await expect(tool.locator(".legendary-phase")).toContainText("Bloodied");
  await hp(page, name, 0);
  await expect(
    tool.getByRole("button", { name: `Set HP for ${name}`, exact: true }),
  ).toContainText("Last Stand 20/20");
  await tool
    .getByRole("button", { name: `Damage ${name}`, exact: true })
    .click();
  await expect(
    tool.getByRole("button", { name: `Set HP for ${name}`, exact: true }),
  ).toContainText("Last Stand 19/20");
  await tool
    .getByRole("button", { name: "Undo combat change", exact: true })
    .click();
  await expect(
    tool.getByRole("button", { name: `Set HP for ${name}`, exact: true }),
  ).toContainText("Last Stand 20/20");
  await tool.getByRole("button", { name: "Next turn", exact: true }).click();
  await tool.getByRole("button", { name: "Pause combat", exact: true }).click();
  await saved(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await expect(
    tool.getByRole("region", { name: "Legendary action" }),
  ).toContainText("acts after Mira");
  await expect(
    tool.getByRole("button", {
      name: "Complete legendary action",
      exact: true,
    }),
  ).toBeDisabled();
  await tool
    .getByRole("button", { name: "Resume combat", exact: true })
    .click();
  await appearance(page, "Dark");
  await page
    .getByRole("button", { name: "Expand Initiative tracker", exact: true })
    .click();
  const expanded = page.getByRole("dialog", {
    name: "Initiative tracker",
    exact: true,
  });
  await expect(expanded).toHaveScreenshot("legendary-last-stand-dark.png");
  expect(
    (await new AxeBuilder({ page }).include("dialog").analyze()).violations,
  ).toEqual([]);
  await expanded
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  expect(
    (await new AxeBuilder({ page }).include("main").analyze()).violations,
  ).toEqual([]);
  await tool
    .getByRole("button", { name: `Set HP for ${name}`, exact: true })
    .click();
  const edit = page.getByRole("dialog", {
    name: /^Edit /,
    exact: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(edit).toHaveScreenshot("legendary-phase-settings-mobile.png");
  expect(
    (await new AxeBuilder({ page }).include("dialog").analyze()).violations,
  ).toEqual([]);
  await edit.getByLabel("Last Stand remaining HP", { exact: true }).fill("0");
  await edit.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(
    tool.getByRole("button", { name: `Damage ${name}`, exact: true }),
  ).toBeDisabled();
  await tool
    .getByRole("button", { name: "Complete legendary action", exact: true })
    .click();
  await expect(tool.locator(".turn-status")).toContainText("Rook");
});

test("legendary teams share one action and unusual Last Stand effects require GM resolution", async ({
  page,
}) => {
  const library = await importMonsters(page);
  await library
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await combatant(page, "Mira", 20);
  await combatant(page, "Rook", 15);
  await addMonster(page, "Legendary twins");
  const tool = tracker(page);
  await tool.getByRole("button", { name: "Begin combat", exact: true }).click();
  await tool.getByRole("button", { name: "Next turn", exact: true }).click();
  await tool
    .getByRole("button", { name: "Act as Twin Snow", exact: true })
    .click();
  await expect(
    tool.getByRole("region", { name: "Legendary action" }),
  ).toContainText("Twin Snow acts after Mira");
  await tool
    .getByRole("button", { name: "Complete legendary action", exact: true })
    .click();
  await expect(tool.locator(".turn-status")).toContainText("Rook");
  await addMonster(page, "Titan of the Deep Woods");
  await hp(page, "Titan of the Deep Woods", 0);
  await expect(
    tool.getByRole("button", {
      name: "Damage Titan of the Deep Woods",
      exact: true,
    }),
  ).toBeDisabled();
  const titan = tool.locator(".combatant").filter({
    has: page.getByRole("button", {
      name: "Edit Titan of the Deep Woods",
      exact: true,
    }),
  });
  await expect(titan).toContainText("minions/hero");
  await expect(titan).toContainText("Review the statblock");
  await titan
    .getByRole("button", {
      name: "Configure legendary phases for Titan of the Deep Woods",
      exact: true,
    })
    .click();
  const edit = page.getByRole("dialog", {
    name: /^Edit /,
    exact: true,
  });
  await edit
    .getByRole("combobox", { name: "Phase", exact: true })
    .selectOption("defeated");
  await edit.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    titan.getByRole("button", {
      name: "Edit Titan of the Deep Woods",
      exact: true,
    }),
  ).toContainText("Dead");
});

test("an uneven campaign party uses its exact level sum and a legendary team is rated once", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Campaign party", exact: true })
    .click();
  const party = page.getByRole("dialog", {
    name: "Campaign party",
    exact: true,
  });
  for (const [name, level] of [
    ["Mira", 1],
    ["Rook", 2],
    ["Thorn", 4],
  ] as const) {
    await party
      .getByRole("button", { name: "Add character", exact: true })
      .click();
    await party.getByLabel("Character name", { exact: true }).fill(name);
    await party.getByLabel("Level", { exact: true }).fill(String(level));
    await party
      .getByRole("button", { name: "Save character", exact: true })
      .click();
  }
  await party
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  const library = await importMonsters(page);
  await library
    .getByRole("button", { name: "Manage encounters", exact: true })
    .click();
  const encounters = page.getByRole("dialog", {
    name: "Encounter library",
    exact: true,
  });
  await encounters
    .getByRole("button", { name: "New encounter", exact: true })
    .click();
  const edit = page.getByRole("dialog", { name: "New encounter", exact: true });
  await expect(
    edit.getByLabel("Default party size", { exact: true }),
  ).toHaveValue("3");
  await expect(edit.getByLabel("Party level", { exact: true })).toHaveValue(
    String(7 / 3),
  );
  await edit
    .getByRole("searchbox", {
      name: "Search encounter statblocks",
      exact: true,
    })
    .fill("Level two guard");
  await edit
    .getByRole("button", {
      name: "Add Level two guard to composition",
      exact: true,
    })
    .click();
  const rating = edit.getByRole("region", {
    name: "Encounter difficulty",
    exact: true,
  });
  await expect(rating).toContainText("Monster levels 2 · Party levels 7");
  await edit.getByLabel("Party level", { exact: true }).fill("10");
  await edit
    .getByRole("button", { name: "Use campaign party levels", exact: true })
    .click();
  await expect(rating).toContainText("Party levels 7");
  await edit
    .getByRole("button", { name: "Remove entry 1", exact: true })
    .click();
  await edit.getByLabel("Party level", { exact: true }).fill("2");
  await edit
    .getByRole("searchbox", {
      name: "Search encounter statblocks",
      exact: true,
    })
    .fill("Legendary twins");
  await edit
    .getByRole("button", {
      name: "Add Legendary twins to composition",
      exact: true,
    })
    .click();
  await expect(rating.locator("strong")).toHaveText("Hard solo");
  await expect(rating).toContainText(
    "Legendary levels 2 · Average hero level 2",
  );
  await edit
    .getByRole("searchbox", {
      name: "Search encounter statblocks",
      exact: true,
    })
    .fill("Level two guard");
  await edit
    .getByRole("button", {
      name: "Add Level two guard to composition",
      exact: true,
    })
    .click();
  await expect(rating.locator("strong")).toHaveText("Unrated");
  await expect(rating).toContainText(
    "Mixed or multiple legendary groups need GM assessment",
  );
});

test("monster skull controls declare death, preserve statblocks and support offline undo", async ({
  page,
  context,
}) => {
  const tool = tracker(page);
  await combatant(page, "Mira", 20);
  await combatant(page, "Rook", 15);
  await combatant(page, "Manual enemy", 5, "enemy");
  await addMonster(page, "Goblin");
  await addMonster(page, "Pudge the Blunderer");
  await hp(page, "Mira", 9);
  await expect(
    tool.getByRole("button", { name: "Heal Mira", exact: true }),
  ).toBeEnabled();
  await expect(
    tool.getByRole("button", { name: "Heal Goblin", exact: true }),
  ).toHaveCount(0);
  await tool
    .getByRole("button", { name: "Mark Manual enemy dead", exact: true })
    .click();
  await tool
    .getByRole("button", { name: "Mark Goblin dead", exact: true })
    .click();
  const goblin = tool.locator(".combatant").filter({
    has: page.getByRole("button", { name: "Edit Goblin", exact: true }),
  });
  await expect(goblin).toContainText("Dead");
  await expect(
    goblin.getByRole("button", { name: "Set HP for Goblin", exact: true }),
  ).toHaveText("0/15");
  await expect(
    goblin.getByRole("button", {
      name: "View statblock for Goblin",
      exact: true,
    }),
  ).toBeVisible();
  await hp(page, "Pudge the Blunderer", 0);
  await tool.getByRole("button", { name: "Begin combat", exact: true }).click();
  await tool.getByRole("button", { name: "Next turn", exact: true }).click();
  await expect(
    tool.getByRole("region", { name: "Legendary action" }),
  ).toBeVisible();
  await tool
    .getByRole("button", { name: "Mark Pudge the Blunderer dead", exact: true })
    .click();
  await expect(
    tool.getByRole("button", {
      name: "Revive Pudge the Blunderer",
      exact: true,
    }),
  ).toBeEnabled();
  await saved(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await tool
    .getByRole("button", { name: "Complete legendary action", exact: true })
    .click();
  await expect(tool.locator(".turn-status")).toContainText("Rook");
  await tool
    .getByRole("button", { name: "Undo combat change", exact: true })
    .click();
  await tool
    .getByRole("button", { name: "Undo combat change", exact: true })
    .click();
  await expect(
    tool.getByRole("button", {
      name: "Set HP for Pudge the Blunderer",
      exact: true,
    }),
  ).toContainText("Last Stand 20/20");
  await expect(
    tool.getByRole("button", {
      name: "Mark Pudge the Blunderer dead",
      exact: true,
    }),
  ).toBeEnabled();
});

test("dead monsters show a healing cross and revive at 1 HP with offline persistence and undo", async ({
  page,
  context,
}) => {
  const tool = tracker(page);
  await combatant(page, "Manual enemy", 5, "enemy");
  await addMonster(page, "Goblin");
  await addMonster(page, "Pudge the Blunderer");
  // Ordinary HP loss also exposes revival; legendary Last Stand is still alive.
  await hp(page, "Goblin", 0);
  await hp(page, "Pudge the Blunderer", 0);
  await expect(
    tool.getByRole("button", {
      name: "Mark Pudge the Blunderer dead",
      exact: true,
    }),
  ).toBeEnabled();
  for (const name of ["Manual enemy", "Goblin", "Pudge the Blunderer"]) {
    const row = tool
      .locator(".combatant")
      .filter({
        has: page.getByRole("button", { name: `Edit ${name}`, exact: true }),
      });
    if (name !== "Goblin")
      await row
        .getByRole("button", { name: `Mark ${name} dead`, exact: true })
        .click();
    const revive = row.getByRole("button", {
      name: `Revive ${name}`,
      exact: true,
    });
    await expect(revive).toBeEnabled();
    await expect(revive.locator("svg")).toHaveClass(/lucide-cross/);
    await revive.click();
    await expect(row).not.toHaveClass(/is-defeated/);
    await expect(
      row.getByRole("button", { name: `Set HP for ${name}`, exact: true }),
    ).toHaveText(
      name === "Goblin"
        ? "1/15"
        : name === "Pudge the Blunderer"
          ? "1/75"
          : "1/20",
    );
    await expect(
      row
        .getByRole("button", { name: `Mark ${name} dead`, exact: true })
        .locator("svg"),
    ).toHaveClass(/lucide-skull/);
  }
  await saved(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await expect(
    tool.getByRole("button", {
      name: "Set HP for Pudge the Blunderer",
      exact: true,
    }),
  ).toHaveText("1/75");
  await tool
    .getByRole("button", { name: "Undo combat change", exact: true })
    .click();
  await expect(
    tool.getByRole("button", {
      name: "Revive Pudge the Blunderer",
      exact: true,
    }),
  ).toBeEnabled();
  await tool
    .getByRole("button", { name: "Revive Pudge the Blunderer", exact: true })
    .click();
  await tool
    .getByRole("button", { name: "Damage Pudge the Blunderer", exact: true })
    .click();
  await expect(
    tool.getByRole("button", {
      name: "Set HP for Pudge the Blunderer",
      exact: true,
    }),
  ).toContainText("Last Stand 20/20");
});
