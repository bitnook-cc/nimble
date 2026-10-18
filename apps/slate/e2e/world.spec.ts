import { expect, type Page, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { test, slateURL, disconnect } from "./browser-fixtures";
import { ready, saved, appearance } from "./ui-fixtures";
import type { AppData } from "../src/model";
import type { ContentRecord } from "../src/content-schema";
import { referenceMarkdown } from "../src/references";

test.use({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
  colorScheme: "light",
});
test.beforeEach(async ({ page }) => {
  await page.goto(slateURL(page));
  await readyWorld(page);
});
async function readyWorld(page: Page) {
  // The writing surface need not display Cinzel. Explicitly load it so the
  // existing offline font check verifies availability even when it is unused.
  await expect(
    page.getByRole("main", { name: "GM screen", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Ready for offline play", { exact: true }),
  ).toBeVisible({ timeout: 30_000 });
  await saved(page);
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.fonts].some((face) => face.family.includes("Cinzel")),
      ),
    )
    .toBe(true);
  await page.evaluate(async () => {
    await Promise.all(
      [...document.fonts]
        .filter((face) => face.family.includes("Cinzel"))
        .map((face) => face.load()),
    );
  });
  await ready(page);
}
async function worldTab(page: Page) {
  await page
    .getByRole("button", { name: "Manage screens", exact: true })
    .click();
  const manager = page.getByRole("dialog", {
    name: "Campaign screens",
    exact: true,
  });
  await manager
    .getByRole("combobox", { name: "Tab type", exact: true })
    .selectOption("world");
  await manager.getByLabel("New screen name", { exact: true }).fill("World");
  await manager
    .getByRole("button", { name: "Create screen", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "World editor", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Arrange", exact: true }),
  ).toHaveCount(0);
}
async function settled(page: Page) {
  await expect(
    page.getByRole("status").filter({ hasText: /^\d+ references indexed$/ }),
  ).toBeVisible({ timeout: 30_000 });
  await saved(page);
}
async function namedNote(page: Page, title: string, body: string) {
  await page.getByRole("button", { name: "New note", exact: true }).click();
  const document = page.getByRole("region", {
    name: "World document",
    exact: true,
  });
  await document
    .locator("summary")
    .filter({ hasText: /^Document metadata/ })
    .click();
  await document.getByLabel("Document title", { exact: true }).fill(title);
  await document
    .getByRole("textbox", { name: "Document text", exact: true })
    .click();
  await document
    .getByRole("textbox", { name: "Document text", exact: true })
    .fill(body);
  await expect(
    document.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  return document;
}
async function selectText(editor: Locator, text: string) {
  await editor.evaluate((element, text) => {
    element.focus();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const start = node.textContent!.indexOf(text);
      if (start < 0) continue;
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + text.length);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
      return;
    }
    throw new Error("Selected passage not found");
  }, text);
  await editor.dispatchEvent("mouseup");
}
async function markdownBody(document: Locator) {
  await document
    .getByRole("button", { name: "Markdown source", exact: true })
    .click();
  const source = await document
    .getByRole("textbox", { name: "Document Markdown source", exact: true })
    .inputValue();
  await document
    .getByRole("button", { name: "Markdown source", exact: true })
    .click();
  return source.slice(source.indexOf("\n---\n") + 5);
}
async function addHeader(page: Page, title: string, tags: string) {
  await page
    .getByRole("button", { name: "Add relationship", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Add header relationship",
    exact: true,
  });
  await dialog
    .getByRole("button", { name: "Choose relationship target", exact: true })
    .click();
  const picker = page.getByRole("dialog", {
    name: "Choose reference",
    exact: true,
  });
  await picker
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill(title);
  await picker
    .getByRole("button", { name: new RegExp(`^${title} note`) })
    .click();
  await dialog.getByLabel("Relationship tags", { exact: true }).fill(tags);
  await dialog
    .getByRole("button", { name: "Add relationship", exact: true })
    .click();
  await settled(page);
}
async function referencesInDatabase(page: Page, source: string) {
  return page.evaluate(
    (source) =>
      new Promise<number>((resolve, reject) => {
        const request = indexedDB.open("nimble-slate-relationships", 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("relationships"),
            rows = tx.objectStore("relationships").getAll();
          tx.oncomplete = () => {
            db.close();
            resolve(
              rows.result
                .flatMap(
                  (row: { references: { source: string }[] }) => row.references,
                )
                .filter((row: { source: string }) => row.source === source)
                .length,
            );
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    source,
  );
}

test("selected text expands into linked notes, separate header relationships survive unlinking and the world works offline", async ({
  page,
  context,
}) => {
  await worldTab(page);
  const document = await namedNote(
    page,
    "Mara",
    "Mara secretly serves the Ashen Court.",
  );
  await selectText(
    document.getByRole("textbox", { name: "Document text", exact: true }),
    "Ashen Court",
  );
  await document
    .getByRole("button", { name: "Expand selection", exact: true })
    .click();
  const expand = page.getByRole("dialog", {
    name: "Expand into a linked note",
    exact: true,
  });
  await expand.getByLabel("New note category", { exact: true }).fill("Faction");
  await expand
    .getByLabel("Relationship tags", { exact: true })
    .fill("member-of, secret");
  await expand
    .getByRole("button", { name: "Create linked note", exact: true })
    .click();
  await expect(
    document.getByRole("heading", { name: "Ashen Court", exact: true }),
  ).toBeVisible();
  await settled(page);
  await expect(
    page.getByRole("button", { name: "Open Mara", exact: true }),
  ).toBeVisible();
  await document
    .getByRole("button", { name: "Back to previous document", exact: true })
    .click();
  await expect(
    document.locator("summary").filter({ hasText: /^Relationships \(1\)/ }),
  ).toBeVisible();
  await addHeader(page, "Ashen Court", "owes-money");
  await addHeader(page, "Ashen Court", "rival, political");
  await expect(document.locator(".world-relationship-row")).toHaveCount(3);
  await document
    .getByRole("button", { name: "Edit inline relationship tags", exact: true })
    .click();
  const edit = page.getByRole("dialog", {
    name: "Edit relationship tags",
    exact: true,
  });
  await edit
    .getByLabel("Relationship tags", { exact: true })
    .fill("member of, secret");
  await edit
    .getByRole("button", { name: "Save relationship tags", exact: true })
    .click();
  await settled(page);
  await expect(
    document
      .locator(".world-relationship-row")
      .filter({ hasText: "member of" }),
  ).toHaveCount(1);
  await document
    .getByRole("button", { name: "Markdown source", exact: true })
    .click();
  const source = document.getByRole("textbox", {
    name: "Document Markdown source",
    exact: true,
  });
  await expect(source).toHaveValue(/relationships:/);
  await expect(source).toHaveValue(/owes-money/);
  await expect(source).toHaveValue(/tag=member\+of/);
  await expect(source).not.toHaveValue(/relationships:[\s\S]*\bid:/);
  await document
    .getByRole("button", { name: "Markdown source", exact: true })
    .click();
  await document
    .getByRole("button", {
      name: "Remove inline reference to Ashen Court",
      exact: true,
    })
    .click();
  await settled(page);
  await expect(document.locator(".world-relationship-row")).toHaveCount(2);
  await expect(
    document.getByRole("textbox", { name: "Document text", exact: true }),
  ).toHaveText("Mara secretly serves the Ashen Court.");
  await expect(
    page.getByRole("button", { name: "Open Ashen Court", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Rebuild relationship cache", exact: true })
    .click();
  await settled(page);
  await page.reload();
  await readyWorld(page);
  await settled(page);
  await disconnect(context);
  await page.reload();
  await readyWorld(page);
  await settled(page);
  await expect(
    page
      .getByRole("region", { name: "World document", exact: true })
      .getByRole("heading", { name: "Mara", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".world-relationship-row")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Open Ashen Court", exact: true })
    .press("Enter");
  await expect(
    document.getByRole("heading", { name: "Ashen Court", exact: true }),
  ).toBeVisible();
});

test("raw Markdown remains authoritative, malformed headers are preserved, and a divergent cache can be rebuilt", async ({
  page,
}) => {
  await worldTab(page);
  const document = await namedNote(page, "Harbour", "The docks.");
  await document
    .getByRole("button", { name: "Markdown source", exact: true })
    .click();
  const editor = document.getByRole("textbox", {
    name: "Document Markdown source",
    exact: true,
  });
  await editor.fill(
    "---\ntitle: Harbour\ncategory: Place\nrelationships:\n  - target: lost-city\n    tags: [ruined]\n  - target: lost-city\n    tags: [secret]\n---\nVisit @lost-city:dangerous.\n",
  );
  await settled(page);
  await expect(document.locator(".world-relationship-row")).toHaveCount(3);
  await expect(document).toContainText("Missing: local::lost-city");
  const snapshot = await page.evaluate(
    () =>
      new Promise<AppData>((resolve, reject) => {
        const request = indexedDB.open("nimble-slate", 3);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("state"),
            value = tx.objectStore("state").get("app");
          tx.oncomplete = () => {
            db.close();
            resolve(value.result);
          };
        };
      }),
  );
  const source =
    "local::" +
    snapshot.campaigns[0].content.find((record) => record.title === "Harbour")!
      .id;
  expect(await referencesInDatabase(page, source)).toBe(3);
  const original = await editor.inputValue();
  await editor.fill("---\nrelationships: [\n---\nKeep my draft.");
  await expect(document.getByRole("alert")).toContainText(
    "document is preserved",
  );
  await expect(editor).toHaveValue(/Keep my draft/);
  await editor.fill(original);
  await settled(page);
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("nimble-slate-relationships", 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("relationships", "readwrite");
          tx.objectStore("relationships").clear();
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  expect(await referencesInDatabase(page, source)).toBe(0);
  await page
    .getByRole("button", { name: "Rebuild relationship cache", exact: true })
    .click();
  await settled(page);
  expect(await referencesInDatabase(page, source)).toBe(3);
  await expect(editor).toHaveValue(original);
});

test("world views fit desktop and phone themes, preserve node positions, and keep the dashboard available", async ({
  page,
}, info) => {
  await worldTab(page);
  const document = await namedNote(
    page,
    "Greyhaven",
    "The city controls its harbour.",
  );
  await document.getByRole("button", { name: "Read", exact: true }).click();
  await settled(page);
  const node = page.getByRole("button", {
    name: "Open Greyhaven",
    exact: true,
  });
  const box = (await node.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 45,
    box.y + box.height / 2 + 30,
    { steps: 8 },
  );
  await page.mouse.up();
  await saved(page);
  await page.reload();
  await readyWorld(page);
  await settled(page);
  const restored = (await node.boundingBox())!;
  expect(restored.x).toBeGreaterThan(box.x + 25);
  await page
    .getByRole("button", { name: "Reset graph view", exact: true })
    .click();
  if (!info.project.name)
    await expect(
      page.getByRole("group", { name: "World editor", exact: true }),
    ).toHaveScreenshot("world-desktop-light.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await appearance(page, "Dark");
  await page.getByRole("button", { name: "Graph", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Relationship graph", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "World document", exact: true }),
  ).toBeHidden();
  expect(
    await page.evaluate(
      () =>
        globalThis.document.documentElement.scrollWidth <= innerWidth &&
        globalThis.document.documentElement.scrollHeight <= innerHeight + 1,
    ),
  ).toBe(true);
  if (!info.project.name)
    await expect(
      page.getByRole("group", { name: "World editor", exact: true }),
    ).toHaveScreenshot("world-mobile-dark.png");
  await page
    .getByRole("combobox", { name: "Current screen", exact: true })
    .selectOption({ label: "Session screen" });
  await expect(
    page.getByRole("region", { name: "Initiative tracker", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Arrange", exact: true }),
  ).toBeVisible();
});

test("writing renders legacy references as links and right-click actions edit links or selected passages safely", async ({
  page,
  context,
}) => {
  await worldTab(page);
  await namedNote(page, "Ashen Court", "The court.");
  const court = await page
    .getByRole("button", { name: "Open Ashen Court", exact: true })
    .getAttribute("data-target");
  await namedNote(page, "Harbour", "The harbour.");
  const document = await namedNote(
    page,
    "Mara",
    `Mara serves [the Court](slate:${encodeURIComponent(court!)}?tag=old) by the docks.`,
  );
  await settled(page);
  await addHeader(page, "Ashen Court", "ally");
  const editor = document.getByRole("textbox", {
    name: "Document text",
    exact: true,
  });
  await expect(
    editor.getByRole("link", { name: "the Court", exact: true }),
  ).toHaveAttribute("href", /^slate:local::/);
  await expect(editor).not.toContainText("slate:");
  expect(await markdownBody(document)).toContain("%3A%3A");
  const menu = page.getByRole("menu", { name: "Edit document", exact: true });
  async function onLink(label: string, action: string) {
    await editor
      .getByRole("link", { name: label, exact: true })
      .click({ button: "right" });
    await menu.getByRole("menuitem", { name: action, exact: true }).click();
  }
  await onLink("the Court", "Edit relationship tags");
  const tags = page.getByRole("dialog", {
    name: "Edit relationship tags",
    exact: true,
  });
  await tags
    .getByLabel("Relationship tags", { exact: true })
    .fill("loyal, covert");
  await tags
    .getByRole("button", { name: "Save relationship tags", exact: true })
    .click();
  await expect(
    editor.getByRole("link", { name: "the Court", exact: true }),
  ).toHaveAttribute("href", /tag=loyal&tag=covert/);
  await onLink("the Court", "Edit link text");
  const edit = page.getByRole("dialog", {
    name: "Edit reference",
    exact: true,
  });
  await edit.getByLabel("Link text", { exact: true }).fill("The Ashen Court");
  await edit
    .getByRole("button", { name: "Save reference", exact: true })
    .click();
  await onLink("The Ashen Court", "Change reference");
  let picker = page.getByRole("dialog", {
    name: "Choose reference",
    exact: true,
  });
  await picker
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Harbour");
  await picker.getByRole("button", { name: /^Harbour note/ }).click();
  const link = editor.getByRole("link", {
    name: "The Ashen Court",
    exact: true,
  });
  await expect(link).toHaveAttribute("href", /tag=loyal&tag=covert/);
  await onLink("The Ashen Court", "Remove link");
  await expect(link).toHaveCount(0);
  await expect(editor).toContainText(
    "Mara serves The Ashen Court by the docks.",
  );
  await editor.press("Control+z");
  await expect(link).toBeVisible();
  await onLink("The Ashen Court", "Open reference");
  await expect(
    document.getByRole("heading", { name: "Harbour", exact: true }),
  ).toBeVisible();
  await document
    .getByRole("button", { name: "Back to previous document", exact: true })
    .click();
  await selectText(editor, "the docks");
  await expect(
    document.getByRole("group", { name: "Selected text actions", exact: true }),
  ).toBeVisible();
  const rect = await page.evaluate(() => {
    const rect = window.getSelection()!.getRangeAt(0).getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  await page.mouse.click(rect.x, rect.y, { button: "right" });
  await menu
    .getByRole("menuitem", { name: "Create linked note", exact: true })
    .click();
  const expand = page.getByRole("dialog", {
    name: "Expand into a linked note",
    exact: true,
  });
  await expand.getByLabel("New note title", { exact: true }).fill("Dockside");
  await expand
    .getByRole("button", { name: "Create linked note", exact: true })
    .click();
  await expect(
    document.getByRole("heading", { name: "Dockside", exact: true }),
  ).toBeVisible();
  await document
    .getByRole("button", { name: "Back to previous document", exact: true })
    .click();
  await expect(
    editor.getByRole("link", { name: "the docks", exact: true }),
  ).toBeVisible();
  await selectText(editor, "Mara");
  await editor.press("Shift+F10");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(editor).toBeFocused();
  await editor.press("Shift+F10");
  await menu
    .getByRole("menuitem", { name: "Add reference", exact: true })
    .click();
  picker = page.getByRole("dialog", { name: "Choose reference", exact: true });
  await picker
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Ashen Court");
  await picker.getByRole("button", { name: /^Ashen Court note/ }).click();
  await expect(
    editor.getByRole("link", { name: "Mara", exact: true }),
  ).toBeVisible();
  const raw = await markdownBody(document);
  expect(raw).toContain("slate:local::");
  expect(raw).not.toContain("%3A%3A");
  await saved(page);
  if (context.browser()?.browserType().name() === "chromium")
    await page.screenshot({ path: "work/editable-links-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await appearance(page, "Dark");
  await editor
    .getByRole("link", { name: "Mara", exact: true })
    .evaluate((element) =>
      element.dispatchEvent(
        new MouseEvent("contextmenu", {
          clientX: 380,
          clientY: 830,
          button: 2,
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
  const bounds = (await menu.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(8);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(382);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(836);
  if (context.browser()?.browserType().name() === "chromium")
    await page.screenshot({ path: "work/editable-links-mobile-menu.png" });
  await page.keyboard.press("Escape");
  await disconnect(context);
  await page.reload();
  await readyWorld(page);
  await expect(
    editor.getByRole("link", { name: "the docks", exact: true }),
  ).toBeVisible();
});

test.describe("world reference picker", () => {
  test.use({ hasTouch: true });

  test("world @ search inserts tagged relationships and pack references with keyboard and pointer controls offline", async ({
    page,
    context,
  }) => {
    await worldTab(page);
    await namedNote(page, "Ashen Court", "The court controls the harbour.");
    const document = await namedNote(page, "Mara", "Serves the court.");
    await addHeader(page, "Ashen Court", "ally");
    const editor = document.getByRole("textbox", {
      name: "Document text",
      exact: true,
    });
    const list = page.getByRole("listbox", {
      name: "Completions",
      exact: true,
    });
    await editor.fill("Serves @Ashen Court:member-of,secret");
    await expect(
      list.getByRole("option", { name: /^Ashen Court.*note/ }),
    ).toBeVisible();
    await editor.press("ArrowDown");
    await editor.press("ArrowUp");
    await editor.press("Tab");
    await expect(list).toHaveCount(0);
    await expect(editor).toBeFocused();
    await expect(editor).toContainText("Serves Ashen Court");
    await expect(editor).not.toContainText("slate:");
    const taggedBody = await markdownBody(document);
    expect(taggedBody).toMatch(
      /Serves \[Ashen Court\]\(slate:local::[^)]+\?tag=member-of&tag=secret\)/,
    );
    await settled(page);
    await expect(
      document.locator("summary").filter({ hasText: /^Relationships \(2\)$/ }),
    ).toBeVisible();
    await expect(document).toContainText("member-of · secret");
    await editor.fill(taggedBody + "\nFind @no-such-world-reference-123");
    await expect(document.getByRole("status")).toHaveText(
      "No matching content.",
    );
    await editor.press("Escape");
    await expect(list).toHaveCount(0);
    await editor.fill(taggedBody + "\nCasts @Flame Dart");
    await list.getByRole("option", { name: /^Flame Dart.*spell/ }).click();
    await expect(editor).toContainText("Casts Flame Dart");
    const withSpell = await markdownBody(document);
    await page.setViewportSize({ width: 390, height: 844 });
    await editor.fill(withSpell + "\nAvoids @Goblin");
    await expect(list).toBeVisible();
    const bounds = (await list.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(8);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(382);
    expect(bounds.y).toBeGreaterThanOrEqual(8);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(836);
    await list.getByRole("option", { name: /^Goblin\s*monster/ }).tap();
    await expect(editor).toContainText("Avoids Goblin");
    await saved(page);
    await expect(
      document.locator("summary").filter({ hasText: /^Relationships \(4\)$/ }),
    ).toBeVisible();
    await disconnect(context);
    await page.reload();
    await readyWorld(page);
    await expect(
      editor.getByRole("link", { name: "Ashen Court", exact: true }),
    ).toHaveAttribute("href", /tag=member-of&tag=secret/);
    await expect(
      document.locator("summary").filter({ hasText: /^Relationships \(4\)$/ }),
    ).toBeVisible();
    await document.getByRole("button", { name: "Read", exact: true }).click();
    await document
      .locator(".world-read")
      .getByRole("button", { name: "Goblin", exact: true })
      .click();
    const monster = page.getByRole("dialog", { name: "Goblin", exact: true });
    await expect(
      monster.getByRole("heading", { name: "Actions", exact: true }),
    ).toBeVisible();
    await monster
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await document
      .locator(".world-read")
      .getByRole("button", { name: "Ashen Court", exact: true })
      .click();
    await expect(
      document.getByRole("heading", { name: "Ashen Court", exact: true }),
    ).toBeVisible();
    await document
      .locator("summary")
      .filter({ hasText: /^Referenced by \(2\)$/ })
      .click();
    await expect(
      document.getByRole("button", {
        name: "Mara · member-of, secret",
        exact: true,
      }),
    ).toBeVisible();
  });
});

test.describe("Graph hierarchy", () => {
  test.use({ hasTouch: true });
  test("graph neighborhoods count real hops and dense groups expand by zoom, keyboard and touch offline", async ({
    page,
    context,
  }, info) => {
    await worldTab(page);
    await settled(page);
    const newNote = (title: string, id: string): ContentRecord => ({
      id,
      kind: "note",
      title,
      body: "",
      category: "Note",
      tags: [],
      sources: [],
      related: [],
      fields: {},
    });
    const root = newNote("Explorer", "graph-root");
    const hub = newNote("Spell archive", "graph-hub");
    const third = newNote("Beyond two hops", "graph-third");
    const isolated = newNote("Distant island", "graph-island");
    const leaves = Array.from({ length: 32 }, (_, index) => ({
      ...newNote(
        `Spell ${String(index + 1).padStart(2, "0")}`,
        `graph-leaf-${index}`,
      ),
      category: "Spell",
    }));
    hub.body = [
      referenceMarkdown(root.title, `local::${root.id}`, ["knows"]),
      ...leaves.map((note) =>
        referenceMarkdown(note.title, `local::${note.id}`, ["casts"]),
      ),
    ].join("\n\n");
    leaves[0].body = referenceMarkdown(third.title, `local::${third.id}`);
    await page.evaluate(
      (notes) =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.open("nimble-slate", 3);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result,
              tx = db.transaction("state", "readwrite"),
              state = tx.objectStore("state"),
              read = state.get("app");
            read.onsuccess = () => {
              const data = read.result as AppData;
              const campaign = data.campaigns.find(
                (campaign) => campaign.id === data.activeCampaignId,
              )!;
              campaign.content.push(...notes);
              campaign.packRefs = [];
              const screen = campaign.screens.find(
                (screen) => screen.id === campaign.activeScreenId,
              )!;
              screen.world = { selectedNoteId: "graph-root", positions: {} };
              data.revision++;
              state.put(data, "app");
            };
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => {
              db.close();
              reject(tx.error);
            };
          };
        }),
      [root, hub, third, isolated, ...leaves],
    );
    await page.reload();
    await readyWorld(page);
    await settled(page);
    const graph = page.getByRole("region", {
      name: "Relationship graph",
      exact: true,
    });
    const mode = graph.getByRole("combobox", {
      name: "Graph view",
      exact: true,
    });
    await expect(graph.locator("[data-target]")).toHaveCount(2);
    await mode.selectOption("neighborhood");
    await expect(graph.locator("[data-target]")).toHaveCount(2);
    await expect(graph).toContainText("34 pages · 2 shown individually.");
    const group = graph.getByRole("button", {
      name: "Expand Spell (32 pages)",
      exact: true,
    });
    await expect(group).toBeVisible();
    await expect(
      graph.getByRole("button", { name: "Open Beyond two hops", exact: true }),
    ).toHaveCount(0);
    for (let n = 0; n < 3; n++)
      await graph
        .getByRole("button", { name: "Zoom graph in", exact: true })
        .click();
    await expect(
      graph.getByRole("button", {
        name: "Collapse Spell (32 pages)",
        exact: true,
      }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(graph.locator("[data-group]")).toHaveCount(9);
    const canvas = (await graph
      .locator("svg.world-graph-canvas")
      .boundingBox())!;
    await page.mouse.move(canvas.x + 10, canvas.y + 10);
    await page.mouse.down();
    await page.mouse.move(canvas.x - 600, canvas.y + 10, { steps: 4 });
    await page.mouse.up();
    await expect(graph.locator("[data-group]")).toHaveCount(9);
    await graph
      .getByRole("button", { name: "Collapse groups", exact: true })
      .click();
    await group.press("Enter");
    await expect(graph.locator("[data-group]")).toHaveCount(9);
    const batch = graph.getByRole("button", {
      name: "Expand Spell 01 – Spell 04 (4 pages)",
      exact: true,
    });
    await batch.press("Space");
    await expect(
      graph.getByRole("button", { name: "Open Spell 01", exact: true }),
    ).toHaveCount(1);
    // The expanded hierarchy retains readable, separate node rectangles.
    const rectangles = await graph.locator(".world-node").evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }),
    );
    for (let a = 0; a < rectangles.length; a++)
      for (let b = a + 1; b < rectangles.length; b++) {
        const first = rectangles[a],
          second = rectangles[b];
        expect(
          first.x + first.width <= second.x ||
            second.x + second.width <= first.x ||
            first.y + first.height <= second.y ||
            second.y + second.height <= first.y,
        ).toBe(true);
      }
    if (!info.project.name)
      await expect(graph).toHaveScreenshot("world-neighborhood-expanded.png");
    await graph
      .getByRole("button", { name: "Collapse groups", exact: true })
      .click();
    if (!info.project.name)
      await expect(graph).toHaveScreenshot("world-neighborhood-groups.png");
    await graph
      .getByRole("combobox", { name: "Filter relationship tags", exact: true })
      .selectOption("knows");
    await expect(graph).toContainText("2 pages · 2 shown individually.");
    await graph
      .getByRole("combobox", { name: "Filter relationship tags", exact: true })
      .selectOption("");
    await mode.selectOption("world");
    await expect(graph).toContainText("36 pages");
    await expect(
      graph.getByRole("button", { name: "Open Distant island", exact: true }),
    ).toHaveCount(1);
    await expect(
      graph.getByRole("button", { name: "Open Beyond two hops", exact: true }),
    ).toHaveCount(1);
    await mode.selectOption("neighborhood");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Graph", exact: true }).click();
    await appearance(page, "Dark");
    await group.tap();
    await batch.tap();
    await expect(
      graph.getByRole("button", { name: "Open Spell 01", exact: true }),
    ).toHaveCount(1);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await saved(page);
    await disconnect(context);
    await page.reload();
    await readyWorld(page);
    await expect(
      page.getByRole("button", {
        name: "Rebuild relationship cache",
        exact: true,
      }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Graph", exact: true }).click();
    await mode.selectOption("neighborhood");
    await group.tap();
    await batch.tap();
    await graph
      .getByRole("button", { name: "Open Spell 01", exact: true })
      .press("Enter");
    await expect(
      page
        .getByRole("region", { name: "World document", exact: true })
        .getByRole("heading", { name: "Spell 01", exact: true }),
    ).toBeVisible();
  });
});

test("library edits and Markdown export preserve world metadata, with accessible desktop and mobile views", async ({
  page,
}) => {
  await worldTab(page);
  const document = await namedNote(page, "Greyhaven", "The harbour is open.");
  const editTitle = document.getByRole("button", {
    name: "Edit document title",
    exact: true,
  });
  const title = document.getByRole("textbox", {
    name: "Note title",
    exact: true,
  });
  await editTitle.click();
  await expect(title).toBeFocused();
  await title.fill("Discard this rename");
  await title.press("Escape");
  await expect(editTitle).toBeFocused();
  await expect(editTitle).toHaveText("Greyhaven");
  await editTitle.click();
  await title.fill("   ");
  await title.press("Enter");
  await expect(editTitle).toHaveText("Greyhaven");
  await editTitle.click();
  await title.fill("  Greyhaven Harbour  ");
  await title.press("Enter");
  await expect(editTitle).toBeFocused();
  await expect(editTitle).toHaveText("Greyhaven Harbour");
  await editTitle.click();
  await title.fill("Greyhaven Docks");
  await document.getByRole("button", { name: "Read", exact: true }).click();
  await expect(editTitle).toHaveText("Greyhaven Docks");
  await expect(
    page.getByRole("button", { name: "Open Greyhaven Docks", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  const library = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Greyhaven");
  await library
    .getByRole("button", { name: "Edit Greyhaven Docks", exact: true })
    .click();
  const preview = page.getByRole("dialog", {
    name: "Greyhaven Docks",
    exact: true,
  });
  await preview
    .getByLabel("Content title", { exact: true })
    .fill("Greyhaven Port");
  await preview.getByLabel("Note category", { exact: true }).fill("Settlement");
  await preview
    .getByLabel("Tags, separated by commas", { exact: true })
    .fill("coast, place");
  await preview
    .getByRole("button", { name: "Save content", exact: true })
    .click();
  const renamed = page.getByRole("dialog", {
    name: "Greyhaven Port",
    exact: true,
  });
  const download = page.waitForEvent("download");
  await renamed
    .getByRole("button", { name: "Export Markdown", exact: true })
    .click();
  const file = await download,
    text = await readFile((await file.path())!, "utf8");
  expect(text.startsWith("---\n")).toBe(true);
  expect(text).toContain("title: Greyhaven Port");
  expect(text).toContain("category: Settlement");
  expect(text).toContain("The harbour is open.");
  await renamed
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await library
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(
    document.getByRole("heading", { name: "Greyhaven Port", exact: true }),
  ).toBeVisible();
  await settled(page);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Graph", exact: true }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await disconnect(page.context());
  await page.reload();
  await readyWorld(page);
  await page.getByRole("button", { name: "Write", exact: true }).click();
  await expect(editTitle).toHaveText("Greyhaven Port");
  await document
    .getByRole("button", { name: "Markdown source", exact: true })
    .click();
  await expect(
    document.getByRole("textbox", {
      name: "Document Markdown source",
      exact: true,
    }),
  ).toHaveValue(/title: Greyhaven Port/);
});
