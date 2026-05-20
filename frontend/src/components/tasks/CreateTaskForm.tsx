// frontend/src/components/tasks/CreateTaskForm.tsx
'use client';
import { useState } from 'react';
import { getErrorMessage } from '@/src/lib/error';
import { Task, Priority  } from '../../types/task';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.deadline || !form.assigneeId || !form.teamId) {
        setError('Please fill in all required fields');
        return;
    }

    setLoading(true);
    try {
        await onSubmit(form);   // now returns Task (optional to store it)
        onCancel();
    } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to create task'));
    } finally {
        setLoading(false);
    }
    };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Create Task</h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="space-y-3">
          <input name="title" placeholder="Title *" value={form.title} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
          <select name="priority" value={form.priority} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="LOW">Low Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="HIGH">High Priority</option>
          </select>
          <input name="deadline" type="date" value={form.deadline} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="assigneeId" placeholder="Assignee ID *" value={form.assigneeId} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="assigneeName" placeholder="Assignee Name *" value={form.assigneeName} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {isManager && (
            <input name="teamId" placeholder="Team ID *" value={form.teamId} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}