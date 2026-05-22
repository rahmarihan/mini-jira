'use client';

import { useState, useEffect } from 'react';
import { getErrorMessage } from '../../lib/error';
import { Task, Priority } from '../../types/task';
import type { Project } from '../../types/project';
import { DEMO_ASSIGNEE_PRESETS } from '../../config/demo-users';

import { authService, UserOption } from '../../services/auth.service';

interface Props {
  onSubmit: (data: Partial<Task>) => Promise<Task>;
  onCancel: () => void;
  isManager: boolean;
  projects?: Project[];  // optional list of projects to link task to
}

export default function CreateTaskForm({ onSubmit, onCancel, isManager, projects = [] }: Props) {
  const [form, setForm] = useState<{
    title: string;
    description: string;
    priority: Priority;
    deadline: string;
    assigneeId: string;
    assigneeName: string;
    teamId: string;
    projectId: string;
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
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

  useEffect(() => {
    authService.getAll()
      .then(setUsers)
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // When manager picks an assignee, auto-fill assigneeId, assigneeName, and teamId
  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = users.find((u) => u.userId === e.target.value);
    if (!selected) {
      setForm((prev) => ({ ...prev, assigneeId: '', assigneeName: '', teamId: '' }));
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
      // strip projectId if empty so it's omitted from the payload
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
      onCancel();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create task'));
    } finally {
      setLoading(false);
    }
  };

  // Only employees can be assigned tasks
  const assignableUsers = users.filter((u) => u.role === 'Employee');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Create Task</h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
            <input
              name="title"
              placeholder="Task title"
              value={form.title}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              name="description"
              placeholder="Describe the task..."
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Deadline *</label>
              <input
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assignee *</label>
            <select
              onChange={handleAssigneeChange}
              value={form.assigneeId}
              disabled={loadingUsers}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
              <p className="text-xs text-gray-400 mt-1 px-1">
                Team auto-assigned: <span className="font-medium text-gray-600">{form.teamId}</span>
              </p>
            )}
          </div>

          {/* Project dropdown — optional */}
          {projects.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Project (optional)</label>
              <select
                name="projectId"
                value={form.projectId}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.projectId} value={p.projectId}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50"
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
    </div>
  );
}