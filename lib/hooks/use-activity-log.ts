import { useEffect, useMemo, useState } from "react";

import { getActivityLog } from "@/lib/services/service-factory";
import { LogEntry } from "@/lib/types/log-entries";

export interface UseActivityLogReturn {
  logEntries: LogEntry[];
  addLogEntry: (entry: LogEntry) => Promise<void>;
  handleClearRolls: () => Promise<void>;
}

export function useActivityLog(): UseActivityLogReturn {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  // Get service from factory (memoized)
  const activityLogService = useMemo(() => getActivityLog(), []);

  // Subscribe to activity log updates
  useEffect(() => {
    const refreshLogs = async () => {
      try {
        const entries = await activityLogService.getLogEntries();
        setLogEntries(entries);
      } catch (error) {
        console.error("Failed to refresh log entries:", error);
      }
    };

    // Initial load and periodic refresh (simple polling)
    refreshLogs();
    const interval = setInterval(refreshLogs, 1000);

    return () => clearInterval(interval);
  }, [activityLogService]);

  const addLogEntry = async (entry: LogEntry) => {
    try {
      // Persist to storage
      await activityLogService.addLogEntry(entry);
      // Update local state
      setLogEntries((prevEntries) => [entry, ...prevEntries.slice(0, 99)]); // Keep only 100 entries
    } catch (error) {
      console.error("Failed to add log entry:", error);
    }
  };

  const handleClearRolls = async () => {
    try {
      await activityLogService.clearLogEntries();
      setLogEntries([]);
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
