import { openWidgetPicker } from "./ui-fixtures";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { unzipSync, strFromU8 } from "fflate";
import { appearance, ready, saved, combatant } from "./ui-fixtures";
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
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));
async function quick(page: Page, name: string) {
  await page.keyboard.press("Alt+p");
  const palette = page.getByRole("dialog", {
    name: "Command palette",
    exact: true,
  });
  await palette.getByLabel("Search widgets", { exact: true }).fill(name);
  await palette.getByRole("option", { name, exact: true }).click();
  return page.getByRole("dialog", { name, exact: true });
}
const editor = (page: Page, name: string) =>
  page.getByRole("dialog", { name: "Configure " + name, exact: true });
async function close(page: Page) {
  await page
    .getByRole("button", { name: "Close command palette", exact: true })
    .click();
  await saved(page);
}
test("counter tiles share manual state with quick access and persist offline", async ({
  page,
  context,
}) => {
  await openWidgetPicker(page);
  const catalog = page.getByRole("dialog", {
    name: "Add a widget",
    exact: true,
  });
  await catalog.getByLabel("Search widgets").fill("Counter");
  await expect(
    catalog.getByRole("button", {
      name: /Travel counter|Step countdown|Progress clock/,
    }),
  ).toHaveCount(0);
  await catalog.getByRole("button", { name: /^Counter/ }).click();
  const tile = page.getByRole("region", { name: "Counter", exact: true });
  await tile
    .getByRole("button", { name: "Increase counter", exact: true })
    .click();
  await tile
    .getByRole("button", { name: "Increase counter", exact: true })
    .click();
  let popup = await quick(page, "Counter");
  await expect(popup.getByLabel("Counter value", { exact: true })).toHaveText(
    "2",
  );
  await popup
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  const form = editor(page, "Counter");
  await form.getByLabel("Tool name", { exact: true }).fill("Gate alarm");
  await form.getByLabel("Starting value", { exact: true }).fill("1");
  await form.getByLabel("Maximum (optional)", { exact: true }).fill("2");
  await form.getByLabel("Target (optional)", { exact: true }).fill("2");
  await form.getByRole("button", { name: "Save tool", exact: true }).click();
  popup = page.getByRole("dialog", { name: "Gate alarm", exact: true });
  await expect(popup.getByRole("status", { name: "", exact: true })).toHaveText(
    "Target reached",
  );
  await popup.getByRole("heading", { name: "Gate alarm", exact: true }).click();
  await expect(popup).toHaveScreenshot("counter-light.png");
  await popup
    .getByRole("button", { name: "Decrease counter", exact: true })
    .click();
  await popup
    .getByRole("button", { name: "Decrease counter", exact: true })
    .click();
  await popup.getByRole("button", { name: "Reset", exact: true }).click();
  await close(page);
  await expect(
    page
      .getByRole("region", { name: "Gate alarm", exact: true })
      .getByLabel("Counter value", { exact: true }),
  ).toHaveText("1");
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await expect(
    page
      .getByRole("region", { name: "Gate alarm", exact: true })
      .getByLabel("Counter value", { exact: true }),
  ).toHaveText("1");
});
test("stopwatch and timer reconcile time while closed and retain acknowledgement offline", async ({
  page,
  context,
}) => {
  let watch = await quick(page, "Clock & timer");
  await watch
    .getByRole("button", { name: "Stopwatch mode", exact: true })
    .click();
  await watch
    .getByRole("button", { name: "Start / resume", exact: true })
    .click();
  await close(page);
  await page.clock.setFixedTime(new Date("2026-10-11T12:00:45Z"));
  watch = await quick(page, "Clock & timer");
  await watch
    .getByRole("button", { name: "Stopwatch mode", exact: true })
    .click();
  await expect(watch.getByLabel("Elapsed time", { exact: true })).toHaveText(
    "00:00:45",
  );
  await watch.getByRole("button", { name: "Pause", exact: true }).click();
  await close(page);
  let timer = await quick(page, "Clock & timer");
  await timer.getByRole("button", { name: "Timer mode", exact: true }).click();
  await timer
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  const form = editor(page, "Clock & timer");
  await form.getByLabel("Duration (seconds)", { exact: true }).fill("10");
  await form.getByRole("button", { name: "Save tool", exact: true }).click();
  await timer
    .getByRole("button", { name: "Start / resume", exact: true })
    .click();
  await close(page);
  await context.setOffline(true);
  await page.clock.setFixedTime(new Date("2026-10-11T12:01:00Z"));
  await page.reload();
  await ready(page);
  timer = await quick(page, "Clock & timer");
  await expect(timer.getByRole("status")).toHaveText("Time is up");
  await timer.getByRole("button", { name: "Acknowledge", exact: true }).click();
  await expect(timer.getByRole("status")).toHaveText(
    "Time is up · acknowledged",
  );
  await close(page);
  await page.reload();
  await ready(page);
  timer = await quick(page, "Clock & timer");
  await expect(
    timer.getByRole("button", { name: "Acknowledge", exact: true }),
  ).toHaveCount(0);
  await close(page);
  watch = await quick(page, "Clock & timer");
  await watch
    .getByRole("button", { name: "Stopwatch mode", exact: true })
    .click();
  await expect(watch.getByLabel("Elapsed time", { exact: true })).toHaveText(
    "00:00:45",
  );
});
test("counter decrements on round advancement and combat undo with no reload consumption", async ({
  page,
  context,
}) => {
  await combatant(page, "Mira", 10);
  await combatant(page, "Guard", 5, "enemy");
  let popup = await quick(page, "Counter");
  await popup
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  const form = editor(page, "Counter");
  await form.getByLabel("Starting value", { exact: true }).fill("3");
  await form.getByLabel("Current value", { exact: true }).fill("3");
  await form
    .getByLabel("Linked tracker", { exact: true })
    .selectOption({ label: "Initiative tracker" });
  await form
    .getByLabel("Automatic change", { exact: true })
    .selectOption("decrement");
  await form.getByLabel("Target (optional)", { exact: true }).fill("0");
  await form.getByRole("button", { name: "Save tool", exact: true }).click();
  await close(page);
  await page.getByRole("button", { name: "Begin combat", exact: true }).click();
  await page.getByRole("button", { name: "Next turn", exact: true }).click();
  popup = await quick(page, "Counter");
  await expect(popup.getByLabel("Counter value", { exact: true })).toHaveText(
    "3",
  );
  await close(page);
  await page.getByRole("button", { name: "Next turn", exact: true }).click();
  popup = await quick(page, "Counter");
  await expect(popup.getByLabel("Counter value", { exact: true })).toHaveText(
    "2",
  );
  await close(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await page
    .getByRole("button", { name: "Undo combat change", exact: true })
    .click();
  popup = await quick(page, "Counter");
  await expect(popup.getByLabel("Counter value", { exact: true })).toHaveText(
    "3",
  );
  await popup
    .getByRole("button", { name: "Pause linkage", exact: true })
    .click();
  await close(page);
  await page.getByRole("button", { name: "Next turn", exact: true }).click();
  popup = await quick(page, "Counter");
  await expect(popup.getByLabel("Counter value", { exact: true })).toHaveText(
    "3",
  );
});
test("table creation saves library content, rejects uncovered ranges and renders Markdown references", async ({
  page,
}) => {
  const popup = await quick(page, "Random table");
  await popup
    .getByRole("button", { name: "Create table", exact: true })
    .click();
  const form = page.getByRole("dialog", {
    name: "Create random table",
    exact: true,
  });
  await form
    .getByRole("combobox", { name: "Roll mapping", exact: true })
    .selectOption("ranges");
  await form
    .getByRole("spinbutton", { name: "Range end", exact: true })
    .first()
    .fill("2");
  await form.getByRole("button", { name: "Save table", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("uncovered");
  await form
    .getByRole("spinbutton", { name: "Range end", exact: true })
    .first()
    .fill("3");
  await form
    .getByRole("button", { name: "Insert reference", exact: true })
    .first()
    .click();
  const library = page.getByRole("dialog", {
    name: "Choose reference",
    exact: true,
  });
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Grappled");
  await library.getByRole("button", { name: /^Grappled/ }).click();
  await form.getByRole("button", { name: "Save table", exact: true }).click();
  await popup.getByRole("button", { name: "Quiet", exact: true }).click();
  const result = popup.getByRole("region", {
    name: "Table result",
    exact: true,
  });
  await result.getByText("Result details", { exact: true }).click();
  await result
    .getByRole("button", { name: "Grappled/Restrained", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Grappled/Restrained", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await close(page);
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  const browse = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await browse
    .getByRole("combobox", { name: "Content source", exact: true })
    .selectOption("campaign");
  await browse
    .getByRole("combobox", { name: "Content type", exact: true })
    .selectOption("table");
  await expect(
    browse.getByRole("button", { name: "Edit Random table", exact: true }),
  ).toBeVisible();
});
test("counters enforce bounds, fractional steps and target completion", async ({
  page,
  context,
}) => {
  let popup = await quick(page, "Counter");
  await popup
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  const form = editor(page, "Counter");
  await form.getByLabel("Step size", { exact: true }).fill("0.5");
  await form.getByLabel("Maximum (optional)", { exact: true }).fill("1");
  await form.getByLabel("Target (optional)", { exact: true }).fill("1");
  await form.getByRole("button", { name: "Save tool", exact: true }).click();
  await popup
    .getByRole("button", { name: "Increase counter", exact: true })
    .click();
  await expect(
    popup.getByLabel("Counter value", { exact: true }),
  ).toContainText("0.5");
  await popup
    .getByRole("button", { name: "Increase counter", exact: true })
    .click();
  await expect(
    popup.getByRole("button", { name: "Increase counter", exact: true }),
  ).toBeDisabled();
  await expect(popup.getByRole("status", { name: "", exact: true })).toHaveText(
    "Target reached",
  );
  await close(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  popup = await quick(page, "Counter");
  await expect(
    popup.getByLabel("Counter value", { exact: true }),
  ).toContainText("1");
});
test("mobile dark checklists edit, indent, reorder, duplicate and persist completion", async ({
  page,
  context,
}) => {
  await appearance(page, "Dark");
  await page.setViewportSize({ width: 390, height: 844 });
  let popup = await quick(page, "Checklist");
  for (const text of ["Prepare camp", "Find water"]) {
    await popup.getByLabel("New checklist entry", { exact: true }).fill(text);
    await popup.getByRole("button", { name: "Add", exact: true }).click();
  }
  await popup
    .getByRole("checkbox", { name: "Prepare camp", exact: true })
    .check();
  await popup
    .getByRole("button", { name: "Move Find water up", exact: true })
    .click();
  await popup
    .getByRole("button", { name: "Duplicate Find water", exact: true })
    .click();
  await popup
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  const form = editor(page, "Checklist");
  await form
    .getByLabel("Entry text", { exact: true })
    .nth(1)
    .fill("Check waterskins");
  await form.getByLabel("Indent", { exact: true }).nth(1).selectOption("1");
  await form.getByRole("button", { name: "Save tool", exact: true }).click();
  await expect(popup.getByRole("status")).toHaveText("1 / 3 complete");
  await popup.getByRole("heading", { name: "Checklist", exact: true }).click();
  await expect(popup).toHaveScreenshot("checklist-mobile-dark.png");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await close(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  popup = await quick(page, "Checklist");
  await expect(
    popup.getByRole("checkbox", { name: "Prepare camp", exact: true }),
  ).toBeChecked();
  await expect(
    popup.getByRole("checkbox", { name: "Check waterskins", exact: true }),
  ).toBeVisible();
});
test("image cards save local bytes, pan and zoom offline and produce a verified campaign ZIP", async ({
  page,
  context,
}) => {
  let popup = await quick(page, "Image card");
  await popup.getByLabel("Import local image", { exact: true }).setInputFiles({
    name: "fake.png",
    mimeType: "image/png",
    buffer: Buffer.from("invalid image"),
  });
  await expect(popup.getByRole("alert")).toBeVisible();
  await popup
    .getByLabel("Import local image", { exact: true })
    .setInputFiles("public/icon-192.png");
  await expect(
    popup.getByRole("img", { name: "Campaign image", exact: true }),
  ).toBeVisible();
  await popup
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  const form = editor(page, "Image card");
  await form.getByLabel("Caption", { exact: true }).fill("Camp handout");
  await form.getByRole("button", { name: "Save tool", exact: true }).click();
  const imageView = popup.getByRole("region", { name: "Interactive image" });
  await expect(popup.getByRole("slider")).toHaveCount(0);
  await imageView.hover();
  await page.mouse.wheel(0, -Math.log(2) / 0.002);
  await expect(popup.getByLabel("Image zoom", { exact: true })).toHaveText(
    "200%",
  );
  const bounds = (await imageView.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width / 2 + 40,
    bounds.y + bounds.height / 2 + 25,
    { steps: 5 },
  );
  await page.mouse.up();
  const transform = await popup.getByRole("img").getAttribute("style");
  expect(transform).toContain("scale(2)");
  await saved(page);
  await popup.getByRole("heading", { name: "Image card", exact: true }).click();
  await expect(popup).toHaveScreenshot("image-card-light.png");
  await close(page);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  popup = await quick(page, "Image card");
  await expect(
    popup.getByRole("img", { name: "Camp handout", exact: true }),
  ).toBeVisible();
  await expect(popup.getByLabel("Image zoom", { exact: true })).toHaveText(
    "200%",
  );
  await expect(popup.getByRole("img")).toHaveAttribute("style", transform!);
  await close(page);
  await page
    .getByRole("button", { name: "Workspace status", exact: true })
    .click();
  const status = page.getByRole("region", {
    name: "Workspace status details",
    exact: true,
  });
  await status
    .getByRole("button", { name: "Check campaign backup", exact: true })
    .click();
  await expect(
    status.getByRole("status").filter({ hasText: "Backup verified:" }),
  ).toContainText("Backup verified: 1 local attachments");
  const downloaded = page.waitForEvent("download");
  await status
    .getByRole("button", { name: "Download backup", exact: true })
    .click();
  const files = unzipSync(readFileSync((await (await downloaded).path())!));
  expect(files["assets/0"]).toEqual(
    new Uint8Array(readFileSync("public/icon-192.png")),
  );
  expect(JSON.parse(strFromU8(files["manifest.json"])).schemaVersion).toBe(19);
  await page.keyboard.press("Escape");
  popup = await quick(page, "Image card");
  await popup.getByRole("button", { name: "Fit image", exact: true }).click();
  await close(page);
  await page
    .getByRole("button", { name: "Workspace status", exact: true })
    .click();
  await expect(status).toContainText(
    "campaign changed since its last backup check",
  );
});

test("deadline timers reject past dates, start immediately and preserve paused extensions", async ({
  page,
}) => {
  let popup = await quick(page, "Clock & timer");
  await popup
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  const form = editor(page, "Clock & timer");
  await form
    .getByLabel("Optional local deadline", { exact: true })
    .fill("2026-10-10T12:00");
  await form.getByRole("button", { name: "Save tool", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText(
    "one second and seven days",
  );
  await form
    .getByLabel("Optional local deadline", { exact: true })
    .fill("2026-10-11T12:01");
  await form.getByRole("button", { name: "Save tool", exact: true }).click();
  await expect(popup.getByLabel("Time remaining", { exact: true })).toHaveText(
    "00:01:00",
  );
  await close(page);
  await page.clock.setFixedTime(new Date("2026-10-11T12:00:30Z"));
  popup = await quick(page, "Clock & timer");
  await expect(popup.getByLabel("Time remaining", { exact: true })).toHaveText(
    "00:00:30",
  );
  await popup.getByRole("button", { name: "Pause", exact: true }).click();
  await popup.getByRole("button", { name: "+1 minute", exact: true }).click();
  await close(page);
  await page.clock.setFixedTime(new Date("2026-10-11T12:05:00Z"));
  await page.reload();
  await ready(page);
  popup = await quick(page, "Clock & timer");
  await expect(popup.getByLabel("Time remaining", { exact: true })).toHaveText(
    "00:01:30",
  );
});

test("counter increments on turns, retains manual controls while linked and survives reset/undo", async ({
  page,
}) => {
  await combatant(page, "Mira", 10);
  await combatant(page, "Guard", 5, "enemy");
  let popup = await quick(page, "Counter");
  await popup
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  const form = editor(page, "Counter");
  await form.getByLabel("Step size", { exact: true }).fill("0.5");
  await form
    .getByLabel("Linked tracker", { exact: true })
    .selectOption({ label: "Initiative tracker" });
  await form.getByLabel("Combat trigger", { exact: true }).selectOption("turn");
  await form
    .getByLabel("Automatic change", { exact: true })
    .selectOption("increment");
  await form.getByRole("button", { name: "Save tool", exact: true }).click();
  await expect(popup).toContainText("+0.5 each turn");
  await close(page);
  await page.getByRole("button", { name: "Begin combat", exact: true }).click();
  popup = await quick(page, "Counter");
  await expect(popup.getByLabel("Counter value", { exact: true })).toHaveText(
    "0",
  );
  await close(page);
  await page.getByRole("button", { name: "Next turn", exact: true }).click();
  popup = await quick(page, "Counter");
  await expect(popup.getByLabel("Counter value", { exact: true })).toHaveText(
    "0.5",
  );
  await popup
    .getByRole("button", { name: "Increase counter", exact: true })
    .click();
  await close(page);
  await page
    .getByRole("button", { name: "Undo combat change", exact: true })
    .click();
  popup = await quick(page, "Counter");
  await expect(popup.getByLabel("Counter value", { exact: true })).toHaveText(
    "0.5",
  );
  await close(page);
  await page.getByRole("button", { name: "Next turn", exact: true }).click();
  popup = await quick(page, "Counter");
  await popup.getByRole("button", { name: "Reset", exact: true }).click();
  await close(page);
  await page
    .getByRole("button", { name: "Undo combat change", exact: true })
    .click();
  popup = await quick(page, "Counter");
  await expect(popup.getByLabel("Counter value", { exact: true })).toHaveText(
    "0",
  );
  await popup
    .getByRole("button", { name: "Pause linkage", exact: true })
    .click();
  await popup
    .getByRole("button", { name: "Increase counter", exact: true })
    .click();
  await expect(popup.getByLabel("Counter value", { exact: true })).toHaveText(
    "0.5",
  );
});

test("one compact time widget shares clock, timer and stopwatch state between tile and palette offline", async ({
  page,
  context,
}) => {
  await openWidgetPicker(page);
  const catalog = page.getByRole("dialog", {
    name: "Add a widget",
    exact: true,
  });
  await catalog.getByLabel("Search widgets").fill("time");
  await expect(
    catalog.getByRole("button", { name: /^Stopwatch|^Countdown timer/ }),
  ).toHaveCount(0);
  await catalog.getByRole("button", { name: /^Clock & timer/ }).click();
  const tile = page.getByRole("region", { name: "Clock & timer", exact: true });
  await expect(tile.getByLabel("Current time", { exact: true })).toHaveText(
    "12:00:00",
  );
  await expect(
    tile.getByRole("button", { name: "Clock mode", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  // Controls are compact icons rather than full-width labelled action buttons.
  for (const name of [
    "Clock mode",
    "Timer mode",
    "Stopwatch mode",
    "Configure tool",
  ]) {
    const box = await tile
      .getByRole("button", { name, exact: true })
      .boundingBox();
    expect(box!.width).toBeLessThanOrEqual(32);
    expect(box!.height).toBeLessThanOrEqual(32);
  }
  await tile
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  let form = editor(page, "Clock & timer");
  await form.getByLabel("Duration (seconds)", { exact: true }).fill("10");
  await form.getByRole("button", { name: "Save tool", exact: true }).click();
  await tile.getByRole("button", { name: "Timer mode", exact: true }).click();
  await tile
    .getByRole("button", { name: "Start / resume", exact: true })
    .click();
  await tile
    .getByRole("button", { name: "Stopwatch mode", exact: true })
    .click();
  await tile
    .getByRole("button", { name: "Start / resume", exact: true })
    .click();
  await saved(page);
  await page.clock.setFixedTime(new Date("2026-10-11T12:00:05Z"));
  let popup = await quick(page, "Clock & timer");
  await expect(popup.getByLabel("Elapsed time", { exact: true })).toHaveText(
    "00:00:05",
  );
  await popup.getByRole("button", { name: "Timer mode", exact: true }).click();
  await expect(popup.getByLabel("Time remaining", { exact: true })).toHaveText(
    "00:00:05",
  );
  await popup
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  form = editor(page, "Clock & timer");
  await form.getByLabel("Clock format", { exact: true }).selectOption("12h");
  await form.getByRole("button", { name: "Save tool", exact: true }).click();
  await expect(popup.getByLabel("Time remaining", { exact: true })).toHaveText(
    "00:00:05",
  );
  await popup.getByRole("button", { name: "Clock mode", exact: true }).click();
  await expect(popup.getByLabel("Current time", { exact: true })).toContainText(
    "12:00:05",
  );
  await close(page);
  await context.setOffline(true);
  await page.clock.setFixedTime(new Date("2026-10-11T12:00:15Z"));
  await page.reload();
  await ready(page);
  await expect(tile.getByRole("status")).toHaveText(
    "Local time · timer finished",
  );
  popup = await quick(page, "Clock & timer");
  await popup.getByRole("button", { name: "Timer mode", exact: true }).click();
  await expect(popup.getByRole("status")).toHaveText("Time is up");
  await popup.getByRole("button", { name: "Acknowledge", exact: true }).click();
  await popup.getByRole("button", { name: "Restart", exact: true }).click();
  await expect(popup.getByLabel("Time remaining", { exact: true })).toHaveText(
    "00:00:10",
  );
  await popup.getByRole("button", { name: "Reset", exact: true }).click();
  await popup
    .getByRole("button", { name: "Stopwatch mode", exact: true })
    .click();
  await expect(popup.getByLabel("Elapsed time", { exact: true })).toHaveText(
    "00:00:15",
  );
  await popup.getByRole("button", { name: "Pause", exact: true }).click();
  await popup.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(popup.getByLabel("Elapsed time", { exact: true })).toHaveText(
    "00:00:00",
  );
  await close(page);
});

for (const theme of ["Light", "Dark"] as const)
  test(`compact time widget has a reviewed ${theme.toLowerCase()} layout and mobile controls`, async ({
    page,
  }) => {
    await appearance(page, theme);
    const popup = await quick(page, "Clock & timer");
    await popup
      .getByRole("button", { name: "Timer mode", exact: true })
      .click();
    await popup
      .getByRole("heading", { name: "Clock & timer", exact: true })
      .click();
    await expect(popup).toHaveScreenshot(`time-${theme.toLowerCase()}.png`);
    await close(page);
    await page.setViewportSize({ width: 390, height: 844 });
    const mobile = await quick(page, "Clock & timer");
    await mobile
      .getByRole("button", { name: "Stopwatch mode", exact: true })
      .click();
    await mobile
      .getByRole("button", { name: "Start / resume", exact: true })
      .click();
    await mobile
      .getByRole("heading", { name: "Clock & timer", exact: true })
      .click();
    await expect(mobile).toHaveScreenshot(
      `time-mobile-${theme.toLowerCase()}.png`,
    );
    const box = await mobile.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });
