'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';
import { taskService } from '../../services/task.service';
import { projectService } from '../../services/project.service';
import type { Task } from '../../types/task';
import type { Project } from '../../types/project';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchMe } = useAuth();
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const idToken = useAuthStore((s) => s.idToken);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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
    Promise.all([taskService.getAll(), projectService.getAll()])
      .then(([t, p]) => {
        setTasks(t);
        setProjects(p);
      })
      .finally(() => setLoading(false));
  }, [idToken]);

  const isManager = user?.role === 'Manager';

  const byStatus = (status: string) => tasks.filter((t) => t.status === status).length;

  const statCards = [
    { label: 'To Do',       value: byStatus('TODO'),        color: 'bg-slate-100 text-slate-700',  border: 'border-slate-300' },
    { label: 'In Progress', value: byStatus('IN_PROGRESS'), color: 'bg-blue-50 text-blue-700',     border: 'border-blue-300' },
    { label: 'In Review',   value: byStatus('IN_REVIEW'),   color: 'bg-amber-50 text-amber-700',   border: 'border-amber-300' },
    { label: 'Done',        value: byStatus('DONE'),        color: 'bg-green-50 text-green-700',   border: 'border-green-300' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">Mini-Jira</span>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="font-semibold text-blue-600">Dashboard</Link>
          <Link href="/kanban" className="text-gray-600 hover:text-gray-900">Kanban Board</Link>
          <Link href="/projects" className="text-gray-600 hover:text-gray-900">Projects</Link>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{user?.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isManager ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>
            {user?.role}
          </span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {isManager ? 'Manager view — you can see all teams.' : `Team: ${user?.teamId}`}
        </p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map((card) => (
            <div key={card.label} className={`rounded-xl border ${card.border} ${card.color} p-5`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">{card.label}</p>
              <p className="text-3xl font-bold">{loading ? '—' : card.value}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link
            href="/kanban"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Open Kanban Board →
          </Link>
          {isManager && (
            <Link
              href="/projects"
              className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Manage Projects
            </Link>
          )}
        </div>

        {/* Projects overview */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Projects</h2>
            {isManager && (
              <Link href="/projects" className="text-sm text-blue-600 hover:underline">
                View all →
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">
              {isManager ? (
                <>No projects yet. <Link href="/projects" className="text-blue-500 underline">Create one →</Link></>
              ) : (
                'No projects assigned to your team yet.'
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((p) => {
                const projectTasks = tasks.filter((t) => t.projectId === p.projectId);
                const done = projectTasks.filter((t) => t.status === 'DONE').length;
                const pct = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0;
                return (
                  <div key={p.projectId} className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 mb-3 line-clamp-2">{p.description || 'No description'}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{done}/{projectTasks.length} tasks done</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}