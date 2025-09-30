import { expect, test } from "@playwright/test";

import { CharacterTestUtils } from "./utils/character-utils";

test.describe("Notes Management", () => {
  let characterUtils: CharacterTestUtils;

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    characterUtils = new CharacterTestUtils(page);
  });

  test("create and edit notes", async ({ page }) => {
    await test.step("Setup character", async () => {
      await characterUtils.ensureCharacterExists();
    });

    await test.step("Navigate to Notes tab", async () => {
      const notesTab = page.getByRole("button", { name: /^notes$/i });
      await notesTab.scrollIntoViewIfNeeded();
      await expect(notesTab).toBeVisible();
      await notesTab.click();

      // Wait for tab content to load
      await page.waitForTimeout(500);
    });

    await test.step("Create a new note", async () => {
      // Click Add Note button
      const addNoteButton = page.getByRole("button", { name: /add note/i });
      await expect(addNoteButton).toBeVisible();
      await addNoteButton.click();

      // Fill in note title
      const titleInput = page.getByPlaceholder(/title/i);
      await expect(titleInput).toBeVisible();
      await titleInput.fill("Test Note");

      // Fill in note content
      const contentTextarea = page.getByPlaceholder(/content.*markdown/i);
      await expect(contentTextarea).toBeVisible();
      await contentTextarea.fill("# Test Heading\n\nThis is **bold** and this is *italic*.");

      // Save the note
      const saveButton = page.getByRole("button", { name: /save/i });
      await expect(saveButton).toBeVisible();
      await saveButton.click();

      // Verify note was created and is visible
      await expect(page.getByText("Test Note")).toBeVisible();

      // Verify markdown is rendered (look for the heading)
      await expect(page.getByRole("heading", { name: /test heading/i })).toBeVisible();
    });

    await test.step("Edit the note", async () => {
      // Find and click the note's dropdown menu
      const moreButton = page.getByRole("button", { name: /note options/i });
      await expect(moreButton).toBeVisible();
      await moreButton.click();

      // Click Edit option
      const editMenuItem = page.getByRole("menuitem", { name: /edit/i });
      await expect(editMenuItem).toBeVisible();
      await editMenuItem.click();

      // Wait for edit mode to activate
      await page.waitForTimeout(300);

      // Update the title
      const titleInput = page.getByRole("textbox", { name: /note title/i });
      await expect(titleInput).toBeVisible();
      await titleInput.selectText();
      await titleInput.fill("Updated Test Note");

      // Update the content
      const contentTextarea = page.getByRole("textbox", { name: /note content/i });
      await expect(contentTextarea).toBeVisible();
      await contentTextarea.selectText();
      await contentTextarea.pressSequentially(
        "# Updated Heading\n\nThis content has been **updated**.",
        { delay: 10 },
      );

      // Save the changes
      const saveButton = page.getByRole("button", { name: /save/i });
      await saveButton.click();

      // Wait for save to complete and UI to update
      await page.waitForTimeout(1000);

      // Verify the note title was updated
      const noteTitle = page.getByText("Updated Test Note");
      await expect(noteTitle).toBeVisible();

      // The note should be collapsed after saving, expand it to check content
      const isExpanded = await page
        .getByRole("heading", { name: /updated heading/i })
        .isVisible()
        .catch(() => false);
      if (!isExpanded) {
        // Click the chevron or title to expand
        await noteTitle.click();
        await page.waitForTimeout(500);
      }

      // Verify the markdown content was updated
      await expect(page.getByRole("heading", { name: /updated heading/i })).toBeVisible();
    });

    await test.step("Delete the note", async () => {
      // Find and click the note's dropdown menu
      const moreButton = page.getByRole("button", { name: /note options/i });
      await expect(moreButton).toBeVisible();
      await moreButton.click();

      // Click Delete option
      const deleteMenuItem = page.getByRole("menuitem", { name: /delete/i });
      await expect(deleteMenuItem).toBeVisible();

      // Listen for the confirmation dialog
      page.on("dialog", (dialog) => dialog.accept());

      await deleteMenuItem.click();

      // Verify the note was deleted
      await expect(page.getByText("Updated Test Note")).not.toBeVisible();
      await expect(page.getByText(/no notes yet/i)).toBeVisible();
    });
  });
});
