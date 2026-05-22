import api from '../../lib/axios';
import type { User, UserRole } from '../types/user';

export interface Team {
  teamId: string;
  name?: string;
}

export const userService = {
  async getUsers(): Promise<User[]> {
    const res = await api.get<User[]>('/users');
    return res.data;
  },

  async getTeams(): Promise<Team[]> {
    const res = await api.get<Team[]>('/teams');
    return res.data;
  },

  async updateRoleTeam(
    userId: string,
    data: { role: UserRole; teamId: string },
  ): Promise<User> {
    const res = await api.patch<User>(`/users/${userId}/role-team`, data);
    return res.data;
  },
};
