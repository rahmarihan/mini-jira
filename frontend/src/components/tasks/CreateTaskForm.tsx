'use client';

import { useState } from 'react';
import { getErrorMessage } from '../../lib/error';
import { Task, Priority } from '../../types/task';
import { DEMO_ASSIGNEE_PRESETS } from '../../config/demo-users';

interface Props {
  onSubmit: (data: Partial<Task>) => Promise<Task>;
  onCancel: () => void;
  isManager: boolean;
}

export default function CreateTaskForm({ onSubmit, onCancel, isManager }: Props) {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const applyAssigneePreset = (key: string) => {
    const preset = DEMO_ASSIGNEE_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    setForm((prev) => ({
      ...prev,
      assigneeName: preset.assigneeName,
      assigneeId: preset.assigneeId || prev.assigneeId,
      teamId: preset.teamId,
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.deadline || !form.assigneeId || !form.teamId) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(form);
      onCancel();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create task'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-bold text-gray-800">Create Task</h2>
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        <div className="space-y-3">
          <input
            name="title"
            placeholder="Title *"
            value={form.title}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="LOW">Low Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="HIGH">High Priority</option>
          </select>
          <input
            name="deadline"
            type="date"
            value={form.deadline}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {isManager && (
            <>
              <label className="block text-xs font-medium text-gray-600">
                Quick assign (demo)
              </label>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) applyAssigneePreset(e.target.value);
                }}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Sara or Omar…</option>
                {DEMO_ASSIGNEE_PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <input
            name="assigneeName"
            placeholder="Assignee Name *"
            value={form.assigneeName}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="assigneeId"
            placeholder="Assignee ID (Cognito sub) *"
            value={form.assigneeId}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isManager && (
            <select
              name="teamId"
              value={form.teamId}
              onChange={handleChange}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Team *</option>
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
            </select>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
