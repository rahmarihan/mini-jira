'use client';
import { useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay,
  closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { Task, TaskStatus, STATUS_ORDER } from '../../types/task';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { useTaskStore } from '../../store/task.store';

interface Props {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  loading: boolean;
  isManager?: boolean;
}

export default function KanbanBoard({ tasks, onStatusChange, onDeleteTask, loading, isManager }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { openModal, isModalOpen, selectedTask, closeModal } = useTaskStore();

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }));

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.taskId === taskId);
    if (task && task.status !== newStatus) {
      await onStatusChange(taskId, newStatus);
    }
    setActiveTask(null);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {STATUS_ORDER.map((s) => (
          <div key={s} className="h-96 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveTask(tasks.find((t) => t.taskId === e.active.id) || null)}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          {STATUS_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={getTasksByStatus(status)}
              onTaskClick={openModal}
              onDeleteTask={onDeleteTask}
              isManager={isManager}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} onClick={() => {}} />}
        </DragOverlay>
      </DndContext>

      {isModalOpen && selectedTask && (
        <TaskModal task={selectedTask} onClose={closeModal} />
      )}
    </>
  );
}