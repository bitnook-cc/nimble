import { test, slateURL } from "./browser-fixtures";
import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ready, appearance } from "./ui-fixtures";

for (const paletteName of ["parchment", "stone"])
  for (const mode of ["Light", "Dark"] as const) {
    test(`keyboard dialogs and contrast in ${paletteName} ${mode.toLowerCase()} theme`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await page.goto(slateURL(page));
      await ready(page);
      await appearance(page, mode);
      await page
        .getByRole("button", { name: "Appearance", exact: true })
        .click();
      await page
        .getByLabel("Palette", { exact: true })
        .selectOption(paletteName);
      await scanAppearance();
      async function scanAppearance() {
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(
          result.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
        ).toEqual([]);
        await page.keyboard.press("Escape");
      }
      const scan = async () => {
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(
          results.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
        ).toEqual([]);
      };
      await scan();
      const opener = page.getByRole("button", {
        name: "Add widget at column 1, row 6",
        exact: true,
      });
      await opener.focus();
      await page.keyboard.press("Enter");
      const catalog = page.getByRole("dialog", {
        name: "Add a widget",
        exact: true,
      });
      await expect(catalog).toBeVisible();
      await scan();
      // Modal focus stays inside during keyboard navigation and returns on Escape.
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press("Tab");
        expect(
          await catalog.evaluate((dialog) =>
            dialog.contains(document.activeElement),
          ),
        ).toBe(true);
      }
      await page.keyboard.press("Escape");
      await expect(opener).toBeFocused();
      await page.keyboard.press("Alt+p");
      const palette = page.getByRole("dialog", {
        name: "Command palette",
        exact: true,
      });
      await palette
        .getByLabel("Search widgets", { exact: true })
        .fill("Counter");
      await page.keyboard.press("Enter");
      const clock = page.getByRole("dialog", {
        name: "Counter",
        exact: true,
      });
      await expect(clock).toBeVisible();
      await scan();
      await clock
        .getByRole("button", { name: "Configure tool", exact: true })
        .click();
      await expect(
        page.getByRole("dialog", {
          name: "Configure Counter",
          exact: true,
        }),
      ).toBeVisible();
      await scan();
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: "Close command palette", exact: true })
        .click();
      for (const name of [
        "Dice roller",
        "Initiative tracker",
        "Notes",
        "Reference",
        "NPC generator",
        "Item library",
        "Random table",
        "Clock & timer",
        "Image card",
        "Checklist",
      ]) {
        await page.keyboard.press("Alt+p");
        const quick = page.getByRole("dialog", {
          name: "Command palette",
          exact: true,
        });
        await quick.getByLabel("Search widgets", { exact: true }).fill(name);
        await quick.getByRole("option", { name, exact: true }).click();
        await scan();
        await page
          .getByRole("button", { name: "Close command palette", exact: true })
          .click();
      }
    });
  }
test("touch targets remain usable with a viewport-filling grid", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto(slateURL(page));
  await ready(page);
  const controls = [
    "Arrange",
    "Command palette",
    "Campaign party",
    "Encounter manager",
    "Appearance",
  ];
  for (const name of controls) {
    const box = await page
      .getByRole("button", { name, exact: true })
      .boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Campaign party", exact: true }).tap();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await context.close();
});
