"use client";

import { CloudUpload, CloudOff, Cloud, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { syncService } from "@/lib/services/sync/sync-service";
import { SyncStatus } from "@nimble/shared";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useToast } from "@/lib/hooks/use-toast";

export function SyncButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const { toast } = useToast();

  // Check authentication and sync status on mount
  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true);
      try {
        const auth = await syncService.isAuthenticated();
        setIsAuthenticated(auth);
        
        if (auth) {
          const status = await syncService.getSyncStatus();
          setSyncStatus(status);
          
          // Check for unsynced changes
          const hasUnsyncedChanges = await syncService.checkForChanges();
          setHasChanges(hasUnsyncedChanges);
          setIsSynced(!hasUnsyncedChanges && syncService.getLastSyncTime() !== null);
        }
      } catch (error) {
        console.error('Failed to check status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();

    // Listen for authentication changes
    const handleAuthChange = () => {
      checkStatus();
    };

    // Listen for character changes to detect unsynced changes
    const handleCharacterChange = async () => {
      if (isAuthenticated) {
        const hasUnsyncedChanges = await syncService.checkForChanges();
        setHasChanges(hasUnsyncedChanges);
        setIsSynced(!hasUnsyncedChanges && syncService.getLastSyncTime() !== null);
      }
    };

    window.addEventListener('auth-changed', handleAuthChange);
    window.addEventListener('characters-synced', checkStatus);
    window.addEventListener('character-updated', handleCharacterChange);
    window.addEventListener('character-created', handleCharacterChange);
    window.addEventListener('character-deleted', handleCharacterChange);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
      window.removeEventListener('characters-synced', checkStatus);
      window.removeEventListener('character-updated', handleCharacterChange);
      window.removeEventListener('character-created', handleCharacterChange);
      window.removeEventListener('character-deleted', handleCharacterChange);
    };
  }, [isAuthenticated]);

  const handleSync = useCallback(async () => {
    if (!isAuthenticated || isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncService.syncCharacters();
      
      if (result) {
        setSyncStatus({
          characterCount: result.characterCount,
          lastSyncedAt: result.syncedAt,
          maxCharacters: result.maxCharacters,
        });
        
        toast({
          title: "Sync Complete",
          description: `Synced ${result.characterCount} character${result.characterCount !== 1 ? 's' : ''}`,
        });
        
        // Update sync state
        setHasChanges(false);
        setIsSynced(true);
        
        // Reset button text after 2 seconds
        setTimeout(() => {
          setIsSynced(false);
        }, 2000);
      } else {
        toast({
          title: "Sync Failed",
          description: "Please sign in to sync your characters",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "An error occurred during sync",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, isSyncing, toast]);

  // Don't show sync button if loading
  if (isLoading) {
    return null;
  }

  // Don't show sync button if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const getTooltipContent = () => {
    if (!syncStatus || !syncStatus.lastSyncedAt) {
      return "Never synced - Click to sync now";
    }
    
    const lastSynced = syncService.formatLastSynced(syncStatus.lastSyncedAt);
    return `Last synced: ${lastSynced} (${syncStatus.characterCount}/${syncStatus.maxCharacters} characters)`;
  };

  const getIcon = () => {
    if (isSyncing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (!syncStatus || !syncStatus.lastSyncedAt) {
      return <CloudOff className="h-4 w-4" />;
    }
    
    // Check if sync is recent (within last 5 minutes)
    const lastSyncTime = new Date(syncStatus.lastSyncedAt).getTime();
    const isRecent = Date.now() - lastSyncTime < 5 * 60 * 1000;
    
    if (isRecent) {
      return <Cloud className="h-4 w-4" />;
    }
    
    return <CloudUpload className="h-4 w-4" />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing || (isSynced && !hasChanges)}
            className="h-8"
          >
            {getIcon()}
            <span className="ml-2 hidden sm:inline">
              {isSyncing ? "Syncing..." : (isSynced && !hasChanges) ? "Synced!" : "Sync"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}