'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AuthHydrator from './AuthHydrator';
import { TeamProvider } from '@/src/context/team.context';
import type { Team } from '@/src/lib/teams';

const AUTH_PREFIX = '/auth';

/** Manager team filter options (M1 TeamId values — not mock users) */
const MANAGER_TEAMS: Team[] = [
  { teamId: 'Frontend', name: 'Frontend' },
  { teamId: 'Backend', name: 'Backend' },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname.startsWith(AUTH_PREFIX)) {
    return <>{children}</>;
  }

  return (
    <TeamProvider>
      <AuthHydrator>
        <div className="flex min-h-screen bg-background">
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="flex min-w-0 flex-1 flex-col lg:pl-0">
            <Navbar onMenuClick={() => setSidebarOpen(true)} teams={MANAGER_TEAMS} />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </AuthHydrator>
    </TeamProvider>
  );
}
