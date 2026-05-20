import type { User } from '@/src/types/user';

/** Supports M1 role strings (manager / Manager, etc.) */
export function isManager(user: User): boolean {
  return user.role.toLowerCase() === 'manager';
}
