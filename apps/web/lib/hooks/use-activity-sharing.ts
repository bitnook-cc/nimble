"use client";

import { realtime } from "@nimble/shared";

import { useCallback, useEffect, useState } from "react";

import { activitySharingService } from "../services/activity-sharing-service";

interface ActivitySharingState {
  sessionCode: string | null;
  characterId: string | null;
  session: realtime.GameSession | null;
  loading: boolean;
  error: string | null;
}

interface UseActivitySharingReturn {
  // State
  sessionCode: string | null;
  characterId: string | null;
  session: realtime.GameSession | null;
  isInSession: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  createSession: (sessionName: string, characterId: string) => Promise<void>;
  joinSession: (joinCode: string, characterId: string, characterName: string) => Promise<void>;
  leaveSession: () => Promise<void>;
  closeSession: () => Promise<void>;
  updateSession: (session: realtime.GameSession) => void;
  clearError: () => void;
}

export function useActivitySharing(): UseActivitySharingReturn {
  const [state, setState] = useState<ActivitySharingState>({
    sessionCode: null,
    characterId: null,
    session: null,
    loading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const createSession = useCallback(
    async (sessionName: string, characterId: string) => {
      if (!sessionName.trim()) {
        setError("Please enter a session name");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const session = await activitySharingService.createSession({
          name: sessionName,
        } satisfies realtime.CreateSessionRequest);

        setState((prev) => ({
          ...prev,
          sessionCode: session.code,
          characterId,
          session,
          loading: false,
        }));
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to create session");
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  const joinSession = useCallback(
    async (joinCode: string, characterId: string, characterName: string) => {
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
        const session = await activitySharingService.getSession(joinCode.toUpperCase());

        setState((prev) => ({
          ...prev,
          sessionCode: session.code,
          characterId,
          session,
          loading: false,
        }));
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to join session");
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  const leaveSession = useCallback(async () => {
    if (!state.session) return;

    setLoading(true);
    setError(null);
    try {
      await activitySharingService.leaveSession(state.session.id);
      setState({
        sessionCode: null,
        characterId: null,
        session: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to leave session");
      setLoading(false);
    }
  }, [state.session, setLoading, setError]);

  const closeSession = useCallback(async () => {
    if (!state.session) return;

    setLoading(true);
    setError(null);
    try {
      await activitySharingService.closeSession(state.session.id);
      setState({
        sessionCode: null,
        characterId: null,
        session: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to close session");
      setLoading(false);
    }
  }, [state.session, setLoading, setError]);

  // Sync session state with activity sharing service
  useEffect(() => {
    if (state.sessionCode && state.characterId && state.session) {
      activitySharingService.setSessionState({
        session: state.session,
        characterId: state.characterId,
      });
    } else {
      activitySharingService.clearSessionState();
    }
  }, [state.sessionCode, state.characterId, state.session]);

  const updateSession = useCallback((session: realtime.GameSession) => {
    setState((prev) => ({
      ...prev,
      session,
    }));
  }, []);

  const isInSession = Boolean(state.sessionCode && state.characterId && state.session);

  return {
    sessionCode: state.sessionCode,
    characterId: state.characterId,
    session: state.session,
    isInSession,
    loading: state.loading,
    error: state.error,
    createSession,
    joinSession,
    leaveSession,
    closeSession,
    updateSession,
    clearError,
  };
}
