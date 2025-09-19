import { realtime } from "@nimble/shared";
import Pusher from "pusher-js";

import { LogEntry } from "../schemas/activity-log";
import { apiFetch } from "../utils/api";

interface SessionState {
  session: realtime.GameSession;
  characterId: string;
}

interface SessionActivityEntry {
  id: string;
  sessionId: string;
  characterId: string;
  characterName: string;
  userName: string;
  activityData: LogEntry;
  timestamp: string;
}

interface ActivitySharingState {
  sessionState: SessionState | null;
  userSessions: realtime.GameSession[];
  userSessionsLoading: boolean;
  pusherConnected: boolean;
  receivedLogEntries: SessionActivityEntry[];
  receivedLogEntriesLoading: boolean;
}

type StateChangeListener = (state: ActivitySharingState) => void;

export class ActivitySharingService {
  private currentSessionState: SessionState | null = null;
  private userSessions: realtime.GameSession[] = [];
  private userSessionsLoading = false;
  private pusher: Pusher | null = null;
  private pusherConnected = false;
  private receivedLogEntries: SessionActivityEntry[] = [];
  private receivedLogEntriesLoading = false;
  private listeners: Set<StateChangeListener> = new Set();
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
    const session = await this.apiCall<realtime.GameSession>("/sessions", {
      method: "POST",
      body: JSON.stringify(request),
    });
    
    // Note: Creating a session doesn't automatically join it on the server side
    // But for better UX, we should automatically join the created session
    // This will be handled by the hook calling joinSession after createSession
    
    return session;
  }

  // Join a gaming session
  async joinSession(
    code: string,
    request: realtime.JoinSessionRequest,
  ): Promise<realtime.GameSession> {
    const session = await this.apiCall<realtime.GameSession>(`/sessions/${code}/join`, {
      method: "POST",
      body: JSON.stringify(request),
    });
    
    // Set session state when successfully joining
    this.currentSessionState = {
      session,
      characterId: request.characterId,
    };
    this.notifyListeners();
    
    // Initialize Pusher connection for real-time activity
    await this.initializePusher(session.id);
    
    return session;
  }

  // Leave a gaming session (now uses session ID)
  async leaveSession(sessionId: string): Promise<{ success: boolean }> {
    const result = await this.apiCall<{ success: boolean }>(`/sessions/${sessionId}/leave`, {
      method: "POST",
    });
    
    // Clear session state when successfully leaving
    if (result.success) {
      this.cleanupPusher();
      this.currentSessionState = null;
      this.notifyListeners();
    }
    
    return result;
  }

  // List user's active sessions
  async listUserSessions(): Promise<realtime.GameSession[]> {
    return this.apiCall<realtime.GameSession[]>("/sessions");
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
    const session = await this.apiCall<realtime.GameSession>(`/sessions/${sessionId}/close`, {
      method: "POST",
    });
    
    // Clear session state when closing (since the session is now inactive)
    this.cleanupPusher();
    this.currentSessionState = null;
    this.notifyListeners();
    
    return session;
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
    this.notifyListeners();
  }

  clearSessionState(): void {
    this.currentSessionState = null;
    this.notifyListeners();
  }

  getSessionState(): SessionState | null {
    return this.currentSessionState;
  }

  isInSession(): boolean {
    return this.currentSessionState !== null;
  }

  updateSession(session: realtime.GameSession): void {
    if (this.currentSessionState) {
      this.currentSessionState.session = session;
      this.notifyListeners();
    }
  }

  getCurrentSession(): realtime.GameSession | null {
    return this.currentSessionState?.session || null;
  }

  getCurrentCharacterId(): string | null {
    return this.currentSessionState?.characterId || null;
  }

  // User sessions management with caching
  async getUserSessions(): Promise<realtime.GameSession[]> {
    if (this.userSessionsLoading) {
      // Return cached sessions if already loading
      return this.userSessions;
    }

    this.userSessionsLoading = true;
    this.notifyListeners();
    try {
      const sessions = await this.listUserSessions();
      this.userSessions = sessions;
      return sessions;
    } finally {
      this.userSessionsLoading = false;
      this.notifyListeners();
    }
  }

  getCachedUserSessions(): realtime.GameSession[] {
    return this.userSessions;
  }

  isLoadingUserSessions(): boolean {
    return this.userSessionsLoading;
  }

  refreshUserSessions(): Promise<realtime.GameSession[]> {
    // Force refresh by clearing cache
    this.userSessions = [];
    return this.getUserSessions();
  }

  // Join existing user session by code
  async joinUserSession(
    sessionCode: string,
    characterId: string,
    characterName: string,
  ): Promise<realtime.GameSession> {
    const session = await this.joinSession(sessionCode, {
      characterId,
      characterName,
    });

    // Refresh user sessions cache after joining (but don't await it)
    this.refreshUserSessions();

    return session;
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionState?.session.id || null;
  }

  // Pusher connection management
  async initializePusher(sessionId: string): Promise<void> {
    if (this.pusher) {
      this.cleanupPusher();
    }

    try {
      this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });

      // Subscribe to session channel
      const channel = this.pusher.subscribe(`session-${sessionId}`);

      // Listen for connection state changes
      this.pusher.connection.bind("connected", () => {
        this.pusherConnected = true;
        this.notifyListeners();
      });

      this.pusher.connection.bind("disconnected", () => {
        this.pusherConnected = false;
        this.notifyListeners();
      });

      this.pusher.connection.bind("error", () => {
        this.pusherConnected = false;
        this.notifyListeners();
      });

      // Fetch initial activity history
      await this.loadActivityHistory(sessionId);

      // Listen for new activity entries
      channel.bind("activity-shared", (data: realtime.ActivitySharedPayload) => {
        const newEntry: SessionActivityEntry = {
          id: `${data.activity.characterId}-${Date.now()}`,
          sessionId: sessionId,
          characterId: data.activity.characterId,
          characterName: data.activity.characterName,
          userName: data.activity.user.name,
          activityData: data.activity.logEntry,
          timestamp: data.activity.timestamp,
        };

        this.receivedLogEntries = [newEntry, ...this.receivedLogEntries];
        this.notifyListeners();
      });
    } catch (error) {
      console.error("Failed to initialize Pusher:", error);
      this.pusherConnected = false;
      this.notifyListeners();
    }
  }

  private async loadActivityHistory(sessionId: string): Promise<void> {
    try {
      this.receivedLogEntriesLoading = true;
      this.notifyListeners();

      const response = await this.getActivityHistory(sessionId);

      // Convert API response to SessionActivityEntry format
      const sessionEntries: SessionActivityEntry[] = response.data.map((activity: any) => ({
        id: activity.id,
        sessionId: sessionId,
        characterId: activity.characterId,
        characterName: activity.characterName,
        userName: activity.user.name,
        activityData: activity.logEntry,
        timestamp: activity.timestamp,
      }));

      this.receivedLogEntries = sessionEntries;
    } catch (error) {
      console.error("Failed to fetch activity history:", error);
    } finally {
      this.receivedLogEntriesLoading = false;
      this.notifyListeners();
    }
  }

  cleanupPusher(): void {
    if (this.pusher) {
      if (this.currentSessionState) {
        this.pusher.unsubscribe(`session-${this.currentSessionState.session.id}`);
      }
      this.pusher.disconnect();
      this.pusher = null;
    }
    this.pusherConnected = false;
    this.receivedLogEntries = [];
    this.receivedLogEntriesLoading = false;
    this.notifyListeners();
  }

  // Subscription methods
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state: ActivitySharingState = {
      sessionState: this.currentSessionState,
      userSessions: this.userSessions,
      userSessionsLoading: this.userSessionsLoading,
      pusherConnected: this.pusherConnected,
      receivedLogEntries: this.receivedLogEntries,
      receivedLogEntriesLoading: this.receivedLogEntriesLoading,
    };
    this.listeners.forEach((listener) => listener(state));
  }
}
