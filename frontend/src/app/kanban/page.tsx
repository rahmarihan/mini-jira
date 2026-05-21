// frontend/src/app/kanban/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTasks } from "../../hooks/useTasks";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/auth.store";
import { useTaskStore } from "../../store/task.store";
import KanbanBoard from "../../components/tasks/KanbanBoard";
import CreateTaskForm from "../../components/tasks/CreateTaskForm";
import ManagerTeamFilter from "../../components/tasks/ManagerTeamFilter";
import { TaskStatus } from "../../types/task";
import { getErrorMessage } from "../../lib/error";

const MOCK_TEAMS = [
  { teamId: "Frontend", name: "Frontend" },
  { teamId: "Backend", name: "Backend" },
];

export default function KanbanPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchMe } = useAuth();
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const idToken = useAuthStore((state) => state.idToken);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const { tasks, loading, error, createTask, updateStatus } = useTasks(
    selectedTeamId || undefined,
    Boolean(idToken),
  );
  const { isCreateFormOpen, openCreateForm, closeCreateForm } = useTaskStore();
  const isManager = user?.role === "Manager";

  useEffect(() => {
    hydrateFromStorage();
    void fetchMe();
  }, [fetchMe, hydrateFromStorage]);

  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem("mini-jira.idToken")) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateStatus(taskId, status);
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Invalid status transition"));
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Kanban Board</h1>
        <div className="flex items-center gap-4">
          {isManager && (
            <ManagerTeamFilter
              teams={MOCK_TEAMS}
              selectedTeamId={selectedTeamId}
              onChange={setSelectedTeamId}
            />
          )}
          {isManager && (
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
          isManager={isManager}
        />
      )}
    </div>
  );
}
