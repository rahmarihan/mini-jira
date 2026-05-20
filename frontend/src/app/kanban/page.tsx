'use client';

import { useEffect } from 'react';
import { useTasks } from '@/src/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/src/store/auth.store';
import { useTeamFilter } from '@/src/context/team.context';
import { isAuthPending } from '@/src/lib/auth-session';
import { isManager } from '@/src/lib/auth';
import { getErrorMessage } from '@/src/lib/error';
import { useTaskStore } from '@/src/store/task.store';
import KanbanBoard from '@/src/components/tasks/KanbanBoard';
import CreateTaskForm from '@/src/components/tasks/CreateTaskForm';
import SkeletonLoader from '@/src/components/dashboard/SkeletonLoader';
import { Button } from '@/src/components/ui/button';
import { TaskStatus } from '@/src/types/task';

export default function KanbanPage() {
  const { user, isLoading: authLoading, fetchMe } = useAuth();
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const idToken = useAuthStore((s) => s.idToken);
  const { selectedTeamId } = useTeamFilter();

  useEffect(() => {
    hydrateFromStorage();
    void fetchMe();
  }, [hydrateFromStorage, fetchMe]);

  const teamFilter =
    user && isManager(user)
      ? selectedTeamId || (user.teamId === 'ALL' ? undefined : user.teamId)
      : user?.teamId;

  const { tasks, loading: tasksLoading, error, createTask, updateStatus } =
    useTasks(teamFilter, Boolean(idToken));

  const { isCreateFormOpen, openCreateForm, closeCreateForm } = useTaskStore();

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateStatus(taskId, status);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Invalid status transition'));
    }
  };

  if (isAuthPending(authLoading, idToken, user)) {
    return (
      <div className="p-6">
        <SkeletonLoader variant="kanban" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-end">
        {isManager(user) && (
          <Button type="button" onClick={openCreateForm}>
            + New Task
          </Button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <KanbanBoard
        tasks={tasks}
        onStatusChange={handleStatusChange}
        loading={tasksLoading}
      />

      {isCreateFormOpen && (
        <CreateTaskForm
          onSubmit={createTask}
          onCancel={closeCreateForm}
          isManager={isManager(user)}
        />
      )}
    </div>
  );
}
