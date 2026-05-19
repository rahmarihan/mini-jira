// frontend/src/services/task.service.ts
import api from '../../lib/axios';
import { Task, TaskStatus } from '../types/task';

export const taskService = {
  getAll: async (teamId?: string): Promise<Task[]> => {
    const params = teamId ? { teamId } : {};
    const res = await api.get('/tasks', { params });
    return res.data;
  },

  getById: async (taskId: string): Promise<Task> => {
    const res = await api.get(`/tasks/${taskId}`);
    return res.data;
  },

  create: async (data: Partial<Task>): Promise<Task> => {
    const res = await api.post('/tasks', data);
    return res.data;
  },

  update: async (taskId: string, data: Partial<Task>): Promise<Task> => {
    const res = await api.patch(`/tasks/${taskId}`, data);
    return res.data;
  },

  updateStatus: async (taskId: string, status: TaskStatus): Promise<Task> => {
    const res = await api.patch(`/tasks/${taskId}/status`, { status });
    return res.data;
  },

  delete: async (taskId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },

  getAuditLog: async (taskId: string) => {
    const res = await api.get(`/tasks/${taskId}/audit-log`);
    return res.data;
  },
};