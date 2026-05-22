'use client';

import { useEffect, useState } from 'react';
import { FolderKanban } from 'lucide-react';
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError(null);
        setProjects(await projectService.getAll());
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to load projects'));
      } finally {
        setLoading(false);
      }
    }

    void loadProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Current projects from the workspace data store
        </p>
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
              Projects created by Managers will appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.projectId}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  {project.teamId && <Badge variant="outline">{project.teamId}</Badge>}
                </div>
                {project.description && (
                  <CardDescription>{project.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>Created by {project.createdByName || project.createdBy}</p>
                {project.updatedAt && (
                  <p>Updated {new Date(project.updatedAt).toLocaleDateString()}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
