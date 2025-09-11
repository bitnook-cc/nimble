"use client";

import { useActivityLog } from "@/lib/hooks/use-activity-log";

import { ActivityLog } from "../activity-log";

export function LogTab() {
  const { logEntries, handleClearRolls } = useActivityLog();

  return (
    <div className="space-y-6">
      <ActivityLog entries={logEntries} onClearRolls={handleClearRolls} />
    </div>
  );
}
