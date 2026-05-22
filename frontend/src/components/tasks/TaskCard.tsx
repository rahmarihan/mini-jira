'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types/task';
import { formatDate, isOverdue } from '../../../lib/utils';

const PRIORITY_COLORS = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all relative group"
    >
      {/* ✅ merged: delete button (HEAD) */}
      {isManager && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1 rounded"
          title="Delete task"
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

      {/* ✅ merged: image support (other branch) */}
      {task.thumbnailViewUrl && (
        <img
          src={task.thumbnailViewUrl}
          alt="Task thumbnail"
          className="w-full h-24 object-cover rounded mb-2"
        />
      )}

      {!task.thumbnailViewUrl && task.imageViewUrl && (
        <img
          src={task.imageViewUrl}
          alt="task"
          className="w-full h-24 object-cover rounded mb-2"
        />
      )}

      <p className="font-medium text-gray-800 text-sm mb-2 line-clamp-2 pr-6">
        {task.title}
      </p>

      <div className="flex items-center justify-between">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            PRIORITY_COLORS[task.priority]
          }`}
        >
          {task.priority}
        </span>

        <span
          className={`text-xs ${
            isOverdue(task.deadline) &&
            task.status !== 'DONE'
              ? 'text-red-500 font-semibold'
              : 'text-gray-400'
          }`}
        >
          {formatDate(task.deadline)}
        </span>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        → {task.assigneeName}
      </p>
    </div>
  );
}
