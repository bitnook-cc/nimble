import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { ready, saved, appearance, expectAria } from "./ui-fixtures";

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
  page.on("pageerror", (e) => caught.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-11T12:00:00Z"));
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto("/");
  await ready(page);
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});
async function npcTool(page: Page) {
  await page
    .getByRole("button", { name: "Command palette", exact: true })
    .click();
  const palette = page.getByRole("dialog", {
    name: "Command palette",
    exact: true,
  });
  await palette
    .getByRole("combobox", { name: "Search widgets", exact: true })
    .fill("npc");
  await palette
    .getByRole("option", { name: "NPC generator", exact: true })
    .click();
  return page.getByRole("dialog", { name: "NPC generator", exact: true });
}
async function manage(page: Page) {
  await page
    .getByRole("button", { name: "Manage generators", exact: true })
    .click();
  return page.getByRole("dialog", { name: "NPC generators", exact: true });
}
async function create(page: Page) {
  const manager = await manage(page);
  await manager
    .getByRole("button", { name: "New generator", exact: true })
    .click();
  const editor = page.getByRole("dialog", {
    name: "Edit NPC generator",
    exact: true,
  });
  await editor
    .getByRole("textbox", { name: "Generator name", exact: true })
    .fill("Harbour folk");
  await editor
    .getByRole("textbox", { name: "Any first names", exact: true })
    .fill("Rowan\nSable");
  await editor
    .getByRole("textbox", { name: "Surnames", exact: true })
    .fill("Vale");
  await editor
    .getByRole("textbox", { name: "Appearance entries", exact: true })
    .fill("Blue cloak");
  await editor
    .getByRole("textbox", { name: "Scar or mark entries", exact: true })
    .fill("Nicked ear");
  await editor
    .getByRole("textbox", { name: "Mannerism entries", exact: true })
    .fill("Whistles softly");
  await editor
    .getByRole("textbox", { name: "Quirk entries", exact: true })
    .fill("Collects shells\nRefuses hats");
  await editor
    .getByRole("button", { name: "Try generator", exact: true })
    .click();
  await expect(editor.getByRole("status")).toContainText("Rowan Vale");
  await editor
    .getByRole("heading", { name: "Edit NPC generator", exact: true })
    .scrollIntoViewIfNeeded();
  await expectAria(editor, "generator-editor.aria.yml");
  await page.mouse.move(0, 0);
  await expect(editor).toHaveScreenshot("generator-editor.png");
  await editor
    .getByRole("button", { name: "Save generator", exact: true })
    .click();
  return manager;
}
test("edits generator lists while saved NPCs retain original reroll tables offline", async ({
  page,
  context,
}) => {
  let npc = await npcTool(page);
  const manager = await create(page);
  await manager
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await npc
    .getByLabel("Name style")
    .selectOption({ label: "Harbour folk · Campaign" });
  await npc.getByRole("button", { name: "Generate NPC", exact: true }).click();
  await expect(npc.locator(".npc-name-row h3")).toHaveText("Rowan Vale");
  await npc.getByRole("button", { name: "Save NPC", exact: true }).click();
  await manage(page);
  await manager
    .getByRole("button", { name: "Edit generator Harbour folk", exact: true })
    .click();
  const editor = page.getByRole("dialog", {
    name: "Edit NPC generator",
    exact: true,
  });
  await editor
    .getByRole("textbox", { name: "Any first names", exact: true })
    .fill("Changed");
  await editor
    .getByRole("textbox", { name: "Quirk entries", exact: true })
    .fill("Changed source quirk");
  await editor
    .getByRole("button", { name: "Save generator", exact: true })
    .click();
  await manager
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await page.evaluate(() => {
    Math.random = () => 0.99;
  });
  await npc.getByRole("button", { name: "Reroll name", exact: true }).click();
  await expect(npc.locator(".npc-name-row h3")).toHaveText("Sable Vale");
  await npc.getByRole("button", { name: "Reroll quirk", exact: true }).click();
  await expect(npc.locator("dd > span").last()).toHaveText("Refuses hats");
  await npc.getByRole("button", { name: "Generate NPC", exact: true }).click();
  await expect(npc.locator(".npc-name-row h3")).toHaveText("Changed Vale");
  await expect(npc.locator("dd > span").last()).toHaveText(
    "Changed source quirk",
  );
  await page.keyboard.press("Escape");
  await saved(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  npc = await npcTool(page);
  await expect(npc.locator(".npc-name-row h3")).toHaveText("Changed Vale");
  await npc.locator("summary", { hasText: "Saved NPCs (1)" }).click();
  await npc
    .getByRole("button", { name: "View saved NPC Rowan Vale", exact: true })
    .click();
  await npc.getByRole("button", { name: "Reroll quirk", exact: true }).click();
  await expect(npc.locator("dd > span").last()).toHaveText("Collects shells");
});
test("exports a pack and installs it on a fresh device with validation, campaign enabling and offline generation", async ({
  page,
  browser,
}) => {
  await npcTool(page);
  const manager = await create(page);
  await manager
    .getByRole("button", { name: "Export generator pack", exact: true })
    .click();
  const exporter = page.getByRole("dialog", {
    name: "Export generator pack",
    exact: true,
  });
  await exporter
    .getByLabel("Pack name", { exact: true })
    .fill("Harbour tables");
  await exporter.getByLabel("Pack ID", { exact: true }).fill("harbour-folk");
  const download = page.waitForEvent("download");
  await exporter
    .getByRole("button", { name: "Download pack", exact: true })
    .click();
  const bytes = await readFile((await (await download).path())!);
  const pack = JSON.parse(bytes.toString());
  expect(pack.format).toBe("slate-content");
  expect(pack.records[0].kind).toBe("npc-generator");
  const fresh = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  try {
    const restored = await fresh.newPage();
    restored.on("pageerror", (e) => errors.get(page)!.push(e.message));
    await restored.addInitScript(() => {
      Math.random = () => 0;
    });
    await restored.goto("/");
    await ready(restored);
    let npc = await npcTool(restored);
    const library = await manage(restored);
    await library
      .getByRole("button", { name: "Import / manage packs", exact: true })
      .click();
    const packs = restored.getByRole("dialog", {
      name: "Campaign library",
      exact: true,
    });
    const input = packs.getByLabel("Import content pack", { exact: true });
    const invalid = structuredClone(pack);
    invalid.records[0].fields.attributes.quirk = [];
    await input.setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(invalid)),
    });
    await expect(packs.getByRole("alert")).toContainText(
      "Invalid or unsupported",
    );
    await expect(
      packs.getByRole("button", { name: "Install content pack", exact: true }),
    ).toHaveCount(0);
    await input.setInputFiles({
      name: "harbour.json",
      mimeType: "application/json",
      buffer: bytes,
    });
    await packs
      .getByRole("button", { name: "Install content pack", exact: true })
      .click();
    await expect(
      packs.getByRole("button", { name: "Install content pack", exact: true }),
    ).toHaveCount(0);
    const row = packs
      .locator(".pack-row")
      .filter({ has: restored.getByText("Harbour tables", { exact: true }) });
    await expect(row).toContainText("Enabled for this campaign");
    await input.setInputFiles({
      name: "conflict.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ ...pack, name: "Conflict" })),
    });
    await packs
      .getByRole("button", { name: "Install content pack", exact: true })
      .click();
    await expect(packs.getByRole("alert")).toContainText("different content");
    await packs
      .getByRole("button", { name: "Cancel import", exact: true })
      .click();
    await packs
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await library
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await npc
      .getByLabel("Name style")
      .selectOption({ label: "Harbour folk · Harbour tables" });
    await npc
      .getByRole("button", { name: "Generate NPC", exact: true })
      .click();
    await expect(npc.locator(".npc-name-row h3")).toHaveText("Rowan Vale");
    await manage(restored);
    await library
      .getByRole("button", { name: "Import / manage packs", exact: true })
      .click();
    await row
      .getByRole("button", { name: "Disable pack", exact: true })
      .click();
    await packs
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await library
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await expect(
      npc.getByRole("button", { name: "Generate NPC", exact: true }),
    ).toBeDisabled();
    await npc.getByRole("button", { name: "Reroll name", exact: true }).click();
    await expect(npc.locator(".npc-name-row h3")).toHaveText("Rowan Vale");
    await manage(restored);
    await library
      .getByRole("button", { name: "Import / manage packs", exact: true })
      .click();
    await row.getByRole("button", { name: "Enable pack", exact: true }).click();
    await packs
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await library
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await restored.keyboard.press("Escape");
    await saved(restored);
    await fresh.setOffline(true);
    await restored.reload();
    await ready(restored);
    npc = await npcTool(restored);
    await npc
      .getByRole("button", { name: "Generate NPC", exact: true })
      .click();
    await expect(npc.locator(".npc-name-row h3")).toHaveText("Rowan Vale");
  } finally {
    await fresh.close();
  }
});
test("edits copied syllable tables and rejects impossible or empty tables without saving", async ({
  page,
}) => {
  const npc = await npcTool(page),
    manager = await manage(page);
  await manager
    .getByRole("button", {
      name: "Copy Elf generator to campaign",
      exact: true,
    })
    .click();
  const editor = page.getByRole("dialog", {
    name: "Edit NPC generator",
    exact: true,
  });
  await editor.getByLabel("Generator name", { exact: true }).fill("Moon elves");
  await editor
    .getByLabel("Enable masculine first names", { exact: true })
    .uncheck();
  await editor
    .getByLabel("Enable feminine first names", { exact: true })
    .uncheck();
  await editor.getByLabel("Enable surnames", { exact: true }).uncheck();
  await editor.getByLabel("Enable any first names", { exact: true }).check();
  await editor
    .getByRole("textbox", { name: "Any first names prefixes", exact: true })
    .fill("al");
  await editor
    .getByRole("textbox", { name: "Any first names middle", exact: true })
    .fill("");
  await editor
    .getByRole("textbox", { name: "Any first names suffixes", exact: true })
    .fill("ra");
  await editor
    .getByRole("textbox", { name: "Any first names patterns", exact: true })
    .fill("PS");
  await editor
    .getByLabel("Any first names minimum length", { exact: true })
    .fill("5");
  await editor
    .getByLabel("Any first names maximum length", { exact: true })
    .fill("8");
  await editor
    .getByRole("button", { name: "Save generator", exact: true })
    .click();
  await expect(editor.getByRole("alert")).toContainText(
    "cannot produce a name",
  );
  await editor
    .getByLabel("Any first names minimum length", { exact: true })
    .fill("4");
  await editor
    .getByRole("textbox", { name: "Quirk entries", exact: true })
    .fill("");
  await editor
    .getByRole("button", { name: "Save generator", exact: true })
    .click();
  await expect(editor.getByRole("alert")).toContainText("quirk");
  await editor
    .getByRole("textbox", { name: "Quirk entries", exact: true })
    .fill("Sees moonlight everywhere");
  await editor
    .getByRole("button", { name: "Try generator", exact: true })
    .click();
  await expect(editor.getByRole("status")).toContainText("Alra");
  await editor
    .getByRole("button", { name: "Save generator", exact: true })
    .click();
  await manager
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await npc
    .getByLabel("Name style")
    .selectOption({ label: "Moon elves · Campaign" });
  await npc.getByRole("button", { name: "Generate NPC", exact: true }).click();
  await expect(npc.locator(".npc-name-row h3")).toHaveText("Alra");
  await expect(npc.locator("dd > span").last()).toHaveText(
    "Sees moonlight everywhere",
  );
});
test("mobile dark nested generator editors fit and restore focus on cancellation", async ({
  page,
}) => {
  await appearance(page, "Dark");
  await page.setViewportSize({ width: 390, height: 844 });
  const npc = await npcTool(page),
    manager = await manage(page);
  await manager
    .getByRole("button", { name: "New generator", exact: true })
    .click();
  const editor = page.getByRole("dialog", {
    name: "Edit NPC generator",
    exact: true,
  });
  await editor.getByLabel("Generator name", { exact: true }).fill("Travellers");
  await page.mouse.move(0, 0);
  await expect(page).toHaveScreenshot("generator-editor-mobile-dark.png");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(manager).toBeVisible();
  await expect(
    manager.getByRole("button", { name: "New generator", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(npc).toBeVisible();
  await expect(
    npc.getByRole("button", { name: "Manage generators", exact: true }),
  ).toBeFocused();
});
