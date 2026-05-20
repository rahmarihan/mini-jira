'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/src/store/auth.store';

/** Initializes M1 auth session for protected routes (M5 does not implement auth). */
export default function AuthHydrator({ children }: { children: ReactNode }) {
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    hydrateFromStorage();
    void fetchMe();
  }, [hydrateFromStorage, fetchMe]);

  return <>{children}</>;
}
