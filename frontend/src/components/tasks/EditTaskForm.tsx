"use client";

import { useEffect, useMemo, useState } from "react";
import { Task, Priority, TaskStatus, STATUS_ORDER } from "../../types/task";
import { getErrorMessage } from "../../lib/error";
import { taskService } from "../../services/task.service";
import { userService } from "../../services/user.service";
import type { User } from "../../types/user";

interface Props {
  task: Task;
  onSubmit: (taskId: string, data: Partial<Task>) => Promise<Task>;
  onClose: () => void;
  isManager: boolean;
}

// Human-readable status labels
const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export default function EditTaskForm({
  task,
  onSubmit,
  onClose,
  isManager,
}: Props) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? "",
    priority: task.priority as Priority,
    deadline: task.deadline ?? "",
    status: task.status as TaskStatus,
    assigneeId: task.assigneeId ?? "",
    assigneeName: task.assigneeName ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Only allow adjacent status transitions (same rule as backend)
  const currentIndex = STATUS_ORDER.indexOf(task.status as TaskStatus);
  const allowedStatuses = STATUS_ORDER.filter(
    (_, i) => Math.abs(i - currentIndex) <= 1,
  );

  useEffect(() => {
    if (!isManager) return;

    async function loadUsers() {
      setLoadingUsers(true);
      setError("");

      try {
        const loadedUsers = await userService.getUsers();
        setUsers(loadedUsers);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load assignees"));
      } finally {
        setLoadingUsers(false);
      }
    }

    void loadUsers();
  }, [isManager]);

  const assignableUsers = useMemo(
    () =>
      users.filter(
        (user) => user.role === "Employee" && user.teamId === task.teamId,
      ),
    [users, task.teamId],
  );

  const isCurrentAssigneeMissing =
    !!form.assigneeId &&
    !assignableUsers.some((user) => user.userId === form.assigneeId);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = users.find((user) => user.userId === e.target.value);

    if (!selected) {
      setForm((prev) => ({
        ...prev,
        assigneeId: "",
        assigneeName: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      assigneeId: selected.userId,
      assigneeName: selected.name || selected.email,
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // 1. If status changed, call the dedicated status endpoint first
      if (form.status !== task.status) {
        await taskService.updateStatus(task.taskId, form.status);
      }
      // 2. Then update the rest of the fields
      const updates: Partial<Task> = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        deadline: form.deadline,
      };

      if (
        isManager &&
        (form.assigneeId !== task.assigneeId ||
          form.assigneeName !== task.assigneeName)
      ) {
        updates.assigneeId = form.assigneeId;
        updates.assigneeName = form.assigneeName;
      }

      await onSubmit(task.taskId, updates);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update task"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Title *
        </label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          disabled={!isManager}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Description
        </label>
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
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Priority
          </label>
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
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Deadline
          </label>
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

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Assignee
        </label>
        <select
          value={form.assigneeId}
          onChange={handleAssigneeChange}
          disabled={!isManager || loadingUsers}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        >
          <option value="">
            {loadingUsers ? "Loading employees..." : "Unassigned"}
          </option>
          {isCurrentAssigneeMissing && (
            <option value={form.assigneeId}>
              {form.assigneeName || form.assigneeId}
            </option>
          )}
          {assignableUsers.map((user) => (
            <option key={user.userId} value={user.userId}>
              {user.name || user.email}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          {isManager
            ? `Assignable employees are limited to the ${task.teamId} team.`
            : "Only managers can change assignees."}
        </p>
      </div>

      {/* Status — employees can only move to adjacent statuses */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Status
        </label>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s} disabled={!allowedStatuses.includes(s)}>
              {STATUS_LABELS[s]}
              {!allowedStatuses.includes(s) ? " (not available)" : ""}
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
          <span className="font-medium">Team:</span> {task.teamId}
        </p>
        <p className="text-xs text-gray-500">
          <span className="font-medium">Created by:</span>{" "}
          {task.createdByName ?? task.createdBy}
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
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
