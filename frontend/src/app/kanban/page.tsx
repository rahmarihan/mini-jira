'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';
import { useTaskStore } from '../../store/task.store';
import { projectService } from '../../services/project.service';
import KanbanBoard from '../../components/tasks/KanbanBoard';
import CreateTaskForm from '../../components/tasks/CreateTaskForm';
import ManagerTeamFilter from '../../components/tasks/ManagerTeamFilter';
import { TaskStatus } from '../../types/task';
import type { Project } from '../../types/project';
import { getErrorMessage } from '../../lib/error';

export default function KanbanPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchMe } = useAuth();
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const idToken = useAuthStore((s) => s.idToken);
  const logout = useAuthStore((s) => s.logout);

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const { tasks, loading, error, createTask, updateStatus, deleteTask } = useTasks(
    selectedTeamId || undefined,
    Boolean(idToken),
  );

  const { isCreateFormOpen, openCreateForm, closeCreateForm } = useTaskStore();
  const isManager = user?.role === 'Manager';

  // Derive teams from actual task data rather than a hardcoded mock list
  const teams = Array.from(new Set(tasks.map((t) => t.teamId)))
    .filter(Boolean)
    .map((id) => ({ teamId: id, name: id }));

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
    if (!idToken) return;
    projectService
      .getAll()
      .then((data) => {
        console.log('Projects loaded:', data); // remove after confirming
        setProjects(data);
      })
      .catch((err) => console.error('Projects fetch error:', err));
  }, [idToken]);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateStatus(taskId, status);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Invalid status transition'));
    }
  };

  // Filter tasks by selected project if one is chosen
  const displayedTasks = selectedProjectId
    ? tasks.filter((t) => t.projectId === selectedProjectId)
    : tasks;

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">Mini-Jira</span>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
          <Link href="/kanban" className="font-semibold text-blue-600">Kanban Board</Link>
          <Link href="/projects" className="text-gray-600 hover:text-gray-900">Projects</Link>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{user?.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isManager ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>
            {user?.role}
          </span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 text-xs">
            Logout
          </button>
        </div>
      </nav>

      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kanban Board</h1>
            {!isManager && (
              <p className="text-sm text-gray-500 mt-0.5">Team: {user?.teamId}</p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            {/* Project filter dropdown — always visible to manager */}
            {isManager && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">
                  {projects.length === 0 ? 'No projects yet' : 'All Projects'}
                </option>
                {projects.map((p) => (
                  <option key={p.projectId} value={p.projectId}>{p.name}</option>
                ))}
              </select>
            )}

            {/* Team filter — manager only, derived from real task data */}
            {isManager && teams.length > 0 && (
              <ManagerTeamFilter
                teams={teams}
                selectedTeamId={selectedTeamId}
                onChange={setSelectedTeamId}
              />
            )}

            {isManager && (
              <button
                onClick={openCreateForm}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                + New Task
              </button>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        <KanbanBoard
          tasks={displayedTasks}
          onStatusChange={handleStatusChange}
          onDeleteTask={deleteTask}
          loading={loading}
          isManager={isManager}
        />
      </div>

      {isCreateFormOpen && (
        <CreateTaskForm
          onSubmit={createTask}
          onCancel={closeCreateForm}
          isManager={isManager}
          projects={projects}
        />
      )}
    </div>
  );
}