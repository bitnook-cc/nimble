import { v4 as uuidv4 } from "uuid";

import { gameConfig } from "../config/game-config";
import { noteSchema } from "../schemas/note";
import type { Note } from "../types/note";
import { getCharacterService } from "./service-factory";

export class NoteService {
  private static instance: NoteService;

  private constructor() {}

  static getInstance(): NoteService {
    if (!NoteService.instance) {
      NoteService.instance = new NoteService();
    }
    return NoteService.instance;
  }

  /**
   * Get all notes for the current character, sorted by sortOrder
   */
  getNotes(): Note[] {
    const characterService = getCharacterService();
    const character = characterService.getCurrentCharacter();
    if (!character) return [];
    const notes = character.notes || [];
    return [...notes].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Add a new note to the current character
   */
  async addNote(title: string, content: string): Promise<Note> {
    const characterService = getCharacterService();
    const character = characterService.getCurrentCharacter();
    if (!character) throw new Error("No character loaded");

    const notes = character.notes || [];
    if (notes.length >= gameConfig.notes.maxNotes) {
      throw new Error(`Cannot add more than ${gameConfig.notes.maxNotes} notes`);
    }

    // Set sortOrder to be at the end
    const maxSortOrder = notes.length > 0 ? Math.max(...notes.map((n) => n.sortOrder)) : -1;

    const newNote: Note = {
      id: uuidv4(),
      title,
      content,
      sortOrder: maxSortOrder + 1,
    };

    // Validate the note
    noteSchema.parse(newNote);

    await characterService.updateCharacterFields({
      notes: [...notes, newNote],
    });

    return newNote;
  }

  /**
   * Update an existing note
   */
  async updateNote(noteId: string, updates: Partial<Omit<Note, "id">>): Promise<Note> {
    const characterService = getCharacterService();
    const character = characterService.getCurrentCharacter();
    if (!character) throw new Error("No character loaded");

    const notes = character.notes || [];
    const noteIndex = notes.findIndex((n) => n.id === noteId);
    if (noteIndex === -1) throw new Error("Note not found");

    const updatedNote: Note = {
      ...notes[noteIndex],
      ...updates,
    };

    // Validate the updated note
    noteSchema.parse(updatedNote);

    const updatedNotes = [...notes];
    updatedNotes[noteIndex] = updatedNote;

    await characterService.updateCharacterFields({
      notes: updatedNotes,
    });

    return updatedNote;
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<void> {
    const characterService = getCharacterService();
    const character = characterService.getCurrentCharacter();
    if (!character) throw new Error("No character loaded");

    const notes = character.notes || [];
    const filteredNotes = notes.filter((n) => n.id !== noteId);

    await characterService.updateCharacterFields({
      notes: filteredNotes,
    });
  }

  /**
   * Get a specific note by ID
   */
  getNote(noteId: string): Note | undefined {
    const notes = this.getNotes();
    return notes.find((n) => n.id === noteId);
  }

  /**
   * Reorder notes by updating their sortOrder
   */
  async reorderNotes(noteIds: string[]): Promise<void> {
    const characterService = getCharacterService();
    const character = characterService.getCurrentCharacter();
    if (!character) throw new Error("No character loaded");

    const notes = character.notes || [];

    // Create a map of noteId to new sortOrder
    const sortOrderMap = new Map(noteIds.map((id, index) => [id, index]));

    // Update sortOrder for each note
    const updatedNotes = notes.map((note) => ({
      ...note,
      sortOrder: sortOrderMap.get(note.id) ?? note.sortOrder,
    }));

    await characterService.updateCharacterFields({
      notes: updatedNotes,
    });
  }
}
