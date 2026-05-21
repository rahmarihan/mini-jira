export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export const STATUS_ORDER: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

export type UserRole = 'Manager' | 'Employee';
export type TeamId = 'ALL' | 'Frontend' | 'Backend';
export type EmployeeTeamId = Exclude<TeamId, 'ALL'>;

export interface AuthUser {
  userId: string;
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  teamId: TeamId;
}

export const isManager = (user: Pick<AuthUser, 'role'>) =>
  user.role === 'Manager';

export const sameTeam = (
  user: Pick<AuthUser, 'role' | 'teamId'>,
  teamId: EmployeeTeamId,
) => isManager(user) || user.teamId === teamId;
