import { expect, type Locator, type Page } from "@playwright/test";

export async function saved(page: Page) {
  await expect(
    page.getByRole("status").filter({ hasText: "Saved on this device" }),
  ).toBeVisible();
}

export async function neutralDashboard(page: Page) {
  // Use a real pointer action to remove transient focus/hover differences
  // between an interacted-with dashboard and the same dashboard after reload.
  await page.getByRole("banner").click({ position: { x: 1, y: 1 } });
  await page.mouse.move(0, 0);
  await saved(page);
}

export async function ready(page: Page) {
  await expect(page.getByRole("main", { name: "GM screen" })).toBeVisible();
  await expect(
    page.getByText("Ready for offline play", { exact: true }),
  ).toBeVisible({ timeout: 30_000 });
  await saved(page);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  // Also runs after offline reload: a fallback font must not silently pass.
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.fonts]
          .filter((face) => face.status === "loaded")
          .map((face) => face.family.replaceAll('"', "").replaceAll("'", ""))
          .sort(),
      ),
    )
    .toEqual(["Alegreya Sans", "Cinzel", "Geist"]);
}

export async function appearance(page: Page, mode: "Light" | "Dark") {
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByRole("button", { name: mode, exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    mode.toLowerCase(),
  );
  await saved(page);
}

export async function library(page: Page, query: string) {
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill(query);
  return page.getByRole("dialog", { name: "Campaign library", exact: true });
}

export async function combatant(
  page: Page,
  name: string,
  initiative: number,
  side = "hero",
) {
  await page
    .getByRole("button", { name: "Add combatant", exact: true })
    .click();
  const form = page.getByRole("dialog", { name: "Add combatant", exact: true });
  await form.getByRole("textbox", { name: "Name", exact: true }).fill(name);
  await form
    .getByRole("spinbutton", { name: "Initiative", exact: true })
    .fill(String(initiative));
  await form
    .getByRole("combobox", { name: "Side", exact: true })
    .selectOption(side);
  await form
    .getByRole("button", { name: "Add combatant", exact: true })
    .click();
}

export async function initiativeSettings(page: Page) {
  await page
    .getByRole("region", { name: "Initiative tracker", exact: true })
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  return page.getByRole("dialog", {
    name: "Configure Initiative tracker",
    exact: true,
  });
}

export async function configureInitiativeMode(
  page: Page,
  mode: "nimble" | "classic",
) {
  const settings = await initiativeSettings(page);
  await settings
    .getByRole("combobox", { name: "Initiative mode" })
    .selectOption(mode);
  await settings
    .getByRole("button", { name: "Save tool", exact: true })
    .click();
  await expect(settings).toHaveCount(0);
}

export async function encounter(page: Page) {
  await page
    .getByRole("textbox", { name: "Encounter name", exact: true })
    .fill("The northern gate");
  await combatant(page, "Mira", 18);
  await combatant(page, "Goblin scout", 7, "enemy");
  await combatant(page, "Gatekeeper", 12, "ally");
  await configureInitiativeMode(page, "classic");
  await page
    .getByRole("button", { name: "Roll initiative", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Roll initiative" })
    .getByRole("button", { name: "Start combat" })
    .click();
  await page.getByRole("button", { name: "Damage Mira", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Dice formula", exact: true })
    .fill("2d6 + 3");
  await page.getByRole("button", { name: /^Roll dice/ }).click();
  await expect(page.locator(".result-total")).toHaveText("11");
  await saved(page);
}

// Preserve the complete normalized accessibility tree, including visible text
// that differs from an aria-label. Playwright's semantic snapshot generator
// prunes such text, which is incompatible with recursive strict matching.
export async function expectAria(locator: Locator, name: string) {
  await expect(locator).toBeVisible();
  expect(await locator.ariaSnapshot()).toMatchSnapshot(name);
}

// Click a real empty cell with room for a typical widget, including blank screens.
export async function openWidgetPicker(page: Page) {
  const label = await page.locator(".board").evaluate((board) => {
    const style = getComputedStyle(board);
    const columns = style.gridTemplateColumns.split(" ").length;
    const rows = style.gridTemplateRows.split(" ").length;
    const free = new Set(
      Array.from(board.querySelectorAll(".empty-cell")).map((cell) =>
        cell.getAttribute("aria-label"),
      ),
    );
    const name = (x: number, y: number) =>
      "Add widget at column " + (x + 1) + ", row " + (y + 1);
    let best = "",
      score = 0;
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < columns; x++) {
        let width = Math.min(4, columns - x);
        for (let h = 1; h <= Math.min(5, rows - y); h++) {
          let available = 0;
          while (available < width && free.has(name(x + available, y + h - 1)))
            available++;
          width = Math.min(width, available);
          if (width * h > score) {
            score = width * h;
            best = name(x, y);
          }
        }
      }
    if (!best) throw new Error("No empty grid cell available");
    return best;
  });
  const cell = page.getByRole("button", { name: label, exact: true });
  await cell.click();
  return cell;
}

export async function arrange(page: Page) {
  const button = page.getByRole("button", { name: "Arrange", exact: true });
  if (await button.count()) await button.click();
}
export async function resizeWidget(
  page: Page,
  title: string,
  width: number,
  height: number,
) {
  await arrange(page);
  const tile = page.getByRole("region", { name: title, exact: true });
  const handle = tile.getByRole("button", {
    name: "Resize " + title,
    exact: true,
  });
  const old = await tile.evaluate((element) => ({
    w: parseInt(getComputedStyle(element).gridColumnEnd.replace("span ", "")),
    h: parseInt(getComputedStyle(element).gridRowEnd.replace("span ", "")),
  }));
  for (let i = old.w; i > width; i--) await handle.press("ArrowLeft");
  for (let i = old.h; i > height; i--) await handle.press("ArrowUp");
  for (let i = old.w; i < width; i++) await handle.press("ArrowRight");
  for (let i = old.h; i < height; i++) await handle.press("ArrowDown");
  await expect(tile).toHaveCSS("grid-column-end", "span " + width);
  await expect(tile).toHaveCSS("grid-row-end", "span " + height);
}
