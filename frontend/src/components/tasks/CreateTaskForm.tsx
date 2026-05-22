'use client';

import { useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '../../lib/error';
import { Task, Priority } from '../../types/task';
import { userService } from '../../services/user.service';
import { projectService } from '../../services/project.service';
import type { User } from '../../types/user';
import type { Project } from '../../types/project';

interface Props {
  onSubmit: (data: Partial<Task>) => Promise<Task>;
  onCancel: () => void;
  isManager: boolean;
}

export default function CreateTaskForm({ onSubmit, onCancel, isManager }: Props) {
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

  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!isManager) return;

    async function loadFormData() {
      setLoadingUsers(true);
      setError('');

      try {
        const [loadedUsers, loadedProjects] = await Promise.all([
          userService.getUsers(),
          projectService.getAll(),
        ]);

        setUsers(loadedUsers);
        setProjects(loadedProjects);
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to load task form data'));
      } finally {
        setLoadingUsers(false);
      }
    }

    void loadFormData();
  }, [isManager]);

  const assignableUsers = useMemo(
    () => users.filter((user) => user.role === 'Employee' && user.teamId),
    [users],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = users.find((user) => user.userId === e.target.value);

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
      teamId: selected.teamId || '',
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
      await onSubmit({
        ...form,
        projectId: form.projectId || undefined,
      });
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
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Title *
            </label>
            <input
              name="title"
              placeholder="Task title"
              value={form.title}
              onChange={handleChange}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Describe the task..."
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Deadline *
              </label>
              <input
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Assignee *
            </label>
            <select
              onChange={handleAssigneeChange}
              value={form.assigneeId}
              disabled={loadingUsers}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">
                {loadingUsers ? 'Loading employees...' : 'Select assignee'}
              </option>
              {assignableUsers.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.name || user.email} - {user.teamId} team
                </option>
              ))}
            </select>

            {form.teamId && (
              <p className="mt-1 px-1 text-xs text-gray-400">
                Team auto-assigned:{' '}
                <span className="font-medium text-gray-600">{form.teamId}</span>
              </p>
            )}
          </div>

          {projects.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Project optional
              </label>
              <select
                name="projectId"
                value={form.projectId}
                onChange={handleChange}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.projectId} value={project.projectId}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
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