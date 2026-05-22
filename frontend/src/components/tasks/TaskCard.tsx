// frontend/src/components/tasks/TaskCard.tsx
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

interface Props { task: Task; onClick: () => void; }

export default function TaskCard({ task, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.taskId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer
        hover:shadow-md hover:border-blue-300 transition-all"
    >
      {task.thumbnailUrl && (
        <img
          src={task.thumbnailUrl}
          alt="Task thumbnail"
          style={{ width: '100%', borderRadius: '8px' }}
        />
      )}

      {!task.thumbnailUrl && task.imageUrl && (
        <img src={task.imageUrl} alt="task" className="w-full h-24 object-cover rounded mb-2" />
      )}
      <p className="font-medium text-gray-800 text-sm mb-2 line-clamp-2">{task.title}</p>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
        <span className={`text-xs ${isOverdue(task.deadline) && task.status !== 'DONE' ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
          {formatDate(task.deadline)}
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-2">→ {task.assigneeName}</p>
    </div>
  );
}
