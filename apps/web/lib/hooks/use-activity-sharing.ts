"use client";

import { realtime } from "@nimble/shared";

import { useEffect, useState } from "react";

import { getActivitySharingService } from "../services/service-factory";

interface SessionActivityEntry {
  id: string;
  sessionId: string;
  characterId: string;
  characterName: string;
  userName: string;
  activityData: any; // LogEntry type
  timestamp: string;
}

interface UseActivitySharingReturn {
  // State
  sessionCode: string | null;
  characterId: string | null;
  session: realtime.GameSession | null;
  isInSession: boolean;
  loading: boolean;
  error: string | null;

  // User sessions
  userSessions: realtime.GameSession[];
  userSessionsLoading: boolean;

  // Pusher and log entries
  pusherConnected: boolean;
  receivedLogEntries: SessionActivityEntry[];
  receivedLogEntriesLoading: boolean;

  // Actions
  createSession: (sessionName: string, characterId: string, characterName: string) => Promise<void>;
  joinSession: (joinCode: string, characterId: string, characterName: string) => Promise<void>;
  leaveSession: () => Promise<void>;
  closeSession: () => Promise<void>;
  updateSession: (session: realtime.GameSession) => void;
  clearError: () => void;

  // User session actions
  loadUserSessions: () => Promise<void>;
  joinUserSession: (
    sessionCode: string,
    characterId: string,
    characterName: string,
  ) => Promise<void>;
}

export function useActivitySharing(): UseActivitySharingReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the singleton service instance
  const activitySharingService = getActivitySharingService();

  // Initialize state from service
  const initialState = {
    sessionState: activitySharingService.getSessionState(),
    userSessions: activitySharingService.getCachedUserSessions(),
    userSessionsLoading: activitySharingService.isLoadingUserSessions(),
    pusherConnected: false,
    receivedLogEntries: [] as SessionActivityEntry[],
    receivedLogEntriesLoading: false,
  };

  const [serviceState, setServiceState] = useState(initialState);

  // Subscribe to service changes
  useEffect(() => {
    const unsubscribe = activitySharingService.subscribe((state) => {
      setServiceState(state);
    });
    return unsubscribe;
  }, [activitySharingService]);

  // Derive values from service state
  const sessionCode = serviceState.sessionState?.session.code || null;
  const characterId = serviceState.sessionState?.characterId || null;
  const session = serviceState.sessionState?.session || null;
  const isInSession = Boolean(serviceState.sessionState);

  const clearError = () => {
    setError(null);
  };

  const createSession = async (sessionName: string, characterId: string, characterName: string) => {
    if (!sessionName.trim()) {
      setError("Please enter a session name");
      return;
    }

    if (!characterId) {
      setError("No character selected");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Create the session
      const session = await activitySharingService.createSession({
        name: sessionName,
      } satisfies realtime.CreateSessionRequest);
      
      // Automatically join the newly created session
      await activitySharingService.joinSession(session.code, {
        characterId,
        characterName,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create and join session");
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async (joinCode: string, characterId: string, characterName: string) => {
    if (!joinCode.trim()) {
      setError("Please enter a join code");
      return;
    }

    if (!characterId) {
      setError("No character selected");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await activitySharingService.joinSession(joinCode.toUpperCase(), {
        characterId,
        characterName,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to join session");
    } finally {
      setLoading(false);
    }
  };

  const leaveSession = async () => {
    const sessionState = activitySharingService.getSessionState();
    if (!sessionState) return;

    setLoading(true);
    setError(null);
    try {
      await activitySharingService.leaveSession(sessionState.session.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to leave session");
    } finally {
      setLoading(false);
    }
  };

  const closeSession = async () => {
    const sessionState = activitySharingService.getSessionState();
    if (!sessionState) return;

    setLoading(true);
    setError(null);
    try {
      await activitySharingService.closeSession(sessionState.session.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to close session");
    } finally {
      setLoading(false);
    }
  };

  const updateSession = (session: realtime.GameSession) => {
    activitySharingService.updateSession(session);
  };

  const loadUserSessions = async () => {
    try {
      await activitySharingService.getUserSessions();
    } catch (error) {
      console.error("Failed to load user sessions:", error);
      // Don't show toast for this, it's not critical
    }
  };

  const joinUserSession = async (sessionCode: string, characterId: string, characterName: string) => {
    setLoading(true);
    setError(null);
    try {
      await activitySharingService.joinUserSession(
        sessionCode,
        characterId,
        characterName,
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to join session");
    } finally {
      setLoading(false);
    }
  };

  return {
    sessionCode,
    characterId,
    session,
    isInSession,
    loading,
    error,
    userSessions: serviceState.userSessions,
    userSessionsLoading: serviceState.userSessionsLoading,
    pusherConnected: serviceState.pusherConnected,
    receivedLogEntries: serviceState.receivedLogEntries,
    receivedLogEntriesLoading: serviceState.receivedLogEntriesLoading,
    createSession,
    joinSession,
    leaveSession,
    closeSession,
    updateSession,
    clearError,
    loadUserSessions,
    joinUserSession,
  };
}
