import { useEffect, useMemo, useState } from "react";

import { LogEntry } from "@/lib/schemas/activity-log";
import { getActivityLog } from "@/lib/services/service-factory";

export interface UseActivityLogReturn {
  logEntries: LogEntry[];
  addLogEntry: (entry: LogEntry) => Promise<void>;
  handleClearRolls: () => Promise<void>;
}

export function useActivityLog(): UseActivityLogReturn {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  // Get service from factory (memoized)
  const activityLogService = useMemo(() => getActivityLog(), []);

  // Subscribe to activity log updates using listener pattern
  useEffect(() => {
    const unsubscribe = activityLogService.subscribe((entries) => {
      setLogEntries(entries);
    });

    return unsubscribe;
  }, [activityLogService]);

  const addLogEntry = async (entry: LogEntry) => {
    try {
      // Persist to storage - service will notify listeners automatically
      await activityLogService.addLogEntry(entry);
    } catch (error) {
      console.error("Failed to add log entry:", error);
    }
  };

  const handleClearRolls = async () => {
    try {
      // Service will notify listeners automatically
      await activityLogService.clearLogEntries();
    } catch (error) {
      console.error("Failed to clear log entries:", error);
    }
  };

  return {
    logEntries,
    addLogEntry,
    handleClearRolls,
  };
}
