'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, LayoutGrid, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { getDefaultRoute } from '@/src/lib/routes';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarProps {
  onMenuToggle: () => void;
  mobileNavOpen: boolean;
}

function getInitials(name?: string, email?: string) {
  if (name?.trim()) {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return (email?.[0] ?? 'U').toUpperCase();
}

export function Navbar({ onMenuToggle, mobileNavOpen }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const displayName = user?.name || user?.email || 'User';

  // TODO: Connect this to real notifications (M4) later
  const notificationCount = 0; // Will be dynamic when M4 is done

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
          aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>

        <Link
          href={getDefaultRoute(user?.role)}
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutGrid className="size-4" />
          </span>
          <span className="hidden sm:inline">Mini-Jira</span>
        </Link>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          {/* Notifications Button */}
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="relative" 
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            
            {/* Show badge only if there are notifications */}
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-0.5 -right-0.5 size-4 justify-center rounded-full p-0 text-[10px] font-medium"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <Avatar size="sm">
                  <AvatarFallback className="text-xs font-medium">
                    {getInitials(user?.name, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[140px] truncate text-left text-sm font-medium md:inline">
                  {displayName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  {user?.role && (
                    <Badge variant="outline" className="mt-1 w-fit text-[10px]">
                      {user.role}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}