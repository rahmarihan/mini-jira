'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';
import { useTaskStore } from '../../store/task.store';

import { projectService } from '../../services/project.service';
import { userService, type Team } from '../../services/user.service';

import KanbanBoard from '../../components/tasks/KanbanBoard';
import CreateTaskForm from '../../components/tasks/CreateTaskForm';
import ManagerTeamFilter from '../../components/tasks/ManagerTeamFilter';

import { TaskStatus } from '../../types/task';
import type { Project } from '../../types/project';
import { getErrorMessage } from '../../lib/error';

export default function KanbanPage() {
  const router = useRouter();

  const { user, isAuthenticated, fetchMe } = useAuth();

  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const idToken = useAuthStore((state) => state.idToken);
  const logout = useAuthStore((state) => state.logout);

  const isManager = user?.role === 'Manager';

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const { tasks, loading, error, createTask, updateStatus, deleteTask } =
    useTasks(
      selectedTeamId || undefined,
      Boolean(idToken) && Boolean(user?.role && user?.teamId),
    );

  const { isCreateFormOpen, openCreateForm, closeCreateForm } = useTaskStore();

  useEffect(() => {
    hydrateFromStorage();
    void fetchMe();
  }, [fetchMe, hydrateFromStorage]);

  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem('mini-jira.idToken')) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isManager || !idToken) return;

    async function loadTeams() {
      try {
        setTeams(await userService.getTeams());
      } catch {
        setTeams([]);
      }
    }

    void loadTeams();
  }, [isManager, idToken]);

  useEffect(() => {
    if (!isManager || !idToken) return;

    async function loadProjects() {
      try {
        setProjects(await projectService.getAll());
      } catch (err: unknown) {
        console.error('Projects fetch error:', err);
        setProjects([]);
      }
    }

    void loadProjects();
  }, [isManager, idToken]);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateStatus(taskId, status);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Invalid status transition'));
    }
  };

  const displayedTasks = useMemo(() => {
    if (!selectedProjectId) return tasks;
    return tasks.filter((task) => task.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <p className="text-sm text-gray-500">Loading Kanban board...</p>
      </div>
    );
  }

  if (!user.role || !user.teamId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            Your account is pending Manager assignment.
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            A Manager needs to assign your role and team before Kanban data is
            available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <span className="text-lg font-bold text-gray-900">Mini-Jira</span>

        <div className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>

          <Link href="/kanban" className="font-semibold text-blue-600">
            Kanban Board
          </Link>

          <Link href="/projects" className="text-gray-600 hover:text-gray-900">
            Projects
          </Link>

          <span className="text-gray-400">|</span>

          <span className="text-gray-600">{user.name}</span>

          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isManager
                ? 'bg-purple-100 text-purple-700'
                : 'bg-sky-100 text-sky-700'
            }`}
          >
            {user.role}
          </span>

          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kanban Board</h1>

            {!isManager && (
              <p className="mt-0.5 text-sm text-gray-500">
                Team: {user.teamId}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {isManager && (
              <select
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">
                  {projects.length === 0 ? 'No projects yet' : 'All Projects'}
                </option>

                {projects.map((project) => (
                  <option key={project.projectId} value={project.projectId}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}

            {isManager && (
              <ManagerTeamFilter
                teams={teams}
                selectedTeamId={selectedTeamId}
                onChange={setSelectedTeamId}
              />
            )}

            {isManager && (
              <button
                onClick={openCreateForm}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
              >
                + New Task
              </button>
            )}
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <KanbanBoard
          tasks={displayedTasks}
          onStatusChange={handleStatusChange}
          onDeleteTask={deleteTask}
          loading={loading}
          isManager={isManager}
        />

        {isCreateFormOpen && isManager && (
          <CreateTaskForm
            onSubmit={createTask}
            onCancel={closeCreateForm}
            isManager={isManager}
          />
        )}
      </div>
    </div>
  );
}