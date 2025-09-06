import { z } from "zod";

export const currencySchema = z.object({
  gold: z.number().min(0).optional(),
  silver: z.number().min(0).optional(),
});
