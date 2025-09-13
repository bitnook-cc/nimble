import { z } from 'zod';

/**
 * Syncable trait that can be mixed into other schemas
 * These fields are managed by the sync system
 */
export const syncableSchema = z.object({
  id: z.string(),
  timestamps: z.object({
    createdAt: z.number().optional(), // Unix timestamp in milliseconds
    updatedAt: z.number().optional(), // Unix timestamp in milliseconds
    syncedAt: z.number().optional(), // Unix timestamp in milliseconds, only set by server
  }).optional(),
});

/**
 * Type exports
 */
export type Syncable = z.infer<typeof syncableSchema>;
