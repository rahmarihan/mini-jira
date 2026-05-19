// frontend/src/hooks/useTasks.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/task.service';
import { Task, TaskStatus } from '../types/task';

export function useTasks(teamId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getAll(teamId);
      setTasks(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

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