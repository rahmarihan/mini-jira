'use client';

import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    fetchMe,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    fetchMe,
    role: user?.role,
    teamId: user?.teamId,
  };
}
