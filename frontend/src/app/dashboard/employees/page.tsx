'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Shield, Users } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/store/auth.store';
import { getErrorMessage } from '@/src/lib/error';
import { userService, type Team } from '@/src/services/user.service';
import type { User, UserRole } from '@/src/types/user';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function EmployeesPage() {
  const router = useRouter();
  const { user, fetchMe } = useAuth();
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [query, setQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('Employee');
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrateFromStorage();
    void fetchMe();
  }, [fetchMe, hydrateFromStorage]);

  useEffect(() => {
    if (user && user.role !== 'Manager') router.replace('/dashboard');
  }, [router, user]);

  useEffect(() => {
    if (user?.role !== 'Manager') return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [loadedUsers, loadedTeams] = await Promise.all([
          userService.getUsers(),
          userService.getTeams(),
        ]);
        setUsers(loadedUsers);
        setTeams(loadedTeams);
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Could not load employees'));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user?.role]);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((item) =>
      [item.name, item.email, item.role, item.teamId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [query, users]);

  const openEditor = (selected: User) => {
    setEditingUser(selected);
    setRole(selected.role || 'Employee');
    setTeamId(selected.teamId || teams[0]?.teamId || '');
  };

  const saveRoleTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) return;
    if (!teamId.trim()) {
      toast.error('Team is required');
      return;
    }

    setSaving(true);
    try {
      const updated = await userService.updateRoleTeam(editingUser.userId, {
        role,
        teamId,
      });
      setUsers((current) =>
        current.map((item) =>
          item.userId === editingUser.userId ? { ...item, ...updated } : item,
        ),
      );
      setEditingUser(null);
      toast.success('Employee assignment updated');
    } catch (err: unknown) {
      toast.error('Update failed', {
        description: getErrorMessage(err, 'Could not update employee'),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'Manager') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign roles and teams for workspace access
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Search employees"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            User Access
          </CardTitle>
          <CardDescription>
            Pending users are missing either role or team assignment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading employees...</p>
          ) : error ? (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Name</th>
                    <th className="py-3 pr-4 font-medium">Email</th>
                    <th className="py-3 pr-4 font-medium">Role</th>
                    <th className="py-3 pr-4 font-medium">Team</th>
                    <th className="py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((employee) => (
                    <tr key={employee.userId} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">
                        {employee.name || 'Unassigned user'}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {employee.email}
                      </td>
                      <td className="py-3 pr-4">
                        {employee.role ? (
                          <Badge
                            variant={
                              employee.role === 'Manager' ? 'default' : 'secondary'
                            }
                          >
                            {employee.role}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4">{employee.teamId || 'Pending'}</td>
                      <td className="py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditor(employee)}
                        >
                          <Shield className="size-4" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No employees found.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingUser)} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit employee access</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveRoleTeam} className="space-y-4">
            <div>
              <p className="text-sm font-medium">{editingUser?.name || 'User'}</p>
              <p className="text-sm text-muted-foreground">{editingUser?.email}</p>
            </div>

            <label className="block text-sm font-medium">
              Role
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
              </select>
            </label>

            <label className="block text-sm font-medium">
              Team
              <select
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select team</option>
                {teams.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.name || team.teamId}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
