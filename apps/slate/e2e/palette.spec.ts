import { expect, test, type Page } from "@playwright/test";
import { appearance, expectAria, ready, saved } from "./ui-fixtures";

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
    Math.random = () => 0.5;
  });
  await page.goto("/");
  await ready(page);
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});
const palette = (page: Page, name = "Command palette") =>
  page.getByRole("dialog", { name, exact: true });
async function choose(page: Page, name: string, query = name) {
  const popup = palette(page);
  await popup
    .getByRole("combobox", { name: "Search widgets", exact: true })
    .fill(query);
  await popup.getByRole("option", { name, exact: true }).click();
  return palette(page, name);
}
async function placements(page: Page) {
  return page.locator(".board .widget-card").evaluateAll((cards) =>
    cards.map((card) => ({
      id: card.getAttribute("data-widget"),
      column: (card as HTMLElement).style.gridColumn,
      row: (card as HTMLElement).style.gridRow,
    })),
  );
}

test("Alt+P opens saved widgets and popup rolls update the same tool without changing the grid", async ({
  page,
}) => {
  const before = await placements(page);
  const formula = page.getByRole("textbox", {
    name: "Dice formula",
    exact: true,
  });
  await formula.focus();
  await page.keyboard.press("Alt+p");
  const search = palette(page).getByRole("combobox", {
    name: "Search widgets",
    exact: true,
  });
  await expect(search).toBeFocused();
  await search.fill("dice");
  await search.press("Enter");
  const popup = palette(page, "Dice roller");
  await popup
    .getByRole("button", { name: "Clear dice formula", exact: true })
    .click();
  await popup.getByRole("button", { name: "d6", exact: true }).click();
  await popup.getByRole("button", { name: "d6", exact: true }).click();
  await popup
    .getByRole("textbox", { name: "Dice formula", exact: true })
    .press("End");
  await popup
    .getByRole("textbox", { name: "Dice formula", exact: true })
    .pressSequentially(" + 1");
  await popup.getByRole("button", { name: /^Roll dice/ }).click();
  await expect(popup.locator(".result-total")).toHaveText("9");
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await expect(formula).toBeFocused();
  await expect(formula).toHaveValue("2d6 + 1");
  await expect(page.locator(".result-total")).toHaveText("9");
  expect(await placements(page)).toEqual(before);
  await saved(page);
});

test("new quick widgets retain their data offline without grid placements or duplicate tools", async ({
  page,
  context,
}) => {
  const before = await placements(page);
  await page.keyboard.press("Meta+p");
  const npc = await choose(page, "NPC generator", "scars");
  await npc.getByRole("button", { name: "Generate NPC", exact: true }).click();
  await npc.getByRole("button", { name: "Save NPC", exact: true }).click();
  const name = (await npc.locator(".npc-name-row h3").textContent())!;
  await page.keyboard.press("Meta+p");
  await expect(npc).toHaveCount(0);
  await saved(page);
  expect(await placements(page)).toEqual(before);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await page.keyboard.press("Alt+p");
  await palette(page)
    .getByRole("combobox", { name: "Search widgets" })
    .fill("npc");
  await expect(palette(page).getByRole("option")).toHaveCount(1);
  await palette(page)
    .getByRole("option", { name: "NPC generator", exact: true })
    .click();
  await expect(
    palette(page, "NPC generator").locator(".npc-name-row h3"),
  ).toHaveText(name);
  await expect(
    palette(page, "NPC generator").locator("summary", {
      hasText: "Saved NPCs (1)",
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  expect(await placements(page)).toEqual(before);
  await page.getByRole("button", { name: "Arrange", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Undo layout change", exact: true }),
  ).toBeDisabled();
});

test("palette navigation, no matches, back, outside click and nested note previews preserve focus", async ({
  page,
}) => {
  const trigger = page.getByRole("button", {
    name: "Command palette",
    exact: true,
  });
  await trigger.click();
  let search = palette(page).getByRole("combobox", { name: "Search widgets" });
  await expect(palette(page).getByRole("option").first()).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await search.press("ArrowUp");
  await expect(palette(page).getByRole("option").last()).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await search.press("ArrowDown");
  await expect(palette(page).getByRole("option").first()).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await search.fill("does not exist");
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(palette(page).getByRole("status")).toContainText(
    "No matching widgets",
  );
  const note = await choose(page, "Notes");
  const editor = note.getByRole("textbox", {
    name: "Note text",
    exact: true,
  });
  await editor.fill("A reminder about @dying");
  await expect(
    note.getByRole("listbox", { name: "Reference suggestions" }),
  ).toBeVisible();
  await editor.press("Enter");
  await expect(editor).toHaveValue(/slate:/);
  await note.getByRole("button", { name: "Read note", exact: true }).click();
  await note.getByRole("button", { name: "Dying", exact: true }).click();
  await expect(palette(page, "Dying")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(note).toBeVisible();
  await expect(
    note.getByRole("button", { name: "Dying", exact: true }),
  ).toBeFocused();
  await note
    .getByRole("button", { name: "Back to command palette", exact: true })
    .click();
  search = palette(page).getByRole("combobox", { name: "Search widgets" });
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("Notes");
  await page.mouse.click(2, 2);
  await expect(palette(page)).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await choose(page, "Notes");
  await expect(
    palette(page, "Notes").getByRole("button", { name: "Dying", exact: true }),
  ).toBeVisible();
});

test("saved encounter names are searchable and reference widgets choose content without a tile", async ({
  page,
}) => {
  const before = await placements(page);
  await page
    .getByRole("textbox", { name: "Encounter name", exact: true })
    .fill("The winter gate");
  await page.keyboard.press("Alt+p");
  await palette(page)
    .getByRole("combobox", { name: "Search widgets" })
    .fill("winter gate");
  await expect(palette(page).getByRole("option")).toHaveCount(1);
  await palette(page).getByRole("option").click();
  await expect(
    palette(page, "Initiative tracker").getByRole("textbox", {
      name: "Encounter name",
      exact: true,
    }),
  ).toHaveValue("The winter gate");
  await palette(page, "Initiative tracker")
    .getByRole("button", { name: "Back to command palette", exact: true })
    .click();
  await choose(page, "Reference");
  await palette(page, "Reference")
    .getByRole("button", { name: "Choose reference", exact: true })
    .click();
  const chooser = palette(page, "Choose reference");
  await chooser
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Dying");
  await chooser
    .locator(".library-title")
    .filter({ has: page.getByText("Dying", { exact: true }) })
    .click();
  const reference = palette(page, "Dying");
  await expect(
    reference.getByRole("heading", { name: "Dying", exact: true }).last(),
  ).toBeVisible();
  await reference
    .getByRole("button", { name: "Open preview", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Dying", exact: true }),
  ).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(reference).toHaveCount(1);
  await reference
    .getByRole("button", { name: "Close command palette", exact: true })
    .click();
  expect(await placements(page)).toEqual(before);
  await saved(page);
});

for (const mode of ["Light", "Dark"] as const) {
  test(`command palette and mobile popup have a compact ${mode.toLowerCase()} layout`, async ({
    page,
  }) => {
    await appearance(page, mode);
    await page
      .getByRole("button", { name: "Command palette", exact: true })
      .click();
    const popup = palette(page);
    await expectAria(popup, `palette-${mode.toLowerCase()}.aria.yml`);
    await page.mouse.move(0, 0);
    await expect(popup).toHaveScreenshot(`palette-${mode.toLowerCase()}.png`);
    await choose(page, "NPC generator");
    const npc = palette(page, "NPC generator");
    await npc
      .getByRole("button", { name: "Generate NPC", exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.mouse.move(0, 0);
    await saved(page);
    await expect(page).toHaveScreenshot(
      `palette-widget-mobile-${mode.toLowerCase()}.png`,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Command palette", exact: true }),
    ).toBeFocused();
  });
}
