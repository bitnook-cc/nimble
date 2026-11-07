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
} from "lucide-react";
import remarkGfm from "remark-gfm";
import { v4 as uuidv4 } from "uuid";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useToastService } from "@/lib/hooks/use-toast-service";
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
  onDone: () => void;
  saveStatus: string;
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
  onDone,
  saveStatus,
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
                  aria-label={`Reorder ${note.title}`}
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
                            name: "New roll",
                            formula: "1d20",
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
                          aria-label={`Roll ${index + 1} name`}
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
                          aria-label={`Roll ${index + 1} formula`}
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
                          aria-label={`Remove dice roll ${roll.name || `#${index + 1}`}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={onDone} disabled={saveStatus === "Saving…"} size="sm">
                      <Check className="h-4 w-4" />{" "}
                      {saveStatus === "Couldn’t save" ? "Retry save" : "Done"}
                    </Button>
                    <span role="status" className="text-sm text-muted-foreground">
                      {saveStatus}
                    </span>
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
                            <div className="font-medium text-sm truncate">
                              {roll.name || "Unnamed roll"}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {roll.formula}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={`Roll ${roll.name || "dice"}`}
                            disabled={!roll.formula.trim()}
                            onClick={() => onRollDice(roll.id)}
                          >
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
  const { showError } = useToastService();
  const noteService = NoteService.getInstance();

  const initialNotes = noteService.getNotes();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDiceRolls, setEditDiceRolls] = useState<DiceRoll[]>([]);
  const [creating, setCreating] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved on this device");
  const [openNotes, setOpenNotes] = useState<Set<string>>(
    new Set(initialNotes.map((note) => note.id)),
  );
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const refreshNotes = () => {
    setNotes(noteService.getNotes());
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title === "Untitled note" ? "" : note.title);
    setEditContent(note.content);
    setEditDiceRolls(note.diceRolls);
    setOpenNotes((prev) => new Set([...prev, note.id]));
    setSaveStatus("Saved on this device");
  };

  const handleAddNote = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const note = await noteService.addNote("Untitled note", "");
      refreshNotes();
      handleEditNote(note);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Couldn’t add note");
    } finally {
      setCreating(false);
    }
  };

  // Save in the input event. Tab changes, character switches and reloads
  // need no timer, teardown callback or manual save.
  const persist = async (title: string, content: string, diceRolls: DiceRoll[]) => {
    if (!editingNoteId) return false;
    setSaveStatus("Saving…");
    try {
      await noteService.updateNote(editingNoteId, {
        title: title.trim() || "Untitled note",
        content,
        diceRolls,
      });
      refreshNotes();
      setSaveStatus("Saved on this device");
      return true;
    } catch {
      setSaveStatus("Couldn’t save");
      return false;
    }
  };

  const handleRollDice = async (noteId: string, rollId: string) => {
    try {
      await noteService.rollDiceFromNote(noteId, rollId);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to roll dice");
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;

    await noteService.deleteNote(noteToDelete);
    setOpenNotes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(noteToDelete);
      return newSet;
    });
    setNoteToDelete(null);
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

      <Button onClick={handleAddNote} disabled={!canAddMore || creating} className="w-full">
        <Plus className="w-4 h-4" /> Add Note{" "}
        {!canAddMore && `(Max ${gameConfig.notes.maxNotes} reached)`}
      </Button>

      {/* Notes List */}
      {notes.length === 0 && (
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
              saveStatus={saveStatus}
              onDone={async () => {
                if (
                  saveStatus !== "Couldn’t save" ||
                  (await persist(editTitle, editContent, editDiceRolls))
                )
                  setEditingNoteId(null);
              }}
              onDelete={() => handleDeleteNote(note.id)}
              onEditTitleChange={(title) => {
                setEditTitle(title);
                void persist(title, editContent, editDiceRolls);
              }}
              onEditContentChange={(content) => {
                setEditContent(content);
                void persist(editTitle, content, editDiceRolls);
              }}
              onEditDiceRollsChange={(rolls) => {
                setEditDiceRolls(rolls);
                void persist(editTitle, editContent, rolls);
              }}
              onRollDice={(rollId) => handleRollDice(note.id, rollId)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
