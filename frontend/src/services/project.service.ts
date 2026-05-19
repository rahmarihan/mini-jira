// frontend/src/services/project.service.ts
import api from '../../lib/axios';
import { Project } from '../types/project';

export const projectService = {
  getAll: async (): Promise<Project[]> => {
    const res = await api.get('/projects');
    return res.data;
  },

  getById: async (projectId: string): Promise<Project> => {
    const res = await api.get(`/projects/${projectId}`);
    return res.data;
  },

  create: async (data: Partial<Project>): Promise<Project> => {
    const res = await api.post('/projects', data);
    return res.data;
  },

  update: async (projectId: string, data: Partial<Project>): Promise<Project> => {
    const res = await api.patch(`/projects/${projectId}`, data);
    return res.data;
  },

  delete: async (projectId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}`);
  },
};