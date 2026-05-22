// frontend/src/types/project.ts
export interface Project {
  projectId: string;
  name: string;
  description?: string;
  teamId?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}
