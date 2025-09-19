import { Router } from "express";
import { realtime } from "@nimble/shared";
import { activitySharingService } from "../services/activity-sharing-service.js";

const router = Router();

// List user's active sessions
router.get("/sessions", async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const sessionUser = req.session.user;

    const sessions = await activitySharingService.listUserSessions(
      sessionUser.id,
    );
    res.json(sessions);
  } catch (error) {
    console.error("Error listing user sessions:", error);
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

// Create a new gaming session
router.post("/sessions", async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json(
        realtime.errorResponseSchema.parse({
          error: "Authentication required",
        }),
      );
    }
    const sessionUser = req.session.user;

    // Validate request body
    const validation = realtime.createSessionRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(
        realtime.errorResponseSchema.parse({
          error: `Invalid request: ${validation.error.issues.map((e: any) => e.message).join(", ")}`,
        }),
      );
    }

    const session = await activitySharingService.createSession(
      sessionUser.id,
      validation.data,
    );
    res.json(session);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json(
      realtime.errorResponseSchema.parse({
        error: "Failed to create session",
      }),
    );
  }
});

// Join a gaming session
router.post("/sessions/:code/join", async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const sessionUser = req.session.user;

    const { code } = req.params;
    const { characterId, characterName } = req.body;

    if (!characterId || !characterName) {
      return res
        .status(400)
        .json({ error: "Character ID and name are required" });
    }

    const participant = await activitySharingService.joinSession(
      sessionUser.id,
      code,
      { characterId, characterName },
    );
    res.json(participant);
  } catch (error) {
    console.error("Error joining session:", error);
    res.status(500).json({ error: "Failed to join session" });
  }
});

// Leave a gaming session
router.post("/sessions/:id/leave", async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const sessionUser = req.session.user;

    const { id } = req.params;

    await activitySharingService.leaveSession(sessionUser.id, id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error leaving session:", error);
    res.status(500).json({ error: "Failed to leave session" });
  }
});

// Get session info
router.get("/sessions/:id", async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;

    const session = await activitySharingService.getSession(id);
    res.json(session);
  } catch (error) {
    console.error("Error getting session:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
});

// Share activity log entry
router.post("/sessions/:id/activity", async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const sessionUser = req.session.user;

    const { id } = req.params;
    const { characterId, logEntry } = req.body;

    if (!characterId || !logEntry) {
      return res
        .status(400)
        .json({ error: "Character ID and log entry are required" });
    }

    const sharedActivity = await activitySharingService.shareActivity(
      sessionUser.id,
      id,
      { characterId, logEntry },
    );
    res.json(sharedActivity);
  } catch (error) {
    console.error("Error sharing activity:", error);
    res.status(500).json({ error: "Failed to share activity" });
  }
});

// Get activity log history for a session (cursor-based pagination)
router.get("/sessions/:id/activity", async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const { cursor, limit } = req.query;

    const options: { cursor?: string; limit?: number } = {};
    if (cursor) options.cursor = cursor as string;
    if (limit) options.limit = parseInt(limit as string);

    const activityLog = await activitySharingService.getActivityLog(
      id,
      options,
    );
    res.json(activityLog);
  } catch (error) {
    console.error("Error getting activity history:", error);
    res.status(500).json({ error: "Failed to get activity history" });
  }
});

// Close/deactivate session (owner only)
router.post("/sessions/:id/close", async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const sessionUser = req.session.user;

    const { id } = req.params;

    await activitySharingService.closeSession(sessionUser.id, id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error closing session:", error);
    res.status(500).json({ error: "Failed to close session" });
  }
});

// Remove participant from session (owner only)
router.delete("/sessions/:id/participants/:participantId", async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const sessionUser = req.session.user;

    const { id, participantId } = req.params;

    await activitySharingService.removeParticipant(
      sessionUser.id,
      id,
      participantId,
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing participant:", error);
    res.status(500).json({ error: "Failed to remove participant" });
  }
});

export default router;
