// frontend/src/components/tasks/TaskModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { Task, STATUS_LABELS } from '../../types/task';
import { taskService } from '../../services/task.service';
import { formatDate, isOverdue } from '../../../lib/utils';
import CommentThread from '../comments/CommentThread';
import ImageUpload from '../files/ImageUpload';
import EditTaskForm from './EditTaskForm';
import { useAuth } from '../../hooks/useAuth';

interface AuditEntry {
  logId: string;
  changedByName: string;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
}

interface Props {
  task: Task;
  onClose: () => void;
}

export default function TaskModal({ task, onClose }: Props) {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>(task);

  const { user } = useAuth();
  const isManager = user?.role === 'Manager';

  useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  useEffect(() => {
    taskService
      .getAuditLog(currentTask.taskId)
      .then(setAuditLog)
      .catch(() => setAuditLog([]));
  }, [currentTask.taskId]);

  const handleUpdate = async (taskId: string, data: Partial<Task>) => {
    const updated = await taskService.update(taskId, data);
    setCurrentTask(updated);
    return updated;
  };

  const attachmentUrl =
    currentTask.thumbnailViewUrl ||
    currentTask.thumbnailUrl ||
    currentTask.imageViewUrl ||
    currentTask.imageUrl;

  if (isEditing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Edit Task</h2>

            <button
              onClick={() => setIsEditing(false)}
              className="text-2xl text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <EditTaskForm
            task={currentTask}
            onSubmit={handleUpdate}
            onClose={() => setIsEditing(false)}
            isManager={isManager}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-xl font-bold text-gray-800">
            {currentTask.title}
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
            >
              Edit / Change Status
            </button>

            <button
              onClick={onClose}
              className="text-2xl text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {(currentTask.thumbnailViewUrl ||
            currentTask.thumbnailUrl ||
            currentTask.imageViewUrl ||
            currentTask.imageUrl) && (
            <img
              src={
                currentTask.thumbnailViewUrl ||
                currentTask.thumbnailUrl ||
                currentTask.imageViewUrl ||
                currentTask.imageUrl
              }
              alt="Task attachment"
              className="w-full h-48 object-cover rounded-xl"
            />
          )}

          {currentTask.taskId && <ImageUpload taskId={currentTask.taskId} />}

          <p className="text-gray-600">{currentTask.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Status:</span>{' '}
              {STATUS_LABELS[currentTask.status]}
            </div>

            <div>
              <span className="font-medium text-gray-500">Priority:</span>{' '}
              {currentTask.priority}
            </div>

            <div>
              <span className="font-medium text-gray-500">Assignee:</span>{' '}
              {currentTask.assigneeName}
            </div>

            <div
              className={
                isOverdue(currentTask.deadline) &&
                currentTask.status !== 'DONE'
                  ? 'text-red-500'
                  : ''
              }
            >
              <span className="font-medium text-gray-500">Deadline:</span>{' '}
              {formatDate(currentTask.deadline)}
            </div>
          </div>

          <div className="border-t pt-4">
            {currentTask.taskId && <CommentThread taskId={currentTask.taskId} />}
          </div>

          {auditLog.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="mb-2 font-semibold text-gray-700">
                Activity Log
              </h3>

              <div className="space-y-2">
                {auditLog.map((entry) => (
                  <p key={entry.logId} className="text-xs text-gray-500">
                    <strong>{entry.changedByName}</strong> moved task from{' '}
                    <span className="font-medium">{entry.oldStatus}</span> →{' '}
                    <span className="font-medium">{entry.newStatus}</span> on{' '}
                    {formatDate(entry.timestamp)}
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
