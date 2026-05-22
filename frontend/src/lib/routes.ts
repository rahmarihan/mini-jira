import type { UserRole } from '@/src/types/user';

/** Default landing route after authentication, based on role. */
export function getDefaultRoute(role?: UserRole): '/dashboard' | '/kanban' {
  return role === 'Manager' ? '/dashboard' : '/kanban';
}
