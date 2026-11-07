import { expect, test } from "@playwright/test";

import { CharacterTestUtils } from "./utils/character-utils";

test("notes autosave through navigation, reload and switching characters", async ({ page }) => {
  await page.goto("/");
  const sheet = new CharacterTestUtils(page);
  await sheet.createCharacter();
  const name = "Note Keeper";
  const characterName = page.getByRole("textbox", { name: "Character Name", exact: true });
  await characterName.fill(name);
  await characterName.press("Tab");
  await sheet.navigateToTab("Notes");
  await page.getByRole("button", { name: "Add Note" }).click();
  const title = page.getByRole("textbox", { name: "Note title" });
  const body = page.getByRole("textbox", { name: "Note content" });
  await title.fill("Map fragments");
  await body.fill("# The hidden gate");
  await sheet.navigateToTab("Combat");
  await sheet.navigateToTab("Notes");
  await expect(page.getByRole("heading", { name: "The hidden gate" })).toBeVisible();
  await page.getByRole("button", { name: "Note options" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await title.fill("Gate clues");
  await page.getByRole("button", { name: "Add Roll" }).click();
  await page.getByRole("textbox", { name: "Roll 1 formula" }).fill("");
  await body.fill("The key is **silver**.");
  await page.reload();
  await sheet.navigateToTab("Notes");
  await expect(page.getByRole("button", { name: "Gate clues", exact: true })).toBeVisible();
  await expect(page.locator("strong").getByText("silver", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Roll New roll" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Note options" })).toHaveCount(1);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("menuitem", { name: "New Character" }).click();
  await page.getByRole("button", { name: "Quick Create" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await sheet.navigateToTab("Notes");
  await expect(page.getByText(/No notes yet/)).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("menuitem", { name: "Characters", exact: true }).click();
  await page.getByRole("button", { name: "Open " + name, exact: true }).press("Enter");
  await sheet.navigateToTab("Notes");
  await expect(page.getByRole("button", { name: "Gate clues", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Note options" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(/No notes yet/)).toBeVisible();
});

test("a failed autosave keeps the note editable and offers a retry", async ({ page }) => {
  await page.goto("/");
  const sheet = new CharacterTestUtils(page);
  await sheet.createCharacter();
  await sheet.navigateToTab("Notes");
  await page.getByRole("button", { name: "Add Note" }).click();
  const title = page.getByRole("textbox", { name: "Note title" });
  await expect(title).toBeVisible();
  await page.evaluate(() => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "sheets-characters") {
        Storage.prototype.setItem = write;
        throw new DOMException("Storage is full", "QuotaExceededError");
      }
      return write.call(this, key, value);
    };
  });
  await title.fill("Recovered note");
  await expect(title).toHaveValue("Recovered note");
  await page.getByRole("button", { name: "Retry save" }).click();
  await expect(title).toHaveCount(0);
  await page.reload();
  await sheet.navigateToTab("Notes");
  await expect(page.getByRole("button", { name: "Recovered note", exact: true })).toBeVisible();
});
