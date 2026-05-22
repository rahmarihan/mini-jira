// frontend/src/components/tasks/TaskModal.tsx
'use client';
import { useEffect, useState } from 'react';
import { Task, STATUS_LABELS } from '../../types/task';
import { taskService } from '../../services/task.service';
import { formatDate, isOverdue } from '../../../lib/utils';
import CommentThread from '../comments/CommentThread';
import ImageUpload from '../files/ImageUpload';

interface AuditEntry {
  logId: string; changedByName: string; oldStatus: string; newStatus: string; timestamp: string;
}

interface Props { task: Task; onClose: () => void; }

export default function TaskModal({ task, onClose }: Props) {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  useEffect(() => {
    taskService.getAuditLog(task.taskId).then(setAuditLog).catch(() => {});
  }, [task.taskId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">{task.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="p-6 space-y-4">
          {task.thumbnailUrl && (
            <img
              src={task.thumbnailUrl}
              alt="Task thumbnail"
              style={{ maxWidth: '200px', borderRadius: '8px' }}
            />
          )}

          {!task.thumbnailUrl && task.imageUrl && (
            <img src={task.imageUrl} alt="attachment" className="w-full h-48 object-cover rounded-xl" />
          )}

          {task.taskId && <ImageUpload taskId={task.taskId} />}

          <p className="text-gray-600">{task.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium text-gray-500">Status:</span> {STATUS_LABELS[task.status]}</div>
            <div><span className="font-medium text-gray-500">Priority:</span> {task.priority}</div>
            <div><span className="font-medium text-gray-500">Assignee:</span> {task.assigneeName}</div>
            <div className={isOverdue(task.deadline) && task.status !== 'DONE' ? 'text-red-500' : ''}>
              <span className="font-medium text-gray-500">Deadline:</span> {formatDate(task.deadline)}
            </div>
          </div>

          <div className="border-t pt-4">
            {task.taskId && <CommentThread taskId={task.taskId} />}
          </div>

          {/* Audit log */}
          {auditLog.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Activity Log</h3>
              <div className="space-y-2">
                {auditLog.map((entry) => (
                  <p key={entry.logId} className="text-xs text-gray-500">
                    <strong>{entry.changedByName}</strong> moved task from{' '}
                    <span className="font-medium">{entry.oldStatus}</span> →{' '}
                    <span className="font-medium">{entry.newStatus}</span>{' '}
                    on {formatDate(entry.timestamp)}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
