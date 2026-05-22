'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';
import { projectService } from '../../services/project.service';
import type { Project } from '../../types/project';
import { getErrorMessage } from '../../lib/error';

const EMPTY_FORM = { name: '', description: '' };

export default function ProjectsPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchMe } = useAuth();
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const idToken = useAuthStore((s) => s.idToken);
  const isManager = user?.role === 'Manager';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create / edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    hydrateFromStorage();
    void fetchMe();
  }, [fetchMe, hydrateFromStorage]);

  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem('mini-jira.idToken')) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const load = () => {
    if (!idToken) return;

    setLoading(true);

    projectService
      .getAll()
      .then(setProjects)
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [idToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditingProject(p);
    setForm({
      name: p.name,
      description: p.description ?? '',
    });

    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Project name is required');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (editingProject) {
        await projectService.update(editingProject.projectId, form);
      } else {
        await projectService.create(form);
      }

      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save project'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;

    try {
      await projectService.delete(projectId);

      setProjects((prev) =>
        prev.filter((p) => p.projectId !== projectId)
      );
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete project'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">
          Mini-Jira
        </span>

        <div className="flex items-center gap-6 text-sm">
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-gray-900"
          >
            Dashboard
          </Link>

          <Link
            href="/kanban"
            className="text-gray-600 hover:text-gray-900"
          >
            Kanban Board
          </Link>

          <Link
            href="/projects"
            className="font-semibold text-blue-600"
          >
            Projects
          </Link>

          <span className="text-gray-400">|</span>

          <span className="text-gray-600">
            {user?.name}
          </span>

          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isManager
                ? 'bg-purple-100 text-purple-700'
                : 'bg-sky-100 text-sky-700'
            }`}
          >
            {user?.role}
          </span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Projects
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              {isManager
                ? 'Create and manage projects. Tasks are linked to projects.'
                : 'Projects your team is working on.'}
            </p>
          </div>

          {isManager && (
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + New Project
            </button>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4">
            {error}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 rounded-xl bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-400 text-sm mb-3">
              No projects yet.
            </p>

            {isManager && (
              <button
                onClick={openCreate}
                className="text-blue-600 text-sm underline"
              >
                Create your first project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p.projectId}
                className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                    {p.name}
                  </h3>
                </div>

                <p className="text-xs text-gray-400 line-clamp-3 flex-1">
                  {p.description || 'No description'}
                </p>

                <p className="text-xs text-gray-300">
                  Created by {p.createdByName ?? 'unknown'}
                </p>

                {isManager && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="flex-1 text-xs border border-gray-200 rounded-md py-1.5 text-gray-600 hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(p.projectId)}
                      className="flex-1 text-xs border border-red-100 rounded-md py-1.5 text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingProject ? 'Edit Project' : 'New Project'}
            </h2>

            {formError && (
              <p className="text-red-500 text-sm mb-3">
                {formError}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Project Name *
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Sprint 3, Q3 Deliverables"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder="What is this project about?"
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editingProject
                  ? 'Save Changes'
                  : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}