import type { User } from '@/src/types/user';

/** True while M1 session is resolving (token present but user not loaded yet). */
export function isAuthPending(
  isLoading: boolean,
  idToken: string | null,
  user: User | null,
): boolean {
  return isLoading || (Boolean(idToken) && !user);
}
