import { openWidgetPicker } from "./ui-fixtures";
import { expect, test } from "@playwright/test";
import { ready, saved } from "./ui-fixtures";

test.use({
  viewport: { width: 1280, height: 900 },
  locale: "en-GB",
  timezoneId: "UTC",
  colorScheme: "light",
  reducedMotion: "reduce",
});

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-11T12:00:00Z"));
  await page.goto("/");
  await ready(page);
});

async function addNote(page: import("@playwright/test").Page, expand = false) {
  await openWidgetPicker(page);
  await page.getByRole("button", { name: /^Notes Markdown notes/ }).click();
  if (expand)
    await page
      .getByRole("button", { name: "Expand Notes", exact: true })
      .click();
  const note = page.getByRole(expand ? "dialog" : "region", {
    name: "Notes",
    exact: true,
  });
  return {
    note,
    editor: note.getByRole("textbox", { name: "Note text", exact: true }),
    list: note.getByRole("listbox", {
      name: "Reference suggestions",
      exact: true,
    }),
  };
}

test("reference search floats next to the caret inside a grid note and picks by mouse", async ({
  page,
}) => {
  const { note, editor, list } = await addNote(page);
  await editor.fill("Remember @Initiative");
  await expect(list).toBeVisible();
  await expect(editor).toBeFocused();
  const editorBounds = (await editor.boundingBox())!;
  const listBounds = (await list.boundingBox())!;
  // Results float beside the first line instead of pushing the widget down.
  if (listBounds.y < editorBounds.y) {
    expect(listBounds.y + listBounds.height).toBeGreaterThan(editorBounds.y);
    expect(listBounds.y + listBounds.height).toBeLessThan(editorBounds.y + 40);
  } else {
    expect(listBounds.y).toBeLessThan(editorBounds.y + 55);
  }
  expect(listBounds.x).toBeGreaterThan(editorBounds.x + 40);
  await saved(page);
  await expect(page).toHaveScreenshot("inline-rule-dropdown.png");
  await list.getByRole("option", { name: /^Initiative rule/ }).click();
  await expect(editor).toHaveValue(/^Remember \[Initiative\]\(slate:/);
  await expect(list).toHaveCount(0);
  await expect(editor).toBeFocused();
  await note.getByRole("button", { name: "Read note", exact: true }).click();
  await note.getByRole("button", { name: "Initiative", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Initiative", exact: true }),
  ).toBeVisible();
});

test("expanded notes support multiword queries, keyboard selection and Escape without closing the note", async ({
  page,
}) => {
  const { note, editor, list } = await addNote(page, true);
  await editor.fill("Cast @Flame Dart");
  await expect(
    list.getByRole("option", { name: /^Flame Dart spell/ }),
  ).toBeVisible();
  await editor.press("ArrowDown");
  await editor.press("ArrowUp");
  await editor.press("Tab");
  await expect(editor).toHaveValue(/^Cast \[Flame Dart\]\(slate:/);
  await expect(editor).toBeFocused();
  await editor.fill("Look up @no-such-reference-123");
  await expect(list.getByRole("status")).toHaveText("No matching content.");
  await editor.press("Escape");
  await expect(list).toHaveCount(0);
  await expect(note).toBeVisible();
  await expect(editor).toHaveValue("Look up @no-such-reference-123");
  await editor.press("x");
  await expect(list).toBeVisible();
  await note.getByRole("button", { name: "Note details", exact: true }).click();
  await expect(list).toHaveCount(0);
});

test("selecting a reference in the middle preserves the rest of the note and insertion cursor", async ({
  page,
}) => {
  const { editor, list } = await addNote(page, true);
  await editor.fill("Before  after");
  await editor.press("Home");
  for (let i = 0; i < 7; i++) await editor.press("ArrowRight");
  await editor.pressSequentially("@Initiative");
  await expect(editor).toHaveValue("Before @Initiative after");
  await expect(list).toBeVisible();
  await editor.press("Enter");
  await expect(editor).toHaveValue(
    /^Before \[Initiative\]\(slate:[^)]+\) after$/,
  );
  await expect
    .poll(() =>
      editor.evaluate((element: HTMLTextAreaElement) => {
        const caret = element.value.indexOf(") after") + 1;
        return (
          element.selectionStart === caret && element.selectionEnd === caret
        );
      }),
    )
    .toBe(true);
  await editor.pressSequentially(" now");
  await expect(editor).toHaveValue(
    /^Before \[Initiative\]\(slate:[^)]+\) now after$/,
  );
  await saved(page);
  await page.reload();
  await ready(page);
  await expect(
    page.getByRole("region", { name: "Notes", exact: true }),
  ).toContainText("now after");
});

test("dropdown stays on screen for wrapped and scrolled notes in a narrow command popover", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 720 });
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
  await editor.fill(
    "Long lines wrap across the narrow note. ".repeat(30) +
      "\nFind @Initiative",
  );
  await editor.press("Control+End");
  await expect(list).toBeVisible();
  await expect
    .poll(() =>
      editor.evaluate((element: HTMLTextAreaElement) => element.scrollTop),
    )
    .toBeGreaterThan(0);
  const bounds = (await list.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(8);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(382);
  expect(bounds.y).toBeGreaterThanOrEqual(8);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(712);
  await list.getByRole("option", { name: /^Initiative rule/ }).click();
  await expect(editor).toHaveValue(/\nFind \[Initiative\]\(slate:/);
  await editor.fill("Browse @");
  const options = list.getByRole("option");
  await expect(options).toHaveCount(8);
  await editor.press("ArrowUp");
  await expect(options.last()).toHaveAttribute("aria-selected", "true");
  await expect(options.last()).toBeInViewport();
  await editor.press("Escape");
  await expect(note).toBeVisible();
  await expect(list).toHaveCount(0);
});
