import { z } from "zod";
import { id } from "zod/v4/locales";

// User info schema (minimal user data for responses)
export const userInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// Session participant schema
export const sessionParticipantSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  characterId: z.string(),
  characterName: z.string(),
  joinedAt: z.string().datetime(),
  lastActiveAt: z.string().datetime(),
  user: userInfoSchema,
});

// Game session schema
export const gameSessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  isActive: z.boolean(),
  maxPlayers: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  owner: userInfoSchema,
  participants: z.array(sessionParticipantSchema),
});

// Activity log entry schema (using any for now since LogEntry is complex)
export const sharedActivityLogEntrySchema = z.object({
  id: z.string(),
  user: userInfoSchema,
  characterId: z.string(),
  characterName: z.string(),
  logEntry: z.any(), // This would be the LogEntry from activity-log schemas
  timestamp: z.string().datetime(),
});

// Activity response schema (for paginated responses)
export const activityResponseSchema = z.object({
  data: z.array(sharedActivityLogEntrySchema),
  next_cursor: z.string().nullable(),
});

// Request schemas
export const createSessionRequestSchema = z.object({
  name: z.string().min(1).max(100),
});

export const joinSessionRequestSchema = z.object({
  characterId: z.string(),
  characterName: z.string().min(1).max(100),
});

export const shareActivityRequestSchema = z.object({
  characterId: z.string(),
  logEntry: z.any(), // LogEntry type
});

// Response schemas
export const createSessionResponseSchema = gameSessionSchema;
export const joinSessionResponseSchema = sessionParticipantSchema;
export const getSessionResponseSchema = gameSessionSchema;
export const closeSessionResponseSchema = gameSessionSchema;

// Error response schema
export const errorResponseSchema = z.object({
  error: z.string(),
});

// Success response schema
export const successResponseSchema = z.object({
  success: z.boolean(),
});
