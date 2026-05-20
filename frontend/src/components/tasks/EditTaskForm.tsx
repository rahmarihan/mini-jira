// frontend/src/components/tasks/EditTaskForm.tsx
'use client';
import { useState } from 'react';
import { getErrorMessage } from '@/src/lib/error';
import { Task } from '../../types/task';

interface Props {
  task: Task;
  onSubmit: (taskId: string, data: Partial<Task>) => Promise<void>;
  onCancel: () => void;
}

export default function EditTaskForm({ task, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    deadline: task.deadline.split('T')[0],
    assigneeName: task.assigneeName,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try { await onSubmit(task.taskId, form); onCancel(); }
    catch (err: unknown) { setError(getErrorMessage(err, 'Failed to update task')); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Task</h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="space-y-3">
          <input name="title" value={form.title} onChange={handleChange} placeholder="Title"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea name="description" value={form.description} onChange={handleChange} rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select name="priority" value={form.priority} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <input name="deadline" type="date" value={form.deadline} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="assigneeName" value={form.assigneeName} onChange={handleChange} placeholder="Assignee Name"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}