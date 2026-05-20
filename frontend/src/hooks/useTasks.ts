// frontend/src/hooks/useTasks.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/task.service';
import { Task, TaskStatus } from '../types/task';
import { getErrorMessage } from '../lib/error';

function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('mini-jira.idToken'));
}

export function useTasks(teamId?: string, enabled?: boolean) {
  const isEnabled = enabled ?? hasAuthToken();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!isEnabled) {
      setTasks([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getAll(teamId);
      setTasks(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch tasks'));
    } finally {
      setLoading(false);
    }
  }, [isEnabled, teamId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTasks();
  }, [fetchTasks]);

  const createTask = async (data: Partial<Task>) => {
    const task = await taskService.create(data);
    setTasks((prev) => [...prev, task]);
    return task;
  };

  const updateTask = async (taskId: string, data: Partial<Task>) => {
    const updated = await taskService.update(taskId, data);
    setTasks((prev) => prev.map((t) => (t.taskId === taskId ? updated : t)));
    return updated;
  };

  const updateStatus = async (taskId: string, status: TaskStatus) => {
    const updated = await taskService.updateStatus(taskId, status);
    setTasks((prev) => prev.map((t) => (t.taskId === taskId ? updated : t)));
    return updated;
  };

  const deleteTask = async (taskId: string) => {
    await taskService.delete(taskId);
    setTasks((prev) => prev.filter((t) => t.taskId !== taskId));
  };

  return { tasks, loading, error, fetchTasks, createTask, updateTask, updateStatus, deleteTask };
}
