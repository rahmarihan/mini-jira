"use client";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task, TaskStatus, STATUS_LABELS } from "../../types/task";
import TaskCard from "./TaskCard";

const COLUMN_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-gray-100 border-gray-300",
  IN_PROGRESS: "bg-blue-50 border-blue-300",
  IN_REVIEW: "bg-yellow-50 border-yellow-300",
  DONE: "bg-green-50 border-green-300",
};

interface Props {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  isManager?: boolean;
}

export default function KanbanColumn({
  status,
  tasks,
  onTaskClick,
  onDeleteTask,
  isManager,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border-2 p-4 min-h-[500px] transition-colors
        ${COLUMN_COLORS[status]} ${isOver ? "ring-2 ring-blue-400" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">{STATUS_LABELS[status]}</h3>
        <span className="bg-white text-gray-600 text-xs font-medium px-2 py-1 rounded-full border">
          {tasks.length}
        </span>
      </div>
      <SortableContext
        items={tasks.map((t) => t.taskId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.taskId}
              task={task}
              onClick={() => onTaskClick(task)}
              onDelete={onDeleteTask}
              isManager={isManager}
            />
          ))}
          {tasks.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-8">
              No tasks here
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
