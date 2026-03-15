import { z } from "zod";

import { gameConfig } from "@/lib/config/game-config";

export const diceRollSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  formula: z.string().min(1, "Formula is required").max(100, "Formula too long"),
});

export const noteSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  content: z
    .string()
    .max(
      gameConfig.notes.maxContentLength,
      `Content exceeds maximum length of ${gameConfig.notes.maxContentLength} characters`,
    ),
  sortOrder: z.number().int().min(0),
  diceRolls: z.array(diceRollSchema).max(20, "Maximum 20 dice rolls per note").default([]),
});
