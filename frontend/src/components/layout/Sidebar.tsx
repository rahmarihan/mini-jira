'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  LayoutDashboard,
  LayoutGrid,
  Users,
} from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  managerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/kanban', label: 'Kanban', icon: LayoutGrid },
  { href: '/dashboard/employees', label: 'Employees', icon: Users, managerOnly: true },
  { href: '/reports', label: 'Team Reports', icon: BarChart3, managerOnly: true },
];

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';

  const visibleItems = NAV_ITEMS.filter((item) => !item.managerOnly || isManager);

  return (
    <aside
      className={cn(
        'fixed top-14 left-0 z-40 flex h-[calc(100vh-3.5rem)] w-60 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main navigation">
        <p className="px-3 py-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          Workspace
        </p>
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className={cn('size-4 shrink-0', isActive && 'text-primary')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3">
        <Separator className="mb-3" />
        <div className="rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            <span>Team</span>
          </div>
          <p className="mt-1 text-sm font-medium">{user?.teamId ?? '—'}</p>
          {/* M3: project switcher / team scope selector */}
        </div>
      </div>
    </aside>
  );
}
