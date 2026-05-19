// frontend/src/store/task.store.ts
import { create } from 'zustand';
import { Task } from '../types/task';

interface TaskStore {
  selectedTask: Task | null;
  isModalOpen: boolean;
  isCreateFormOpen: boolean;
  setSelectedTask: (task: Task | null) => void;
  openModal: (task: Task) => void;
  closeModal: () => void;
  openCreateForm: () => void;
  closeCreateForm: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  selectedTask: null,
  isModalOpen: false,
  isCreateFormOpen: false,
  setSelectedTask: (task) => set({ selectedTask: task }),
  openModal: (task) => set({ selectedTask: task, isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false, selectedTask: null }),
  openCreateForm: () => set({ isCreateFormOpen: true }),
  closeCreateForm: () => set({ isCreateFormOpen: false }),
}));