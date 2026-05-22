'use client';

import NotificationToast from '../notifications/NotificationToast';
import { useState, useEffect } from 'react';
import { getErrorMessage } from '../../lib/error';
import { Task, Priority } from '../../types/task';
import type { Project } from '../../types/project';
import { authService, UserOption } from '../../services/auth.service';

interface Props {
  onSubmit: (data: Partial<Task>) => Promise<Task>;
  onCancel: () => void;
  isManager: boolean;
  projects?: Project[];
}

export default function CreateTaskForm({
  onSubmit,
  onCancel,
  isManager,
  projects = [],
}: Props) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    deadline: '',
    assigneeId: '',
    assigneeName: '',
    teamId: '',
    projectId: '',
  });

  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    authService
      .getAll()
      .then(setUsers)
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = users.find((u) => u.userId === e.target.value);

    if (!selected) {
      setForm((prev) => ({
        ...prev,
        assigneeId: '',
        assigneeName: '',
        teamId: '',
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      assigneeId: selected.userId,
      assigneeName: selected.name || selected.email,
      teamId: selected.teamId,
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.deadline || !form.assigneeId || !form.teamId) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: Partial<Task> = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        deadline: form.deadline,
        assigneeId: form.assigneeId,
        assigneeName: form.assigneeName,
        teamId: form.teamId,
        ...(form.projectId ? { projectId: form.projectId } : {}),
      };

      await onSubmit(payload);

      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
        onCancel();
      }, 2000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create task'));
    } finally {
      setLoading(false);
    }
  };

  const assignableUsers = users.filter((u) => u.role === 'Employee');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Create Task</h2>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="space-y-3">
          <input
            name="title"
            placeholder="Task title *"
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <textarea
            name="description"
            placeholder="Describe the task..."
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            rows={3}
          />

          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <input
            name="deadline"
            type="date"
            value={form.deadline}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <select
            onChange={handleAssigneeChange}
            value={form.assigneeId}
            disabled={loadingUsers}
            className="w-full border rounded-lg px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="">
              {loadingUsers ? 'Loading employees...' : 'Select assignee'}
            </option>
            {assignableUsers.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.name || u.email} — {u.teamId} team
              </option>
            ))}
          </select>

          {form.teamId && (
            <p className="text-xs text-gray-400">
              Team auto-assigned:{' '}
              <span className="font-medium text-gray-600">{form.teamId}</span>
            </p>
          )}

          {projects.length > 0 && (
            <select
              name="projectId"
              value={form.projectId}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || loadingUsers}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>

      <NotificationToast
        visible={showToast}
        message="Task assigned successfully"
      />
    </div>
  );
}