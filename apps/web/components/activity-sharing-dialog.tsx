'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Share2, Users, Plus, LogOut, Settings, AlertCircle } from 'lucide-react';
import { useToast } from '../lib/hooks/use-toast';
import { useCharacterService } from '../lib/hooks/use-character-service';
import { useActivitySharing } from '../lib/hooks/use-activity-sharing';
import { Alert, AlertDescription } from './ui/alert';

interface ActivitySharingDialogProps {
  children?: React.ReactNode;
}

export function ActivitySharingDialog({ children }: ActivitySharingDialogProps) {
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [sessionName, setSessionName] = useState('');
  const { toast } = useToast();
  const { character } = useCharacterService();
  const { 
    session: currentSession, 
    loading, 
    error, 
    createSession, 
    joinSession, 
    leaveSession, 
    closeSession,
    clearError 
  } = useActivitySharing();

  // Show toast notifications for successful operations
  useEffect(() => {
    if (currentSession && !error) {
      // Only show success message when actually joining/creating (when session appears)
      const isNewSession = sessionName.trim() !== '' || joinCode.trim() !== '';
      if (isNewSession) {
        toast({
          title: sessionName ? 'Session Created' : 'Joined Session',
          description: sessionName 
            ? `Session "${currentSession.sessionName}" created with code: ${currentSession.code}`
            : `Joined session "${currentSession.sessionName}"`,
        });
        setSessionName('');
        setJoinCode('');
      }
    }
  }, [currentSession, error, sessionName, joinCode, toast]);

  // Show error notifications
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleCreateSession = async () => {
    if (!character) return;
    await createSession(sessionName, character.id);
  };

  const handleJoinSession = async () => {
    if (!character) return;
    await joinSession(joinCode, character.id, character.name);
  };

  const handleLeaveSession = async () => {
    const sessionName = currentSession?.sessionName;
    await leaveSession();
    if (sessionName) {
      toast({
        title: 'Left Session',
        description: `Left session "${sessionName}"`,
      });
    }
  };

  const handleCloseSession = async () => {
    const sessionName = currentSession?.sessionName;
    await closeSession();
    if (sessionName) {
      toast({
        title: 'Session Closed',
        description: `Session "${sessionName}" has been closed`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share Activity
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Activity Log Sharing
          </DialogTitle>
        </DialogHeader>

        {!currentSession ? (
          <div className="space-y-4">
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
                <h3 className="font-medium">{currentSession.sessionName}</h3>
                <Badge variant="secondary">
                  {currentSession.code}
                </Badge>
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
                    {participant.userId === currentSession.owner.id && (
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
                Leave
              </Button>
              {currentSession.owner.id === character?.id && (
                <Button variant="destructive" onClick={handleCloseSession} disabled={loading}>
                  <Settings className="w-4 h-4 mr-2" />
                  Close Session
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}