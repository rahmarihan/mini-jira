import type { UserRole } from '@/src/types/user';

/** Default landing route after authentication (all roles use dashboard first). */
export function getDefaultRoute(_role?: UserRole): '/dashboard' {
  return '/dashboard';
}
