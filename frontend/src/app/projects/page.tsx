'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FolderKanban } from 'lucide-react';

import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/store/auth.store';
import { projectService } from '@/src/services/project.service';

import type { Project } from '@/src/types/project';
import { getErrorMessage } from '@/src/lib/error';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const EMPTY_FORM = {
  name: '',
  description: '',
};

export default function ProjectsPage() {
  const router = useRouter();

  const { user, isAuthenticated, fetchMe } = useAuth();
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const idToken = useAuthStore((state) => state.idToken);
  const logout = useAuthStore((state) => state.logout);

  const isManager = user?.role === 'Manager';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const loadProjects = useCallback(async () => {
    if (!idToken) return;

    try {
      setLoading(true);
      setError(null);
      setProjects(await projectService.getAll());
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load projects'));
    } finally {
      setLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const openCreate = () => {
    setEditingProject(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description ?? '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingProject(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
  };

  const handleSave = async () => {
    if (!isManager) {
      setFormError('Only Managers can save projects.');
      return;
    }

    if (!form.name.trim()) {
      setFormError('Project name is required.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      };

      if (editingProject) {
        await projectService.update(editingProject.projectId, payload);
      } else {
        await projectService.create(payload);
      }

      setModalOpen(false);
      setEditingProject(null);
      setForm({ ...EMPTY_FORM });
      await loadProjects();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Failed to save project'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!isManager) {
      alert('Only Managers can delete projects.');
      return;
    }

    if (!confirm('Delete this project? This cannot be undone.')) {
      return;
    }

    try {
      await projectService.delete(projectId);
      setProjects((prev) =>
        prev.filter((project) => project.projectId !== projectId),
      );
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to delete project'));
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  if (!user.role || !user.teamId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your account is pending Manager assignment.</CardTitle>
            <CardDescription>
              A Manager needs to assign your role and team before project data is
              available.
            </CardDescription>
          </CardHeader>
        </Card>
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

          <Link href="/kanban" className="text-gray-600 hover:text-gray-900">
            Kanban Board
          </Link>

          <Link href="/projects" className="font-semibold text-blue-600">
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

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Projects
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {isManager
                ? 'Create and manage projects. Tasks are linked to projects.'
                : 'Projects your team is working on.'}
            </p>
          </div>

          {isManager && (
            <button
              onClick={openCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              + New Project
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        ) : error ? (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : projects.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="size-5 text-muted-foreground" />
                No projects yet
              </CardTitle>

              <CardDescription>
                {isManager
                  ? 'Create your first project to start organising tasks.'
                  : 'Projects created by Managers will appear here.'}
              </CardDescription>
            </CardHeader>

            {isManager && (
              <CardContent>
                <button
                  onClick={openCreate}
                  className="text-sm font-medium text-blue-600 underline"
                >
                  Create your first project
                </button>
              </CardContent>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.projectId}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">
                      {project.name}
                    </CardTitle>

                    {project.teamId && (
                      <Badge variant="outline">{project.teamId}</Badge>
                    )}
                  </div>

                  <CardDescription>
                    {project.description || 'No description'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="space-y-1">
                    <p>
                      Created by{' '}
                      {project.createdByName || project.createdBy || 'unknown'}
                    </p>

                    {project.updatedAt && (
                      <p>
                        Updated{' '}
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {isManager && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => openEdit(project)}
                        className="flex-1 rounded-md border border-gray-200 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(project.projectId)}
                        className="flex-1 rounded-md border border-red-100 py-1.5 text-xs text-red-500 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {modalOpen && isManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-gray-800">
              {editingProject ? 'Edit Project' : 'New Project'}
            </h2>

            {formError && (
              <p className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-600">
                {formError}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Project Name *
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeModal}
                disabled={saving}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
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