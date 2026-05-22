'use client';

import { useEffect, useState } from 'react';

type ActivityLogItem = {
  taskId: string;
  timestamp: string;
  action: string;
  assignedBy?: string;
  assignee?: string;
  teamId?: string;
  title?: string;
};

type ActivityLogProps = {
  taskId: string;
};

export default function ActivityLog({ taskId }: ActivityLogProps) {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) return;

    const fetchLogs = async () => {
      try {
       const res = await fetch(`/api/tasks/${taskId}/audit-log`);
        const data = await res.json();
        setLogs(data);
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [taskId]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading activity...</p>;
  }

  if (logs.length === 0) {
    return <p className="text-sm text-gray-500">No activity yet.</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Activity Log</h3>

      {logs.map((log) => (
        <div
          key={`${log.taskId}-${log.timestamp}`}
          className="rounded-lg border p-3 text-sm"
        >
          <p className="font-medium">{log.action}</p>

          {log.title && <p>Task: {log.title}</p>}

          {(log.assignedBy || log.assignee) && (
            <p>
              {log.assignedBy || 'Someone'} → {log.assignee || 'Unknown'}
            </p>
          )}

          {log.teamId && <p>Team: {log.teamId}</p>}

          <p className="text-xs text-gray-500">
            {new Date(log.timestamp).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}