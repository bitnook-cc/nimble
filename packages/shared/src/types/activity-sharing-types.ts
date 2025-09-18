import { z } from "zod";
import {
  userInfoSchema,
  sessionParticipantSchema,
  gameSessionSchema,
  sharedActivityLogEntrySchema,
  activityResponseSchema,
  createSessionRequestSchema,
  joinSessionRequestSchema,
  shareActivityRequestSchema,
  createSessionResponseSchema,
  joinSessionResponseSchema,
  getSessionResponseSchema,
  closeSessionResponseSchema,
  errorResponseSchema,
  successResponseSchema,
} from "../schemas/activity-sharing.js";

// Inferred types from schemas
export type UserInfo = z.infer<typeof userInfoSchema>;
export type SessionParticipant = z.infer<typeof sessionParticipantSchema>;
export type GameSession = z.infer<typeof gameSessionSchema>;
export type SharedActivityLogEntry = z.infer<
  typeof sharedActivityLogEntrySchema
>;
export type ActivityResponse = z.infer<typeof activityResponseSchema>;

// Request types
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;
export type JoinSessionRequest = z.infer<typeof joinSessionRequestSchema>;
export type ShareActivityRequest = z.infer<typeof shareActivityRequestSchema>;

// Response types
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;
export type JoinSessionResponse = z.infer<typeof joinSessionResponseSchema>;
export type GetSessionResponse = z.infer<typeof getSessionResponseSchema>;
export type CloseSessionResponse = z.infer<typeof closeSessionResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type SuccessResponse = z.infer<typeof successResponseSchema>;

// Union types for API responses
export type ApiResponse<T> = T | ErrorResponse;

// Specific API response types
export type CreateSessionApiResponse = ApiResponse<CreateSessionResponse>;
export type JoinSessionApiResponse = ApiResponse<JoinSessionResponse>;
export type GetSessionApiResponse = ApiResponse<GetSessionResponse>;
export type GetActivityApiResponse = ApiResponse<ActivityResponse>;
export type ShareActivityApiResponse = ApiResponse<{ id: string }>; // Returns the created log entry ID
export type CloseSessionApiResponse = ApiResponse<CloseSessionResponse>;
export type LeaveSessionApiResponse = ApiResponse<SuccessResponse>;
