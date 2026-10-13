import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { ready, saved, appearance } from "./ui-fixtures";

test("a Weapons reference table offers a rollable campaign copy with all catalog rows", async ({
  page,
  context,
}) => {
  const caught: string[] = [];
  page.on("pageerror", (error) => caught.push(error.message));
  await page.goto("/");
  await ready(page);
  await page.keyboard.press("Alt+p");
  const palette = page.getByRole("dialog", {
    name: "Command palette",
    exact: true,
  });
  await palette
    .getByRole("combobox", { name: "Search widgets", exact: true })
    .fill("Random table");
  await palette
    .getByRole("option", { name: "Random table", exact: true })
    .click();
  const widget = page.getByRole("dialog", {
    name: "Random table",
    exact: true,
  });
  await widget
    .getByRole("button", { name: "Choose table", exact: true })
    .click();
  const chooser = page.getByRole("dialog", {
    name: "Choose reference",
    exact: true,
  });
  await chooser
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Weapons");
  await chooser
    .getByRole("button", { name: /^Weapons Reference table/ })
    .click();
  const weapons = page.getByRole("dialog", { name: "Weapons", exact: true });
  await expect(
    weapons.getByRole("button", { name: "Roll table", exact: true }),
  ).toHaveCount(0);
  await expect(weapons).toContainText("equal chances");
  await weapons
    .getByRole("button", { name: "Make rollable campaign copy", exact: true })
    .click();
  const copy = page.getByRole("dialog", {
    name: "Weapons (random)",
    exact: true,
  });
  const table = copy.getByRole("table", { name: "Table entries", exact: true });
  await expect(table.getByRole("row")).toHaveCount(24);
  await expect(table.getByRole("row", { name: /Dagger/ })).toContainText(
    "1d4+DEX piercing",
  );
  await copy.getByRole("button", { name: "Roll table", exact: true }).click();
  const result = await copy
    .getByRole("region", { name: "Table result" })
    .getByRole("heading", { level: 3 })
    .innerText();
  await expect(table.locator('tr[aria-current="true"]')).toContainText(result);
  await saved(page);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  const library = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Weapons");
  await library
    .getByRole("combobox", { name: "Content type", exact: true })
    .selectOption("table");
  await expect(
    library.getByRole("button", { name: /^Weapons Reference table/ }),
  ).toBeVisible();
  await expect(
    library.getByRole("button", { name: /^Weapons \(random\) Random table/ }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await page.keyboard.press("Alt+p");
  await palette
    .getByRole("combobox", { name: "Search widgets", exact: true })
    .fill("Weapons (random)");
  await palette
    .getByRole("option", { name: "Weapons (random)", exact: true })
    .click();
  await expect(table.getByRole("row")).toHaveCount(24);
  await expect(table.locator('tr[aria-current="true"]')).toContainText(result);
  expect(caught).toEqual([]);
});

test("library tables export as packs, retain zero-based ranges and update pinned widgets offline", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await ready(page);
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  const library = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await library
    .getByRole("button", { name: "Create content", exact: true })
    .click();
  await library
    .getByRole("combobox", { name: "New content type", exact: true })
    .selectOption("table");
  await library
    .getByRole("textbox", { name: "Table name", exact: true })
    .fill("Road weather");
  await library
    .getByRole("textbox", { name: "Row name", exact: true })
    .first()
    .fill("Clear skies");
  await library
    .getByRole("textbox", { name: "Row name", exact: true })
    .nth(1)
    .fill("Rain");
  await library
    .getByRole("button", { name: "Save table", exact: true })
    .click();
  let preview = page.getByRole("dialog", { name: "Road weather", exact: true });
  await expect(
    preview.getByRole("table", { name: "Table entries" }),
  ).toContainText("Clear skies");
  await expect(
    preview
      .getByRole("table", { name: "Table entries" })
      .getByRole("row", { name: /Clear skies/ })
      .getByRole("cell")
      .first(),
  ).toHaveText("1");
  await expect(
    preview
      .getByRole("table", { name: "Table entries" })
      .getByRole("row", { name: /Rain/ })
      .getByRole("cell")
      .first(),
  ).toHaveText("2");
  await preview.getByRole("button", { name: "Rain", exact: true }).click();
  await expect(
    preview
      .getByRole("table", { name: "Table entries" })
      .getByRole("row", { name: /Rain/ }),
  ).toHaveAttribute("aria-current", "true");
  await expect(
    preview.getByRole("region", { name: "Table result" }),
  ).toContainText("Rain");
  await expect(preview).toHaveScreenshot("simple-table-light.png");
  await preview
    .getByRole("button", { name: "Edit content", exact: true })
    .click();
  await preview
    .getByRole("combobox", { name: "Roll mapping", exact: true })
    .selectOption("ranges");
  await preview
    .getByRole("textbox", { name: "Table dice formula", exact: true })
    .fill("1d100-1");
  await preview
    .getByRole("spinbutton", { name: "Range start", exact: true })
    .first()
    .fill("0");
  await preview
    .getByRole("spinbutton", { name: "Range end", exact: true })
    .first()
    .fill("9");
  await preview
    .getByRole("spinbutton", { name: "Range start", exact: true })
    .nth(1)
    .fill("10");
  await preview
    .getByRole("spinbutton", { name: "Range end", exact: true })
    .nth(1)
    .fill("99");
  await preview
    .getByRole("button", { name: "Save table", exact: true })
    .click();
  await expect(
    preview.getByRole("table", { name: "Table entries" }),
  ).toContainText("0–9");
  await preview
    .getByRole("button", { name: "Pin to screen", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  await library
    .getByRole("button", { name: "Import / export content", exact: true })
    .click();
  const exchange = page.getByRole("dialog", {
    name: "Import and export content",
    exact: true,
  });
  await exchange
    .getByRole("combobox", { name: "Export format", exact: true })
    .selectOption("pack");
  await exchange
    .getByRole("button", { name: "Preview export", exact: true })
    .click();
  const downloaded = page.waitForEvent("download");
  await exchange
    .getByRole("button", { name: "Download export", exact: true })
    .click();
  const pack = JSON.parse(
    readFileSync((await (await downloaded).path())!, "utf8"),
  );
  expect(pack.format).toBe("slate-content");
  expect(pack.records[0].fields.definition.rows[0]).toMatchObject({
    from: 0,
    to: 9,
  });
  await page.keyboard.press("Escape");
  await library
    .getByRole("button", { name: "Content packs", exact: true })
    .click();
  await library
    .getByLabel("Import content pack", { exact: true })
    .setInputFiles({
      name: "weather.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(pack)),
    });
  await library
    .getByRole("button", { name: "Install content pack", exact: true })
    .click();
  await library.getByRole("button", { name: "Browse", exact: true }).click();
  await library
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption(`${pack.id}@${pack.version}`);
  await library.getByRole("button", { name: /^Road weather.*table/ }).click();
  preview = page.getByRole("dialog", { name: "Road weather", exact: true });
  await preview
    .getByRole("button", { name: "Roll table", exact: true })
    .click();
  await expect(
    preview.getByRole("region", { name: "Table result" }),
  ).toContainText("1d100-1");
  await expect(preview.getByLabel("Rolled number", { exact: true })).toHaveText(
    /Rolled \d+/,
  );
  const rolledName = await preview
    .getByRole("region", { name: "Table result" })
    .getByRole("heading", { level: 3 })
    .innerText();
  await expect(
    preview
      .getByRole("table", { name: "Table entries" })
      .locator('tr[aria-current="true"]'),
  ).toContainText(rolledName);
  await page.keyboard.press("Escape");
  await library
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption("campaign");
  await library
    .getByRole("button", { name: "Edit Road weather", exact: true })
    .click();
  preview = page.getByRole("dialog", { name: "Road weather", exact: true });
  await preview
    .getByRole("textbox", { name: "Row name", exact: true })
    .first()
    .fill("Sunshine");
  await preview
    .getByRole("button", { name: "Save table", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  const widget = page.getByRole("region", {
    name: "Road weather",
    exact: true,
  });
  await expect(
    widget.getByRole("button", { name: "Sunshine", exact: true }),
  ).toBeVisible();
  await widget.getByRole("button", { name: "Rain", exact: true }).click();
  await saved(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await expect(
    widget.getByRole("button", { name: "Sunshine", exact: true }),
  ).toBeVisible();
  await expect(
    widget.getByRole("region", { name: "Table result" }),
  ).toContainText("Rain");
  await expect(
    widget
      .getByRole("table", { name: "Table entries" })
      .getByRole("row", { name: /Rain/ }),
  ).toHaveAttribute("aria-current", "true");
  expect(errors).toEqual([]);
});

test("weighted tables show two compact columns, highlight each roll and clear selection on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    // Percentile 00 = 100 maps to the fourth weighted outcome.
    Math.random = () => 0.95;
  });
  await page.goto("/");
  await ready(page);
  await appearance(page, "Dark");
  await page.keyboard.press("Alt+p");
  const palette = page.getByRole("dialog", {
    name: "Command palette",
    exact: true,
  });
  await palette
    .getByRole("combobox", { name: "Search widgets", exact: true })
    .fill("Random table");
  await palette
    .getByRole("option", { name: "Random table", exact: true })
    .click();
  const popup = page.getByRole("dialog", { name: "Random table", exact: true });
  await popup
    .getByRole("button", { name: "Create table", exact: true })
    .click();
  const editor = page.getByRole("dialog", {
    name: "Create random table",
    exact: true,
  });
  await editor
    .getByRole("combobox", { name: "Roll mapping", exact: true })
    .selectOption("weighted");
  await editor
    .getByRole("spinbutton", { name: "Weight", exact: true })
    .first()
    .fill("3");
  await editor.getByRole("button", { name: "Save table", exact: true }).click();
  const table = popup.getByRole("table", { name: "Table entries" });
  await expect(table.getByRole("columnheader")).toHaveText(["Roll", "Content"]);
  await expect(
    table.getByRole("row", { name: /Quiet/ }).getByRole("cell").first(),
  ).toHaveText("1–3");
  await expect(
    table
      .getByRole("row", { name: /Footsteps/ })
      .getByRole("cell")
      .first(),
  ).toHaveText("4");
  await table.getByRole("button", { name: "Quiet", exact: true }).click();
  await expect(table.getByRole("row", { name: /Quiet/ })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await table.getByRole("button", { name: "Footsteps", exact: true }).click();
  await expect(table.getByRole("row", { name: /Quiet/ })).not.toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(table.getByRole("row", { name: /Footsteps/ })).toHaveAttribute(
    "aria-current",
    "true",
  );
  expect(
    await table.evaluate((element) => element.getBoundingClientRect().height),
  ).toBeLessThan(120);
  await expect(popup.getByLabel("Rolled number", { exact: true })).toHaveCount(
    0,
  );
  await popup.getByRole("button", { name: "Roll table", exact: true }).click();
  const result = await popup
    .getByRole("region", { name: "Table result" })
    .getByRole("heading", { level: 3 })
    .innerText();
  await expect(table.locator('tr[aria-current="true"]')).toHaveCount(1);
  await expect(table.locator('tr[aria-current="true"]')).toContainText(result);
  const outcome = Number(
    (
      await popup.getByLabel("Rolled number", { exact: true }).innerText()
    ).replace("Rolled ", ""),
  );
  expect(outcome).toBeGreaterThanOrEqual(1);
  expect(outcome).toBeLessThanOrEqual(4);
  await expect(popup.getByLabel("Rolled number", { exact: true })).toHaveText(
    "Rolled 4",
  );
  await expect(table.locator('tr[aria-current="true"]')).toContainText(
    outcome <= 3 ? "Quiet" : "Footsteps",
  );
  await expect(popup).toHaveScreenshot("weighted-table-mobile-dark.png");
  await popup.getByText("Result history · 3", { exact: true }).click();
  await popup
    .getByRole("button", { name: "Clear history", exact: true })
    .click();
  await expect(table.locator('tr[aria-current="true"]')).toHaveCount(0);
  await expect(popup.getByLabel("Rolled number", { exact: true })).toHaveCount(
    0,
  );
  expect(
    await table.evaluate((element) => element.getBoundingClientRect().right),
  ).toBeLessThanOrEqual(390);
});
