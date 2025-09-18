import { z } from "zod";
import {
  gameSessionSchema,
  sessionParticipantSchema,
  sharedActivityLogEntrySchema,
} from "../schemas/activity-sharing.js";

// Event name constants
export const PUSHER_EVENTS = {
  SESSION_CREATED: "session-created",
  SESSION_CLOSED: "session-closed",
  PARTICIPANT_JOINED: "participant-joined",
  PARTICIPANT_UPDATED: "participant-updated",
  PARTICIPANT_LEFT: "participant-left",
  PARTICIPANT_REMOVED: "participant-removed",
  ACTIVITY_SHARED: "activity-shared",
} as const;

export type PusherEventName =
  (typeof PUSHER_EVENTS)[keyof typeof PUSHER_EVENTS];

// Event payload schemas
export const sessionCreatedPayloadSchema = z.object({
  session: gameSessionSchema,
});

export const sessionClosedPayloadSchema = z.object({
  sessionId: z.string(),
  code: z.string(),
});

export const participantJoinedPayloadSchema = z.object({
  participant: sessionParticipantSchema,
});

export const participantUpdatedPayloadSchema = z.object({
  participant: sessionParticipantSchema,
});

export const participantLeftPayloadSchema = z.object({
  participantId: z.string(),
  userId: z.string(),
});

export const participantRemovedPayloadSchema = z.object({
  participantId: z.string(),
  userId: z.string(),
  removedBy: z.string(),
});

export const activitySharedPayloadSchema = z.object({
  activity: sharedActivityLogEntrySchema,
});

// Event payload types
export type SessionCreatedPayload = z.infer<typeof sessionCreatedPayloadSchema>;
export type SessionClosedPayload = z.infer<typeof sessionClosedPayloadSchema>;
export type ParticipantJoinedPayload = z.infer<
  typeof participantJoinedPayloadSchema
>;
export type ParticipantUpdatedPayload = z.infer<
  typeof participantUpdatedPayloadSchema
>;
export type ParticipantLeftPayload = z.infer<
  typeof participantLeftPayloadSchema
>;
export type ParticipantRemovedPayload = z.infer<
  typeof participantRemovedPayloadSchema
>;
export type ActivitySharedPayload = z.infer<typeof activitySharedPayloadSchema>;

// Union type for all possible event payloads
export type PusherEventPayload =
  | SessionCreatedPayload
  | SessionClosedPayload
  | ParticipantJoinedPayload
  | ParticipantUpdatedPayload
  | ParticipantLeftPayload
  | ParticipantRemovedPayload
  | ActivitySharedPayload;

// Type-safe event map
export interface PusherEventMap {
  [PUSHER_EVENTS.SESSION_CREATED]: SessionCreatedPayload;
  [PUSHER_EVENTS.SESSION_CLOSED]: SessionClosedPayload;
  [PUSHER_EVENTS.PARTICIPANT_JOINED]: ParticipantJoinedPayload;
  [PUSHER_EVENTS.PARTICIPANT_UPDATED]: ParticipantUpdatedPayload;
  [PUSHER_EVENTS.PARTICIPANT_LEFT]: ParticipantLeftPayload;
  [PUSHER_EVENTS.PARTICIPANT_REMOVED]: ParticipantRemovedPayload;
  [PUSHER_EVENTS.ACTIVITY_SHARED]: ActivitySharedPayload;
}

// Helper type for channel names
export type SessionChannelName = `session-${string}`;

// Helper function to generate channel names
export function getSessionChannel(sessionId: string): SessionChannelName {
  return `session-${sessionId}`;
}
