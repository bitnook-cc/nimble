import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { ready, saved, appearance, expectAria } from "./ui-fixtures";

async function openParty(page: Page) {
  await page
    .getByRole("button", { name: "Campaign party", exact: true })
    .click();
  return page.getByRole("dialog", { name: "Campaign party", exact: true });
}
async function character(page: Page, name = "Mira", hp = "18", maxHp = "24") {
  const party = page.getByRole("dialog", {
    name: "Campaign party",
    exact: true,
  });
  await party
    .getByRole("button", { name: "Add character", exact: true })
    .click();
  await party.getByLabel("Character name", { exact: true }).fill(name);
  await party.getByLabel("Player name", { exact: true }).fill("Alex");
  await party.getByLabel("Level", { exact: true }).fill("3");
  await party.getByLabel("Maximum HP", { exact: true }).fill(maxHp);
  await party.getByLabel("Current HP", { exact: true }).fill(hp);
  await party.getByLabel("Notes", { exact: true }).fill("Carries the lantern");
  await party
    .getByRole("button", { name: "Save character", exact: true })
    .click();
}
async function closeParty(page: Page) {
  await page
    .getByRole("dialog", { name: "Campaign party", exact: true })
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await ready(page);
});

test("party CRUD and prepopulation preserve encounter state, avoid duplicates, and survive offline reload", async ({
  page,
  context,
}) => {
  let party = await openParty(page);
  await expect(party).toContainText("Your party is empty");
  await character(page);
  await character(page, "Thorn", "0", "20");
  await expect(party.getByRole("listitem")).toHaveCount(2);
  await closeParty(page);
  await page
    .getByRole("button", { name: "Add combatant", exact: true })
    .click();
  const combatant = page.getByRole("dialog", {
    name: "Add combatant",
    exact: true,
  });
  await combatant.getByLabel("Name", { exact: true }).fill("Goblin");
  await combatant
    .getByRole("combobox", { name: "Side", exact: true })
    .selectOption("enemy");
  await combatant
    .getByRole("button", { name: "Add combatant", exact: true })
    .click();
  await page.getByRole("button", { name: "Begin combat", exact: true }).click();
  await page.getByRole("button", { name: "Add party", exact: true }).click();
  await expect(page.locator(".combatant")).toHaveCount(3);
  await expect(page.locator(".is-active")).toContainText("Goblin");
  await expect(
    page.getByRole("button", { name: "Set HP for Mira", exact: true }),
  ).toHaveText("18/24");
  await expect(
    page.getByRole("button", { name: "Add party", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Undo combat change", exact: true })
    .click();
  await expect(page.locator(".combatant")).toHaveCount(1);
  await page.getByRole("button", { name: "Add party", exact: true }).click();
  await page.getByRole("button", { name: "Damage Mira", exact: true }).click();
  // Editing a combatant must retain its stable party link.
  await page.getByRole("button", { name: "Edit Mira", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Edit Mira", exact: true })
    .getByLabel("Initiative", { exact: true })
    .fill("14");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add party", exact: true }),
  ).toBeDisabled();
  party = await openParty(page);
  await party.getByRole("button", { name: "Edit Mira", exact: true }).click();
  await party
    .getByLabel("Character name", { exact: true })
    .fill("Mira Ashwood");
  await party.getByLabel("Current HP", { exact: true }).fill("25");
  await party
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(party.getByRole("alert")).toHaveText(
    "Current HP cannot exceed maximum HP.",
  );
  await party.getByLabel("Current HP", { exact: true }).fill("24");
  await party
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await closeParty(page);
  await expect(
    page.getByRole("button", { name: "Set HP for Mira", exact: true }),
  ).toHaveText("17/24");
  await expect(
    page.getByRole("button", { name: "Add party", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Reset encounter", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Reset this encounter?", exact: true })
    .getByRole("button", { name: "Reset encounter", exact: true })
    .click();
  await page.getByRole("button", { name: "Add party", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Set HP for Mira Ashwood", exact: true }),
  ).toHaveText("24/24");
  party = await openParty(page);
  await party
    .getByRole("button", { name: "Remove Thorn from party", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Remove Thorn from party?", exact: true })
    .getByRole("button", { name: "Remove character", exact: true })
    .click();
  await expect(party.getByRole("listitem")).toHaveCount(1);
  await closeParty(page);
  await expect(
    page.getByRole("button", { name: "Edit Thorn", exact: true }),
  ).toBeVisible();
  await saved(page);
  await page.reload();
  await ready(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await expect(page.locator(".combatant")).toHaveCount(2);
  party = await openParty(page);
  await expect(party).toContainText("Mira Ashwood");
  await expect(party.getByRole("listitem")).toHaveCount(1);
});

test("campaign switching, duplication, and a restored offline ZIP preserve party identities", async ({
  page,
  browser,
}) => {
  await openParty(page);
  await character(page);
  await closeParty(page);
  await page.getByRole("button", { name: "Add party", exact: true }).click();
  await saved(page);
  await page
    .getByRole("button", { name: "Switch campaign: My Campaign", exact: true })
    .click();
  const manager = page.getByRole("dialog", {
    name: "Your campaigns",
    exact: true,
  });
  const downloadWait = page.waitForEvent("download");
  await manager
    .getByRole("button", { name: "Export My Campaign", exact: true })
    .click();
  const bytes = await readFile((await (await downloadWait).path())!);
  await manager
    .getByRole("button", { name: "Duplicate campaign", exact: true })
    .click();
  await manager
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add party", exact: true }),
  ).toBeDisabled();
  await openParty(page);
  await character(page, "Thorn");
  await closeParty(page);
  await page.getByRole("button", { name: "Add party", exact: true }).click();
  await expect(page.locator(".combatant")).toHaveCount(2);
  await page
    .getByRole("button", {
      name: "Switch campaign: My Campaign (copy)",
      exact: true,
    })
    .click();
  await manager
    .getByRole("button", { name: "My Campaign", exact: true })
    .click();
  await expect(page.locator(".combatant")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Switch campaign: My Campaign", exact: true })
    .click();
  await manager
    .getByLabel("New campaign", { exact: true })
    .fill("Another party");
  await manager
    .getByRole("button", { name: "Create campaign", exact: true })
    .click();
  await expect(manager).toHaveCount(0);
  const emptyParty = await openParty(page);
  await expect(emptyParty).toContainText("Your party is empty");
  await closeParty(page);
  const fresh = await browser.newContext({ baseURL: "http://127.0.0.1:3010" });
  try {
    const restored = await fresh.newPage();
    await restored.goto("/");
    await ready(restored);
    await restored.reload();
    await ready(restored);
    await fresh.setOffline(true);
    await restored
      .getByRole("button", {
        name: "Switch campaign: My Campaign",
        exact: true,
      })
      .click();
    const restore = restored.getByRole("dialog", {
      name: "Your campaigns",
      exact: true,
    });
    await restore
      .getByRole("button", { name: "Backup & recovery", exact: true })
      .click();
    await restore.getByLabel("Backup file", { exact: true }).setInputFiles({
      name: "party.slate.zip",
      mimeType: "application/zip",
      buffer: bytes,
    });
    await restore
      .getByRole("button", { name: "Restore backup", exact: true })
      .click();
    await restore
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await expect(
      restored.getByRole("button", { name: "Add party", exact: true }),
    ).toBeDisabled();
    const party = await openParty(restored);
    await expect(party.getByRole("listitem")).toHaveCount(1);
    await expect(party).toContainText("Mira");
    await closeParty(restored);
    await expect(restored.locator(".combatant")).toHaveCount(1);
  } finally {
    await fresh.close();
  }
});

test("party setup and prepopulation work inside command palette and expanded widgets", async ({
  page,
}) => {
  await page.keyboard.press("Alt+p");
  await page
    .getByRole("option", { name: "Initiative tracker", exact: true })
    .click();
  const popup = page.getByRole("dialog", {
    name: "Initiative tracker",
    exact: true,
  });
  await popup
    .getByRole("button", { name: "Set up party", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Campaign party", exact: true }),
  ).toBeVisible();
  await character(page);
  await closeParty(page);
  await expect(popup).toBeVisible();
  await popup.getByRole("button", { name: "Add party", exact: true }).click();
  await expect(
    popup.getByRole("button", { name: "Edit Mira", exact: true }),
  ).toBeVisible();
  await popup
    .getByRole("button", { name: "Close command palette", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Expand Initiative tracker", exact: true })
    .click();
  const expanded = page.getByRole("dialog", {
    name: "Initiative tracker",
    exact: true,
  });
  await expect(
    expanded.getByRole("button", { name: "Add party", exact: true }),
  ).toBeDisabled();
  await expect(
    expanded.getByRole("button", { name: "Set HP for Mira", exact: true }),
  ).toHaveText("18/24");
});

for (const mode of ["Light", "Dark"] as const) {
  test(`party roster and character editor fit in ${mode.toLowerCase()} mode and on mobile`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await appearance(page, mode);
    const party = await openParty(page);
    await character(page);
    await character(page, "Thorn", "20", "20");
    await saved(page);
    await expectAria(party, `party-${mode.toLowerCase()}.aria.yml`);
    await expect(party).toHaveScreenshot(`party-${mode.toLowerCase()}.png`);
    await party.getByRole("button", { name: "Edit Mira", exact: true }).click();
    await expect(party).toHaveScreenshot(
      `party-editor-${mode.toLowerCase()}.png`,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(party).toHaveScreenshot(
      `party-editor-mobile-${mode.toLowerCase()}.png`,
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeLessThanOrEqual(844);
    await party
      .getByRole("button", { name: "Cancel edit", exact: true })
      .click();
    await closeParty(page);
    await page
      .getByRole("button", { name: "Expand Initiative tracker", exact: true })
      .click();
    await page
      .getByRole("dialog", { name: "Initiative tracker", exact: true })
      .getByRole("button", { name: "Add party", exact: true })
      .click();
    await expect(
      page
        .getByRole("dialog", { name: "Initiative tracker", exact: true })
        .getByRole("button", { name: "Edit Mira", exact: true }),
    ).toBeVisible();
  });
}
