'use client';

import { useState } from 'react';
import { Task, Priority, TaskStatus, STATUS_ORDER } from '../../types/task';
import { getErrorMessage } from '../../lib/error';

interface Props {
  task: Task;
  onSubmit: (taskId: string, data: Partial<Task>) => Promise<Task>;
  onClose: () => void;
  isManager: boolean;
}

// Human-readable status labels
const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

export default function EditTaskForm({ task, onSubmit, onClose, isManager }: Props) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? '',
    priority: task.priority as Priority,
    deadline: task.deadline ?? '',
    status: task.status as TaskStatus,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Only allow adjacent status transitions (same rule as backend)
  const currentIndex = STATUS_ORDER.indexOf(task.status as TaskStatus);
  const allowedStatuses = STATUS_ORDER.filter(
    (_, i) => Math.abs(i - currentIndex) <= 1
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError('');
    try {
      await onSubmit(task.taskId, {
        title: form.title,
        description: form.description,
        priority: form.priority,
        deadline: form.deadline,
        // Only send status if it changed — updateStatus endpoint is separate
        ...(form.status !== task.status ? { _statusOverride: form.status } : {}),
      });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update task'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          disabled={!isManager}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          disabled={!isManager}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            disabled={!isManager}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Deadline</label>
          <input
            name="deadline"
            type="date"
            value={form.deadline}
            onChange={handleChange}
            disabled={!isManager}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </div>
      </div>

      {/* Status — employees can only move to adjacent statuses */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s} disabled={!allowedStatuses.includes(s)}>
              {STATUS_LABELS[s]}
              {!allowedStatuses.includes(s) ? ' (not available)' : ''}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          You can only move one step forward or backward at a time.
        </p>
      </div>

      {/* Read-only info */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-1">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Assignee:</span> {task.assigneeName ?? task.assigneeId}
        </p>
        <p className="text-xs text-gray-500">
          <span className="font-medium">Team:</span> {task.teamId}
        </p>
        <p className="text-xs text-gray-500">
          <span className="font-medium">Created by:</span> {task.createdByName ?? task.createdBy}
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}