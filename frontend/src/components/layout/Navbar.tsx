'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, LogOut, ChevronDown, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/src/store/auth.store';
import { useTeamFilter } from '@/src/context/team.context';
import { isAuthPending } from '@/src/lib/auth-session';
import { isManager } from '@/src/lib/auth';
import type { Team } from '@/src/lib/teams';
import TeamSelector from './TeamSelector';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/kanban': 'Kanban Board',
  '/projects': 'Projects',
};

interface NavbarProps {
  onMenuClick: () => void;
  /** Teams for manager filter — provided by M1/M2 when available */
  teams?: Team[];
}

function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-4">
      <div className="skeleton-shimmer h-8 w-8 rounded-lg lg:hidden" />
      <div className="skeleton-shimmer h-5 flex-1 max-w-48 rounded-md" />
      <div className="skeleton-shimmer h-9 w-28 rounded-lg" />
    </header>
  );
}

function Navbar({ onMenuClick, teams = [] }: NavbarProps) {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const idToken = useAuthStore((s) => s.idToken);
  const { selectedTeamId, setSelectedTeamId } = useTeamFilter();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isAuthPending(isLoading, idToken, user)) return <NavbarSkeleton />;
  if (!user) return null;

  const pageTitle =
    PAGE_TITLES[pathname] ??
    PAGE_TITLES[Object.keys(PAGE_TITLES).find((p) => pathname.startsWith(p)) ?? ''] ??
    'Mini Jira';

  const manager = isManager(user);
  const displayName = user.name ?? user.email;
  const selectClass =
    'h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="hidden items-center gap-2 sm:flex">
          <LayoutGrid className="size-5 text-primary" />
          <span className="text-sm font-semibold tracking-tight">Mini Jira</span>
        </div>
        <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />
        <h1 className="truncate text-base font-semibold sm:text-lg">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {manager && (
          <div className="hidden md:block">
            <label htmlFor="team-select" className="sr-only">
              Select team
            </label>
            <TeamSelector
              teams={teams}
              selectedTeamId={selectedTeamId}
              onChange={setSelectedTeamId}
              id="team-select"
              className={selectClass}
            />
          </div>
        )}

        {!manager && user.teamId && (
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Team: {user.teamId}
          </span>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              'flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-sm transition-colors hover:bg-muted',
              menuOpen && 'bg-muted',
            )}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {displayName
                .split(/\s+/)
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <span className="hidden max-w-[120px] truncate text-left sm:block">
                <span className="block font-medium leading-tight">{displayName}</span>
              <span className="block text-xs capitalize text-muted-foreground">
                {user.role}
              </span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Close user menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border bg-popover p-1 shadow-lg">
                <div className="border-b px-3 py-2 sm:hidden">
                  <p className="font-medium">{displayName}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {user.role}
                  </p>
                  {!manager && user.teamId && (
                    <p className="text-xs text-muted-foreground">
                      Team: {user.teamId}
                    </p>
                  )}
                </div>
                {manager && (
                  <div className="border-b p-2 md:hidden">
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Team
                    </label>
                    <TeamSelector
                      teams={teams}
                      selectedTeamId={selectedTeamId}
                      onChange={setSelectedTeamId}
                      className={`w-full ${selectClass}`}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
export { Navbar };
export type { NavbarProps };
