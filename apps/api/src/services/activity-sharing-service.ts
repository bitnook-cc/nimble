import { PrismaClient, Prisma } from "@prisma/client";
import { pusher } from "../lib/pusher.js";
import { realtime } from "@nimble/shared";

// Use Prisma's auto-generated types with relations
type GameSessionWithRelations = Prisma.GameSessionGetPayload<{
  include: {
    owner: {
      select: { name: true };
    };
    participants: {
      include: {
        user: {
          select: { name: true };
        };
      };
    };
  };
}>;

type SessionParticipantWithUser = Prisma.SessionParticipantGetPayload<{
  include: {
    user: {
      select: { name: true };
    };
  };
}>;

type SharedActivityLogWithUser = Prisma.SharedActivityLogGetPayload<{
  include: {
    user: {
      select: { name: true };
    };
  };
}>;

const prisma = new PrismaClient();

// Configuration constants
const JOIN_CODE_LENGTH = parseInt(process.env.JOIN_CODE_LENGTH || "6");
const MAX_PLAYERS_PER_SESSION = parseInt(
  process.env.MAX_PLAYERS_PER_SESSION || "20",
);

function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export class ActivitySharingService {
  /**
   * Create a new gaming session
   */
  async createSession(
    userId: string,
    sessionData: realtime.CreateSessionRequest,
  ): Promise<realtime.GameSession> {
    const code = await this.generateUniqueJoinCode();
    const session = await prisma.gameSession.create({
      data: {
        sessionName: sessionData.name,
        code,
        ownerId: userId,
      },
      include: {
        owner: {
          select: { name: true, email: true },
        },
        participants: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Broadcast session creation via Pusher
    await pusher.trigger(
      this.pusherChannel(session),
      realtime.PUSHER_EVENTS.SESSION_CREATED,
      {
        session: this.formatSessionResponse(session),
      },
    );

    return this.formatSessionResponse(session);
  }

  /**
   * Join a gaming session
   */
  async joinSession(
    userId: string,
    sessionCode: string,
    joinData: { characterId: string; characterName: string },
  ): Promise<realtime.SessionParticipant> {
    const { characterId, characterName } = joinData;

    const session = await prisma.gameSession.findUnique({
      where: { code: sessionCode.toUpperCase() },
      include: {
        participants: true,
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (!session.isActive) {
      throw new Error("Session is not active");
    }

    if (session.participants.length >= MAX_PLAYERS_PER_SESSION) {
      throw new Error("Session is full");
    }

    // Check if user is already in session
    const existingParticipant = session.participants.find(
      (p) => p.userId === userId,
    );

    if (existingParticipant) {
      // Update their character
      const updatedParticipant = await prisma.sessionParticipant.update({
        where: { id: existingParticipant.id },
        data: {
          characterId,
          characterName,
          lastActiveAt: new Date(),
        },
        include: {
          user: {
            select: { name: true },
          },
        },
      });

      // Broadcast participant update via Pusher
      await pusher.trigger(
        this.pusherChannel(session),
        realtime.PUSHER_EVENTS.PARTICIPANT_UPDATED,
        {
          participant: this.formatParticipantResponse(updatedParticipant),
        },
      );

      return this.formatParticipantResponse(updatedParticipant);
    } else {
      // Create new participant
      const newParticipant = await prisma.sessionParticipant.create({
        data: {
          sessionId: session.id,
          userId: userId,
          characterId,
          characterName,
        },
        include: {
          user: {
            select: { name: true },
          },
        },
      });

      // Broadcast participant join via Pusher
      await pusher.trigger(
        this.pusherChannel(session),
        realtime.PUSHER_EVENTS.PARTICIPANT_JOINED,
        {
          participant: this.formatParticipantResponse(newParticipant),
        },
      );

      return this.formatParticipantResponse(newParticipant);
    }
  }

  /**
   * Leave a gaming session by ID
   */
  async leaveSession(userId: string, sessionId: string): Promise<void> {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          where: { userId },
        },
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    const participant = session.participants[0];
    if (!participant) {
      throw new Error("Not a participant in this session");
    }

    // Remove participant
    await prisma.sessionParticipant.delete({
      where: { id: participant.id },
    });

    // Broadcast participant leave via Pusher
    await pusher.trigger(
      this.pusherChannel(session),
      realtime.PUSHER_EVENTS.PARTICIPANT_LEFT,
      {
        participantId: participant.id,
        userId: participant.userId,
      },
    );
  }

  /**
   * Get session information by ID
   */
  async getSession(sessionId: string): Promise<realtime.GameSession> {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        owner: {
          select: { name: true, email: true },
        },
        participants: {
          include: {
            user: {
              select: { name: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    return this.formatSessionResponse(session);
  }

  /**
   * Share activity log entry by session ID
   */
  async shareActivity(
    userId: string,
    sessionId: string,
    activityData: { characterId: string; logEntry: Prisma.InputJsonValue },
  ): Promise<realtime.SharedActivityLogEntry> {
    const { characterId, logEntry } = activityData;

    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          where: { userId },
        },
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (!session.isActive) {
      throw new Error("Session is not active");
    }

    // Verify user is a participant
    const participant = session.participants.find(
      (p) => p.userId === userId && p.characterId === characterId,
    );

    if (!participant) {
      throw new Error("Not authorized to share activity for this character");
    }

    // Store the activity log entry
    const sharedLog = await prisma.sharedActivityLog.create({
      data: {
        sessionId: session.id,
        userId: userId,
        characterId,
        logEntry,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    const formattedEntry = this.formatActivityLogResponse(
      sharedLog as SharedActivityLogWithUser,
      participant.characterName,
    );

    // Broadcast activity via Pusher
    await pusher.trigger(
      this.pusherChannel(session),
      realtime.PUSHER_EVENTS.ACTIVITY_SHARED,
      {
        activity: formattedEntry,
      },
    );

    return formattedEntry;
  }

  /**
   * Get activity log entries for a session by ID
   */
  async getActivityLog(
    sessionId: string,
    options: { cursor?: string; limit?: number } = {},
  ): Promise<realtime.ActivityResponse> {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    const limit = Math.min(options.limit || 50, 100); // Max 100 entries per request

    // Build where clause
    const whereClause: {
      sessionId: string;
      id?: { lt: string };
    } = {
      sessionId: session.id,
    };

    if (options.cursor) {
      whereClause.id = {
        lt: options.cursor, // Get entries older than cursor
      };
    }

    const logs = await prisma.sharedActivityLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit + 1, // Take one extra to determine if there are more
    });

    const hasMore = logs.length > limit;
    const entries = logs.slice(0, limit);
    const nextCursor = hasMore ? entries[entries.length - 1]?.id : null;

    // Get participant info for character names
    const participants = await prisma.sessionParticipant.findMany({
      where: { sessionId: session.id },
      select: { characterId: true, characterName: true },
    });

    const participantMap = new Map(
      participants.map((p) => [p.characterId, p.characterName]),
    );

    return {
      data: entries.map((log) =>
        this.formatActivityLogResponse(
          log,
          participantMap.get(log.characterId),
        ),
      ),
      next_cursor: nextCursor,
    };
  }

  /**
   * Close a gaming session by ID (owner only)
   */
  async closeSession(userId: string, sessionId: string): Promise<void> {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.ownerId !== userId) {
      throw new Error("Only the session owner can close the session");
    }

    // Update session to inactive
    await prisma.gameSession.update({
      where: { id: session.id },
      data: { isActive: false },
    });

    // Broadcast session closure via Pusher
    await pusher.trigger(
      this.pusherChannel(session),
      realtime.PUSHER_EVENTS.SESSION_CLOSED,
      {
        sessionId: session.id,
        code: session.code,
      },
    );
  }

  /**
   * Remove a participant from a session (owner only)
   */
  async removeParticipant(
    userId: string,
    sessionId: string,
    participantId: string,
  ): Promise<void> {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          where: { id: participantId },
        },
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.ownerId !== userId) {
      throw new Error("Only the session owner can remove participants");
    }

    const participant = session.participants[0];
    if (!participant) {
      throw new Error("Participant not found in this session");
    }

    // Remove participant
    await prisma.sessionParticipant.delete({
      where: { id: participantId },
    });

    // Broadcast participant removal via Pusher
    await pusher.trigger(
      this.pusherChannel(session),
      realtime.PUSHER_EVENTS.PARTICIPANT_REMOVED,
      {
        participantId: participantId,
        userId: participant.userId,
        removedBy: userId,
      },
    );
  }

  private async generateUniqueJoinCode(): Promise<string> {
    // Generate unique join code
    let code: string;
    let attempts = 0;
    do {
      code = generateJoinCode();
      attempts++;
      const existing = await prisma.gameSession.findUnique({ where: { code } });
      if (!existing) break;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new Error("Could not generate unique join code");
    }
    return code;
  }

  private pusherChannel(session: { id: string }): realtime.SessionChannelName {
    return realtime.getSessionChannel(session.id);
  }

  /**
   * Format session response with computed fields
   */
  private formatSessionResponse(
    session: GameSessionWithRelations,
  ): realtime.GameSession {
    return {
      id: session.id,
      name: session.sessionName,
      code: session.code,
      ownerId: session.ownerId,
      isActive: session.isActive,
      maxPlayers: MAX_PLAYERS_PER_SESSION,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      owner: {
        name: session.owner.name,
      },
      participants: session.participants.map((p) =>
        this.formatParticipantResponse(p),
      ),
    };
  }

  /**
   * Format participant response
   */
  private formatParticipantResponse(
    participant: SessionParticipantWithUser,
  ): realtime.SessionParticipant {
    return {
      id: participant.id,
      sessionId: participant.sessionId,
      userId: participant.userId,
      characterId: participant.characterId,
      characterName: participant.characterName,
      joinedAt: participant.joinedAt.toISOString(),
      lastActiveAt: participant.lastActiveAt.toISOString(),
      user: {
        name: participant.user.name,
      },
    };
  }

  /**
   * Format activity log response
   */
  private formatActivityLogResponse(
    log: SharedActivityLogWithUser,
    characterName?: string,
  ): realtime.SharedActivityLogEntry {
    return {
      id: log.id,
      userId: log.userId,
      characterId: log.characterId,
      characterName: characterName || "Unknown Character",
      userName: log.user.name,
      logEntry: log.logEntry,
      timestamp: log.timestamp.toISOString(),
    };
  }
}

export const activitySharingService = new ActivitySharingService();
