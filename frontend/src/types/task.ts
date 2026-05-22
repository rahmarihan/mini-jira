export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  taskId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  deadline: string;
  assigneeId: string;
  assigneeName: string;
  teamId: string;
  projectId?: string;

  imageKey?: string;
  imageUrl?: string;
  imageViewUrl?: string;

  thumbnailKey?: string;
  thumbnailUrl?: string;
  thumbnailViewUrl?: string;

  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export const STATUS_ORDER: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
];
