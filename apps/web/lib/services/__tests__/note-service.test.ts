import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NoteService } from "../note-service";
import { ServiceFactory } from "../service-factory";
import { createTestCharacter } from "./test-utils";

describe("NoteService", () => {
  let noteService: NoteService;

  beforeEach(async () => {
    // Reset services and use in-memory storage
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("inMemory");

    // Get services
    const { getCharacterService } = await import("../service-factory");
    const characterService = getCharacterService();

    // Create a test character
    const testCharacter = await createTestCharacter({
      name: "Test Character",
    });
    await characterService.loadCharacter(testCharacter.id);

    // Get note service instance
    noteService = NoteService.getInstance();
  });

  afterEach(() => {
    ServiceFactory.reset();
    ServiceFactory.setStorageImplementation("localStorage");
  });

  describe("addNote", () => {
    it("should add a new note with title and content", async () => {
      const note = await noteService.addNote("Test Note", "Test content");

      expect(note.title).toBe("Test Note");
      expect(note.content).toBe("Test content");
      expect(note.diceRolls).toEqual([]);
      expect(note.id).toBeDefined();
      expect(note.sortOrder).toBe(0);
    });

    it("should add a new note with dice rolls", async () => {
      const diceRolls = [
        { id: "roll-1", name: "Attack", formula: "1d20+5" },
        { id: "roll-2", name: "Damage", formula: "2d6+3" },
      ];

      const note = await noteService.addNote("Combat Note", "Combat actions", diceRolls);

      expect(note.title).toBe("Combat Note");
      expect(note.diceRolls).toHaveLength(2);
      expect(note.diceRolls[0].name).toBe("Attack");
      expect(note.diceRolls[0].formula).toBe("1d20+5");
      expect(note.diceRolls[1].name).toBe("Damage");
      expect(note.diceRolls[1].formula).toBe("2d6+3");
    });

    it("should assign sequential sort orders to notes", async () => {
      const note1 = await noteService.addNote("Note 1", "Content 1");
      const note2 = await noteService.addNote("Note 2", "Content 2");
      const note3 = await noteService.addNote("Note 3", "Content 3");

      expect(note1.sortOrder).toBe(0);
      expect(note2.sortOrder).toBe(1);
      expect(note3.sortOrder).toBe(2);
    });

    it("should throw error when max notes limit is reached", async () => {
      // Add 20 notes (the max)
      for (let i = 0; i < 20; i++) {
        await noteService.addNote(`Note ${i}`, `Content ${i}`);
      }

      // Try to add one more
      await expect(noteService.addNote("Note 21", "Content 21")).rejects.toThrow(
        "Cannot add more than 20 notes",
      );
    });
  });

  describe("getNotes", () => {
    it("should return empty array when no notes exist", () => {
      const notes = noteService.getNotes();
      expect(notes).toEqual([]);
    });

    it("should return all notes sorted by sortOrder", async () => {
      await noteService.addNote("Note 1", "Content 1");
      await noteService.addNote("Note 2", "Content 2");
      await noteService.addNote("Note 3", "Content 3");

      const notes = noteService.getNotes();
      expect(notes).toHaveLength(3);
      expect(notes[0].title).toBe("Note 1");
      expect(notes[1].title).toBe("Note 2");
      expect(notes[2].title).toBe("Note 3");
    });
  });

  describe("getNote", () => {
    it("should return note by id", async () => {
      const created = await noteService.addNote("Test Note", "Test content");
      const found = noteService.getNote(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe("Test Note");
    });

    it("should return undefined for non-existent note", () => {
      const found = noteService.getNote("non-existent-id");
      expect(found).toBeUndefined();
    });
  });

  describe("updateNote", () => {
    it("should update note title and content", async () => {
      const note = await noteService.addNote("Original Title", "Original content");

      await noteService.updateNote(note.id, {
        title: "Updated Title",
        content: "Updated content",
      });

      const updated = noteService.getNote(note.id);
      expect(updated?.title).toBe("Updated Title");
      expect(updated?.content).toBe("Updated content");
    });

    it("should update note dice rolls", async () => {
      const note = await noteService.addNote("Test Note", "Test content");

      const diceRolls = [
        { id: "roll-1", name: "Attack", formula: "1d20+5" },
        { id: "roll-2", name: "Damage", formula: "2d6+3" },
      ];

      await noteService.updateNote(note.id, { diceRolls });

      const updated = noteService.getNote(note.id);
      expect(updated?.diceRolls).toHaveLength(2);
      expect(updated?.diceRolls[0].name).toBe("Attack");
    });

    it("should throw error when updating non-existent note", async () => {
      await expect(
        noteService.updateNote("non-existent-id", { title: "New Title" }),
      ).rejects.toThrow("Note not found");
    });

    it("should validate dice roll limits", async () => {
      const note = await noteService.addNote("Test Note", "Test content");

      // Create 21 dice rolls (over the limit)
      const tooManyRolls = Array.from({ length: 21 }, (_, i) => ({
        id: `roll-${i}`,
        name: `Roll ${i}`,
        formula: "1d20",
      }));

      await expect(noteService.updateNote(note.id, { diceRolls: tooManyRolls })).rejects.toThrow();
    });
  });

  describe("deleteNote", () => {
    it("should delete a note", async () => {
      const note = await noteService.addNote("Test Note", "Test content");

      await noteService.deleteNote(note.id);

      const found = noteService.getNote(note.id);
      expect(found).toBeUndefined();
    });

    it("should not throw error when deleting non-existent note", async () => {
      await expect(noteService.deleteNote("non-existent-id")).resolves.not.toThrow();
    });
  });

  describe("reorderNotes", () => {
    it("should reorder notes based on provided ids", async () => {
      const note1 = await noteService.addNote("Note 1", "Content 1");
      const note2 = await noteService.addNote("Note 2", "Content 2");
      const note3 = await noteService.addNote("Note 3", "Content 3");

      // Reverse the order
      await noteService.reorderNotes([note3.id, note2.id, note1.id]);

      const notes = noteService.getNotes();
      expect(notes[0].id).toBe(note3.id);
      expect(notes[1].id).toBe(note2.id);
      expect(notes[2].id).toBe(note1.id);
    });
  });

  describe("rollDiceFromNote", () => {
    it("should roll dice and log to activity log", async () => {
      const diceRolls = [{ id: "roll-1", name: "Attack", formula: "1d20+5" }];
      const note = await noteService.addNote("Combat Note", "Test content", diceRolls);

      // Mock the activity log service
      const { getActivityLog } = await import("../service-factory");
      const activityLog = getActivityLog();
      const addLogEntrySpy = vi.spyOn(activityLog, "addLogEntry");

      await noteService.rollDiceFromNote(note.id, "roll-1");

      expect(addLogEntrySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "roll",
          description: "[Note: Combat Note] Attack: 1d20+5",
          rollExpression: "1d20+5",
        }),
      );
    });

    it("should throw error for non-existent note", async () => {
      await expect(noteService.rollDiceFromNote("non-existent", "roll-1")).rejects.toThrow(
        "Note not found",
      );
    });

    it("should throw error for non-existent dice roll", async () => {
      const note = await noteService.addNote("Test Note", "Test content");

      await expect(noteService.rollDiceFromNote(note.id, "non-existent-roll")).rejects.toThrow(
        "Dice roll not found",
      );
    });
  });
});
