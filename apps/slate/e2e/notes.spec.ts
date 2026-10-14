import { expect, type Page } from "@playwright/test";
import { test, slateURL, disconnect } from "./browser-fixtures";
import { ready, saved, library, openWidgetPicker } from "./ui-fixtures";
import type { AppData } from "../src/model";

test.use({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
test.beforeEach(async ({ page }) => {
  await page.goto(slateURL(page));
  await ready(page);
});

async function stored(page: Page): Promise<AppData> {
  await saved(page);
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
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
          tx.onerror = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
  );
}

test("a note can be created without a widget, edited through the library, and retained offline after its widget is removed", async ({
  page,
  context,
}) => {
  const browse = await library(page, "");
  await browse
    .getByRole("button", { name: "Create content", exact: true })
    .click();
  await browse
    .getByLabel("New content type", { exact: true })
    .selectOption("note");
  await browse
    .getByLabel("New content title", { exact: true })
    .fill("Greyhaven");
  await browse
    .getByLabel("New content Markdown", { exact: true })
    .fill("# Harbour\n\nThe Ashen Court owns the docks.");
  await browse
    .getByRole("button", { name: "Create reference", exact: true })
    .click();
  const preview = page.getByRole("dialog", { name: "Greyhaven", exact: true });
  await expect(preview).toContainText("owns the docks");
  let data = await stored(page),
    campaign = data.campaigns[0];
  const document = campaign.content.find((record) => record.kind === "note")!;
  expect(campaign.tools.some((tool) => tool.kind === "note")).toBe(false);
  await preview
    .getByRole("button", { name: "Pin to screen", exact: true })
    .click();
  await preview
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  let note = page.getByRole("region", { name: "Greyhaven", exact: true });
  await expect(note).toContainText("owns the docks");
  data = await stored(page);
  const tool = data.campaigns[0].tools.find((tool) => tool.kind === "note")!;
  expect(tool).toMatchObject({ noteId: document.id });
  expect(tool.id).not.toBe(document.id);
  expect(tool).not.toHaveProperty("body");
  await library(page, "Greyhaven");
  await browse
    .getByRole("button", { name: "Edit Greyhaven", exact: true })
    .click();
  await preview
    .getByLabel("Content title", { exact: true })
    .fill("Greyhaven Harbour");
  await preview.getByLabel("Note category", { exact: true }).fill("Places");
  await preview
    .getByLabel("Tags, separated by commas", { exact: true })
    .fill("port, coast");
  await preview
    .getByRole("textbox", { name: "Markdown content", exact: true })
    .fill("The Court controls every ship.");
  await preview
    .getByRole("button", { name: "Save content", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Greyhaven Harbour", exact: true })
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await browse
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  note = page.getByRole("region", { name: "Greyhaven Harbour", exact: true });
  await expect(note).toContainText("controls every ship");
  await note
    .getByRole("button", { name: "Widget menu Greyhaven Harbour", exact: true })
    .click();
  await note
    .getByRole("button", { name: "Remove from screen", exact: true })
    .click();
  await expect(note).toHaveCount(0);
  await saved(page);
  await page.reload();
  await ready(page);
  await disconnect(context);
  await page.reload();
  await ready(page);
  await library(page, "Greyhaven Harbour");
  await browse
    .getByRole("combobox", { name: "Content type", exact: true })
    .selectOption("note");
  await browse
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("Places");
  await browse.getByRole("button", { name: /^Greyhaven Harbour note/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Greyhaven Harbour", exact: true }),
  ).toContainText("controls every ship");
  campaign = (await stored(page)).campaigns[0];
  expect(
    campaign.content.find((record) => record.id === document.id),
  ).toMatchObject({
    title: "Greyhaven Harbour",
    category: "Places",
    tags: ["port", "coast"],
  });
});

test("widgets can select an existing note, share live edits, and document deletion removes both editing views", async ({
  page,
}) => {
  await openWidgetPicker(page);
  await page.getByRole("button", { name: /^Notes Markdown notes/ }).click();
  const first = page.getByRole("region", { name: "Notes", exact: true });
  await first
    .getByLabel("Note text", { exact: true })
    .fill("A shared harbour.");
  await first
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  const settings = page.getByRole("dialog", {
    name: "Configure Notes",
    exact: true,
  });
  await settings.getByLabel("Tool name", { exact: true }).fill("Harbour");
  await settings
    .getByRole("button", { name: "Save tool", exact: true })
    .click();
  await openWidgetPicker(page);
  await page.getByRole("button", { name: /^Notes Markdown notes/ }).click();
  await page
    .getByRole("region", { name: "Notes", exact: true })
    .getByRole("button", { name: "Configure tool", exact: true })
    .click();
  await settings
    .getByRole("combobox", { name: "Campaign note", exact: true })
    .selectOption({ label: "Harbour" });
  await settings
    .getByLabel("Tool name", { exact: true })
    .fill("Shared Harbour");
  await settings
    .getByRole("button", { name: "Save tool", exact: true })
    .click();
  const views = page.getByRole("region", {
    name: "Shared Harbour",
    exact: true,
  });
  await expect(views).toHaveCount(2);
  await views
    .first()
    .getByLabel("Note text", { exact: true })
    .fill("Both views use this document.");
  await expect(views.last()).toContainText("Both views use this document.");
  await saved(page);
  await page.reload();
  await ready(page);
  await expect(views).toHaveCount(2);
  await expect(views.first()).toContainText("Both views use this document.");
  await expect(views.last()).toContainText("Both views use this document.");
  const browse = await library(page, "Shared Harbour");
  await browse
    .getByRole("button", { name: "Delete Shared Harbour", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Delete Shared Harbour?", exact: true })
    .getByRole("button", { name: "Delete content", exact: true })
    .click();
  await browse
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(views).toHaveCount(0);
  const campaign = (await stored(page)).campaigns[0];
  expect(
    campaign.content.filter((record) => record.kind === "note"),
  ).toHaveLength(1);
  expect(campaign.content.find((record) => record.kind === "note")?.title).toBe(
    "Notes",
  );
});

test("existing inline notes migrate on launch without changing their widget or reference targets", async ({
  page,
}) => {
  const before = await stored(page);
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("nimble-slate", 3);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("state", "readwrite"),
            store = tx.objectStore("state"),
            value = store.get("app");
          value.onsuccess = () => {
            const data = value.result as AppData;
            store.put(
              {
                ...data,
                version: 17,
                campaigns: data.campaigns.map((campaign) => ({
                  ...campaign,
                  tools: [
                    ...campaign.tools,
                    {
                      id: "legacy-note",
                      kind: "note",
                      name: "Old session notes",
                      body: "Visit [The Court](slate:local%3A%3Alegacy-court).",
                      tags: ["session"],
                    },
                    {
                      id: "legacy-court",
                      kind: "note",
                      name: "The Court",
                      body: "A secret society.",
                      tags: ["faction"],
                    },
                  ],
                  screens: campaign.screens.map((screen) => ({
                    ...screen,
                    widgets: [
                      ...screen.widgets,
                      {
                        id: "legacy-widget",
                        toolId: "legacy-note",
                        kind: "note",
                        x: 0,
                        y: 5,
                        w: 4,
                        h: 3,
                        title: "",
                      },
                    ],
                  })),
                })),
              },
              "app",
            );
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
  );
  await page.reload();
  await ready(page);
  const note = page.getByRole("region", {
    name: "Old session notes",
    exact: true,
  });
  await note.getByRole("button", { name: "The Court", exact: true }).click();
  const preview = page.getByRole("dialog", { name: "The Court", exact: true });
  await expect(preview).toContainText("A secret society.");
  await expect(
    preview.getByRole("button", { name: "Old session notes", exact: true }),
  ).toBeVisible();
  const campaign = (await stored(page)).campaigns[0];
  expect(campaign.id).toBe(before.campaigns[0].id);
  expect(
    campaign.content.find((record) => record.id === "legacy-note"),
  ).toMatchObject({
    kind: "note",
    title: "Old session notes",
    tags: ["session"],
  });
  expect(campaign.tools.find((tool) => tool.id === "legacy-note")).toEqual({
    id: "legacy-note",
    kind: "note",
    name: "Old session notes",
    noteId: "legacy-note",
  });
  expect(
    campaign.screens[0].widgets.find((widget) => widget.id === "legacy-widget"),
  ).toMatchObject({ toolId: "legacy-note" });
});
