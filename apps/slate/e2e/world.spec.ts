import { expect, type Page, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { test, slateURL, disconnect } from "./browser-fixtures";
import { ready, saved, appearance } from "./ui-fixtures";
import type { AppData } from "../src/model";

test.use({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
  colorScheme: "light",
});
test.beforeEach(async ({ page }) => {
  await page.goto(slateURL(page));
  await ready(page);
});
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
  await editor.evaluate((element, selection) => {
    const input = element as HTMLTextAreaElement;
    input.focus();
    const start = input.value.indexOf(selection);
    input.setSelectionRange(start, start + selection.length);
  }, text);
  await editor.dispatchEvent("mouseup");
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
  ).toHaveValue("Mara secretly serves the Ashen Court.");
  await expect(
    page.getByRole("button", { name: "Open Ashen Court", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Rebuild relationship cache", exact: true })
    .click();
  await settled(page);
  await page.reload();
  await ready(page);
  await settled(page);
  await disconnect(context);
  await page.reload();
  await ready(page);
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
  await ready(page);
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

test("library edits and Markdown export preserve world metadata, with accessible desktop and mobile views", async ({
  page,
}) => {
  await worldTab(page);
  const document = await namedNote(page, "Greyhaven", "The harbour is open.");
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
    .getByRole("button", { name: "Edit Greyhaven", exact: true })
    .click();
  const preview = page.getByRole("dialog", { name: "Greyhaven", exact: true });
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
});
