'use client';

import { FolderKanban } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/** M3: projects list and CRUD will integrate with project.service.ts */
export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize work across teams and initiatives
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="size-5 text-muted-foreground" />
            Coming soon
          </CardTitle>
          <CardDescription>
            Project management UI will be delivered by M3. Tasks can already reference
            projectId from the Kanban board.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the Kanban board to manage tasks in the meantime.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
