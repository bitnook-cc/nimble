import { realtime } from "@nimble/shared";

import { apiFetch } from "../utils/api.js";

interface SessionState {
  session: realtime.GameSession;
  characterId: string;
}

class ActivitySharingService {
  private currentSessionState: SessionState | null = null;
  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await apiFetch(`/api${endpoint}`, {
      ...options,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Network error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Create a new gaming session
  async createSession(request: realtime.CreateSessionRequest): Promise<realtime.GameSession> {
    return this.apiCall<realtime.GameSession>("/sessions", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Join a gaming session
  async joinSession(
    code: string,
    request: realtime.JoinSessionRequest,
  ): Promise<realtime.SessionParticipant> {
    return this.apiCall<realtime.SessionParticipant>(`/sessions/${code}/join`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Leave a gaming session (now uses session ID)
  async leaveSession(sessionId: string): Promise<{ success: boolean }> {
    return this.apiCall<{ success: boolean }>(`/sessions/${sessionId}/leave`, {
      method: "POST",
    });
  }

  // Get session info by code (for joining)
  async getSession(code: string): Promise<realtime.GameSession> {
    return this.apiCall<realtime.GameSession>(`/sessions/${code}`);
  }

  // Get session info by ID (for subsequent operations)
  async getSessionById(sessionId: string): Promise<realtime.GameSession> {
    return this.apiCall<realtime.GameSession>(`/sessions/${sessionId}`);
  }

  // Share an activity log entry (now uses session ID)
  async shareActivity(sessionId: string, request: realtime.ShareActivityRequest): Promise<void> {
    await this.apiCall(`/sessions/${sessionId}/activity`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Get activity log history for a session (cursor-based pagination) (now uses session ID)
  async getActivityHistory(sessionId: string, cursor?: string): Promise<realtime.ActivityResponse> {
    const endpoint = cursor
      ? `/sessions/${sessionId}/activity?cursor=${encodeURIComponent(cursor)}`
      : `/sessions/${sessionId}/activity`;

    return this.apiCall<realtime.ActivityResponse>(endpoint);
  }

  // Close/deactivate session (owner only) (now uses session ID)
  async closeSession(sessionId: string): Promise<realtime.GameSession> {
    return this.apiCall<realtime.GameSession>(`/sessions/${sessionId}/close`, {
      method: "POST",
    });
  }

  // Remove participant from session (owner only)
  async removeParticipant(sessionId: string, participantId: string): Promise<{ success: boolean }> {
    return this.apiCall<{ success: boolean }>(
      `/sessions/${sessionId}/participants/${participantId}`,
      {
        method: "DELETE",
      },
    );
  }

  // Session state management
  setSessionState(sessionState: SessionState): void {
    this.currentSessionState = sessionState;
  }

  clearSessionState(): void {
    this.currentSessionState = null;
  }

  getSessionState(): SessionState | null {
    return this.currentSessionState;
  }

  isInSession(): boolean {
    return this.currentSessionState !== null;
  }

  getCurrentSession(): realtime.GameSession | null {
    return this.currentSessionState?.session || null;
  }

  getCurrentCharacterId(): string | null {
    return this.currentSessionState?.characterId || null;
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionState?.session.id || null;
  }
}

export const activitySharingService = new ActivitySharingService();
