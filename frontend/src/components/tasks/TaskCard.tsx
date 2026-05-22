"use client";

import type { MouseEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Task } from "../../types/task";
import { formatDate, isOverdue } from "../../../lib/utils";

const PRIORITY_COLORS = {
  LOW: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};

interface Props {
  task: Task;
  onClick: () => void;
  onDelete?: (taskId: string) => void;
  isManager?: boolean;
}

export default function TaskCard({
  task,
  onClick,
  onDelete,
  isManager,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.taskId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const imageSrc =
    task.thumbnailViewUrl ||
    task.imageViewUrl ||
    task.thumbnailUrl ||
    task.imageUrl;

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (confirm(`Delete "${task.title}"?`)) {
      onDelete?.(task.taskId);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="group relative cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
    >
      {isManager && onDelete && (
        <button
          onClick={handleDelete}
          className="absolute right-2 top-2 rounded p-1 text-gray-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
          title="Delete task"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}

      {imageSrc && (
        <img
          src={imageSrc}
          alt="Task attachment"
          className="mb-2 h-24 w-full rounded object-cover"
        />
      )}

      <p className="mb-2 line-clamp-2 pr-6 text-sm font-medium text-gray-800">
        {task.title}
      </p>

      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            PRIORITY_COLORS[task.priority]
          }`}
        >
          {task.priority}
        </span>

        <span
          className={`text-xs ${
            isOverdue(task.deadline) && task.status !== "DONE"
              ? "font-semibold text-red-500"
              : "text-gray-400"
          }`}
        >
          {formatDate(task.deadline)}
        </span>
      </div>

      <p className="mt-2 text-xs text-gray-400">→ {task.assigneeName}</p>
    </div>
  );
}
