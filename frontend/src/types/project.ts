// frontend/src/types/project.ts
export interface Project {
  projectId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}