// frontend/src/types/user.ts
export type UserRole = 'Manager' | 'Employee';
export type TeamId = 'ALL' | 'Frontend' | 'Backend';

export interface User {
  userId: string;
  sub: string;
  email: string;
  name?: string;
  role: UserRole;
  teamId: TeamId;
}
