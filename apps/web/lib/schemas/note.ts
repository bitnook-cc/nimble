import { z } from "zod";

import { gameConfig } from "@/lib/config/game-config";

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
});
