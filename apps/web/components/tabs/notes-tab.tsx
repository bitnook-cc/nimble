"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  ChevronDown,
  Dice6,
  GripVertical,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import remarkGfm from "remark-gfm";
import { v4 as uuidv4 } from "uuid";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { DiceFormulaHelpDialog } from "@/components/notes/dice-formula-help-dialog";

import { gameConfig } from "@/lib/config/game-config";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { NoteService } from "@/lib/services/note-service";
import type { DiceRoll, Note } from "@/lib/types/note";

interface SortableNoteProps {
  note: Note;
  isOpen: boolean;
  isEditing: boolean;
  editTitle: string;
  editContent: string;
  editDiceRolls: DiceRoll[];
  onToggle: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onEditTitleChange: (value: string) => void;
  onEditContentChange: (value: string) => void;
  onEditDiceRollsChange: (rolls: DiceRoll[]) => void;
  onRollDice: (rollId: string) => void;
}

function SortableNote({
  note,
  isOpen,
  isEditing,
  editTitle,
  editContent,
  editDiceRolls,
  onToggle,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onEditTitleChange,
  onEditContentChange,
  onEditDiceRollsChange,
  onRollDice,
}: SortableNoteProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between gap-2">
              <CollapsibleTrigger className="flex-1 text-left flex items-center gap-2">
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    isOpen ? "" : "-rotate-90"
                  }`}
                />
                <CardTitle className="text-lg hover:text-primary transition-colors">
                  {note.title}
                </CardTitle>
              </CollapsibleTrigger>
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-label="Note options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing p-1"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {isEditing ? (
                // Edit Mode
                <>
                  <div>
                    <Input
                      value={editTitle}
                      onChange={(e) => onEditTitleChange(e.target.value)}
                      maxLength={100}
                      placeholder="Title"
                      aria-label="Note title"
                    />
                  </div>
                  <div>
                    <Textarea
                      value={editContent}
                      onChange={(e) => onEditContentChange(e.target.value)}
                      maxLength={gameConfig.notes.maxContentLength}
                      rows={6}
                      className="font-mono text-sm"
                      placeholder="Content (Markdown supported)"
                      aria-label="Note content"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {editContent.length} / {gameConfig.notes.maxContentLength} characters
                    </div>
                  </div>

                  {/* Dice Rolls Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Dice Rolls</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRoll: DiceRoll = {
                            id: uuidv4(),
                            name: "",
                            formula: "",
                          };
                          onEditDiceRollsChange([...editDiceRolls, newRoll]);
                        }}
                        disabled={editDiceRolls.length >= 20}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Roll
                      </Button>
                    </div>
                    {editDiceRolls.map((roll, index) => (
                      <div key={roll.id} className="flex gap-2 items-start">
                        <Input
                          placeholder="Name"
                          value={roll.name}
                          onChange={(e) => {
                            const updated = [...editDiceRolls];
                            updated[index] = { ...roll, name: e.target.value };
                            onEditDiceRollsChange(updated);
                          }}
                          maxLength={50}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Formula (e.g., 1d20+5)"
                          value={roll.formula}
                          onChange={(e) => {
                            const updated = [...editDiceRolls];
                            updated[index] = { ...roll, formula: e.target.value };
                            onEditDiceRollsChange(updated);
                          }}
                          maxLength={100}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onEditDiceRollsChange(editDiceRolls.filter((_, i) => i !== index));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={onSave} size="sm">
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={onCancel} size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                // View Mode
                <>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {note.content || "*No content*"}
                    </ReactMarkdown>
                  </div>

                  {/* Dice Rolls Display */}
                  {note.diceRolls && note.diceRolls.length > 0 && (
                    <div className="space-y-2 border-t pt-4 mt-4">
                      <div className="text-sm font-medium text-muted-foreground">Dice Rolls</div>
                      {note.diceRolls.map((roll) => (
                        <div
                          key={roll.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-md border bg-muted/30"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{roll.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {roll.formula}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => onRollDice(roll.id)}>
                            <Dice6 className="h-4 w-4 mr-1" />
                            Roll
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

export function NotesTab() {
  const { character } = useCharacterService();
  const noteService = NoteService.getInstance();

  const initialNotes = noteService.getNotes();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDiceRolls, setEditDiceRolls] = useState<DiceRoll[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newDiceRolls, setNewDiceRolls] = useState<DiceRoll[]>([]);
  const [openNotes, setOpenNotes] = useState<Set<string>>(
    new Set(initialNotes.map((note) => note.id)),
  );

  const refreshNotes = () => {
    setNotes(noteService.getNotes());
  };

  const handleAddNote = async () => {
    if (!newTitle.trim()) return;

    try {
      const newNote = await noteService.addNote(newTitle, newContent, newDiceRolls);
      setNewTitle("");
      setNewContent("");
      setNewDiceRolls([]);
      setIsAddingNew(false);
      refreshNotes();
      // Auto-expand the new note
      setOpenNotes((prev) => new Set([...prev, newNote.id]));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add note");
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditDiceRolls(note.diceRolls || []);
  };

  const handleSaveEdit = async () => {
    if (!editingNoteId) return;

    try {
      await noteService.updateNote(editingNoteId, {
        title: editTitle,
        content: editContent,
        diceRolls: editDiceRolls,
      });
      setEditingNoteId(null);
      setEditTitle("");
      setEditContent("");
      setEditDiceRolls([]);
      refreshNotes();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update note");
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditTitle("");
    setEditContent("");
    setEditDiceRolls([]);
  };

  const handleRollDice = async (noteId: string, rollId: string) => {
    try {
      await noteService.rollDiceFromNote(noteId, rollId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to roll dice");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    await noteService.deleteNote(noteId);
    setOpenNotes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(noteId);
      return newSet;
    });
    refreshNotes();
  };

  const toggleNote = (noteId: string) => {
    const newOpenNotes = new Set(openNotes);
    if (newOpenNotes.has(noteId)) {
      newOpenNotes.delete(noteId);
    } else {
      newOpenNotes.add(noteId);
    }
    setOpenNotes(newOpenNotes);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = notes.findIndex((note) => note.id === active.id);
      const newIndex = notes.findIndex((note) => note.id === over.id);

      const newNotes = arrayMove(notes, oldIndex, newIndex);
      setNotes(newNotes);

      // Update sort order in the service
      await noteService.reorderNotes(newNotes.map((note) => note.id));
    }
  };

  if (!character) {
    return <div className="p-4 text-center text-muted-foreground">No character selected</div>;
  }

  const canAddMore = notes.length < gameConfig.notes.maxNotes;

  return (
    <div className="space-y-4">
      {/* Header with Help Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notes</h2>
        <DiceFormulaHelpDialog />
      </div>

      {/* Add New Note Section */}
      {isAddingNew ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <Textarea
                placeholder="Content (Markdown supported)"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                maxLength={gameConfig.notes.maxContentLength}
                rows={6}
                className="font-mono text-sm"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {newContent.length} / {gameConfig.notes.maxContentLength} characters
              </div>
            </div>

            {/* Dice Rolls Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Dice Rolls</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newRoll: DiceRoll = {
                      id: uuidv4(),
                      name: "",
                      formula: "",
                    };
                    setNewDiceRolls([...newDiceRolls, newRoll]);
                  }}
                  disabled={newDiceRolls.length >= 20}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Roll
                </Button>
              </div>
              {newDiceRolls.map((roll, index) => (
                <div key={roll.id} className="flex gap-2 items-start">
                  <Input
                    placeholder="Name"
                    value={roll.name}
                    onChange={(e) => {
                      const updated = [...newDiceRolls];
                      updated[index] = { ...roll, name: e.target.value };
                      setNewDiceRolls(updated);
                    }}
                    maxLength={50}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Formula (e.g., 1d20+5)"
                    value={roll.formula}
                    onChange={(e) => {
                      const updated = [...newDiceRolls];
                      updated[index] = { ...roll, formula: e.target.value };
                      setNewDiceRolls(updated);
                    }}
                    maxLength={100}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewDiceRolls(newDiceRolls.filter((_, i) => i !== index));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddNote} disabled={!newTitle.trim()}>
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingNew(false);
                  setNewTitle("");
                  setNewContent("");
                  setNewDiceRolls([]);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsAddingNew(true)} disabled={!canAddMore} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Note {!canAddMore && `(Max ${gameConfig.notes.maxNotes} reached)`}
        </Button>
      )}

      {/* Notes List */}
      {notes.length === 0 && !isAddingNew && (
        <div className="text-center text-muted-foreground p-8">
          No notes yet. Click "Add Note" to create your first note.
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={notes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
          {notes.map((note) => (
            <SortableNote
              key={note.id}
              note={note}
              isOpen={openNotes.has(note.id)}
              isEditing={editingNoteId === note.id}
              editTitle={editTitle}
              editContent={editContent}
              editDiceRolls={editDiceRolls}
              onToggle={() => toggleNote(note.id)}
              onEdit={() => handleEditNote(note)}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              onDelete={() => handleDeleteNote(note.id)}
              onEditTitleChange={setEditTitle}
              onEditContentChange={setEditContent}
              onEditDiceRollsChange={setEditDiceRolls}
              onRollDice={(rollId) => handleRollDice(note.id, rollId)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
