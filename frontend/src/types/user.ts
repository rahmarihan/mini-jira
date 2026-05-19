// frontend/src/types/user.ts
export type UserRole = 'manager' | 'employee';

export interface User {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  teamId: string;
}