'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

const AUTH_PATHS = ['/auth/login', '/auth/register'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isAuthRoute = AUTH_PATHS.some((path) => pathname.startsWith(path));

  if (isAuthRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar
        onMenuToggle={() => setMobileNavOpen((open) => !open)}
        mobileNavOpen={mobileNavOpen}
      />
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <main
        className={cn(
          'min-h-screen pt-14 transition-[padding] lg:pl-60',
        )}
      >
        <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
