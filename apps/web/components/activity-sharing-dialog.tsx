"use client";

import { realtime } from "@nimble/shared";
import { AlertCircle, LogOut, Plus, Settings, Share2, Users } from "lucide-react";

import { useEffect, useState } from "react";

import { useActivitySharing } from "../lib/hooks/use-activity-sharing";
import { useAuth } from "../lib/hooks/use-auth";
import { useCharacterService } from "../lib/hooks/use-character-service";
import { useToast } from "../lib/hooks/use-toast";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ActivitySharingDialogProps {
  children?: React.ReactNode;
}

export function ActivitySharingDialog({ children }: ActivitySharingDialogProps) {
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [sessionName, setSessionName] = useState("");
  const { toast } = useToast();
  const { character } = useCharacterService();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const {
    session: currentSession,
    loading,
    error,
    userSessions,
    userSessionsLoading,
    createSession,
    joinSession,
    leaveSession,
    closeSession,
    clearError,
    loadUserSessions,
    joinUserSession,
  } = useActivitySharing();

  // Show toast notifications for successful operations
  useEffect(() => {
    if (currentSession && !error) {
      // Only show success message when actually joining/creating (when session appears)
      const isNewSession = sessionName.trim() !== "" || joinCode.trim() !== "";
      if (isNewSession) {
        toast({
          title: sessionName ? "Session Created" : "Joined Session",
          description: sessionName
            ? `Session "${currentSession.name}" created with code: ${currentSession.code}`
            : `Joined session "${currentSession.name}"`,
        });
        setSessionName("");
        setJoinCode("");
      }
    }
  }, [currentSession, error, sessionName, joinCode, toast]);

  // Show error notifications
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Load user sessions when dialog opens
  useEffect(() => {
    if (open && isAuthenticated && !currentSession) {
      loadUserSessions();
    }
  }, [open, isAuthenticated, currentSession, loadUserSessions]);

  const handleJoinUserSession = async (sessionCode: string) => {
    if (!character) return;
    await joinUserSession(sessionCode, character.id, character.name);
  };

  const handleCreateSession = async () => {
    if (!character) return;
    await createSession(sessionName, character.id);
  };

  const handleJoinSession = async () => {
    if (!character) return;
    await joinSession(joinCode, character.id, character.name);
  };

  const handleLeaveSession = async () => {
    const sessionName = currentSession?.name;
    const isOwner = currentSession?.ownerId === user?.id;

    if (isOwner) {
      // Owner leaving should close the session
      await closeSession();
      if (sessionName) {
        toast({
          title: "Session Closed",
          description: `Session "${sessionName}" has been closed`,
        });
      }
    } else {
      // Regular participant leaving
      await leaveSession();
      if (sessionName) {
        toast({
          title: "Left Session",
          description: `Left session "${sessionName}"`,
        });
      }
    }
  };

  // Show different trigger button state based on auth
  const triggerButton = children || (
    <Button
      variant="outline"
      size="sm"
      disabled={authLoading || !isAuthenticated}
      title={!isAuthenticated ? "Sign in to join online games" : undefined}
    >
      <Share2 className="w-4 h-4 mr-2" />
      Join Game
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Activity Log Sharing
          </DialogTitle>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to sign in to share activity logs with other players. Click the "Sign in
                with Google" button in the top-right corner to get started.
              </AlertDescription>
            </Alert>
          </div>
        ) : !currentSession ? (
          <div className="space-y-4">
            {/* Existing Sessions */}
            {userSessions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <Label className="text-sm font-medium">Your Active Sessions</Label>
                </div>
                <div className="space-y-2">
                  {userSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{session.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {session.code}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {session.participants.length}/{session.maxPlayers} players
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleJoinUserSession(session.code)}
                        disabled={loading || userSessionsLoading}
                      >
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>
              </div>
            )}

            {/* Create Session */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <Label className="text-sm font-medium">Create New Session</Label>
              </div>
              <div className="grid gap-2">
                <Input
                  placeholder="Session name (e.g., 'Friday Night Game')"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                />
                <Button onClick={handleCreateSession} disabled={loading}>
                  Create
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Join Session */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <Label className="text-sm font-medium">Join Existing Session</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter join code (e.g., FIRE123)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <Button onClick={handleJoinSession} disabled={loading}>
                  Join
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Session Info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{currentSession.name}</h3>
                <Badge variant="secondary">{currentSession.code}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {currentSession.participants.length} / {currentSession.maxPlayers} players
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Participants</Label>
              <div className="space-y-1">
                {currentSession.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                  >
                    <div>
                      <div className="text-sm font-medium">{participant.characterName}</div>
                      <div className="text-xs text-muted-foreground">{participant.user.name}</div>
                    </div>
                    {participant.user.id === currentSession.ownerId && (
                      <Badge variant="outline" className="text-xs">
                        Owner
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleLeaveSession} disabled={loading}>
                <LogOut className="w-4 h-4 mr-2" />
                {currentSession.ownerId === user?.id ? "Close Session" : "Leave"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
