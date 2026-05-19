// frontend/src/app/kanban/page.tsx
"use client";
import { useState } from "react";
import { useTasks } from "../../hooks/useTasks";
import { useTaskStore } from "../../store/task.store";
import KanbanBoard from "../../components/tasks/KanbanBoard";
import CreateTaskForm from "../../components/tasks/CreateTaskForm";
import ManagerTeamFilter from "../../components/tasks/ManagerTeamFilter";
import { TaskStatus } from "../../types/task";

// TODO: Replace with real user from M1's auth context when ready
const MOCK_USER = { role: "manager", teamId: "team-1" };
const MOCK_TEAMS = [
  { teamId: "team-1", name: "Frontend" },
  { teamId: "team-2", name: "Backend" },
];

export default function KanbanPage() {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const { tasks, loading, error, createTask, updateStatus } = useTasks(
    selectedTeamId || undefined,
  );
  const { isCreateFormOpen, openCreateForm, closeCreateForm } = useTaskStore();

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateStatus(taskId, status);
    } catch (err: any) {
      alert(err.response?.data?.message || "Invalid status transition");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Kanban Board</h1>
        <div className="flex items-center gap-4">
          {MOCK_USER.role === "manager" && (
            <ManagerTeamFilter
              teams={MOCK_TEAMS}
              selectedTeamId={selectedTeamId}
              onChange={setSelectedTeamId}
            />
          )}
          {MOCK_USER.role === "manager" && (
            <button
              onClick={openCreateForm}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              + New Task
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <KanbanBoard
        tasks={tasks}
        onStatusChange={handleStatusChange}
        loading={loading}
      />

      {isCreateFormOpen && (
        <CreateTaskForm
          onSubmit={createTask}
          onCancel={closeCreateForm}
          isManager={MOCK_USER.role === "manager"}
        />
      )}
    </div>
  );
}
