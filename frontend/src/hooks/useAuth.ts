'use client';

import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    confirmRegistration,
    resendConfirmationCode,
    logout,
    fetchMe,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    confirmRegistration,
    resendConfirmationCode,
    logout,
    fetchMe,
    role: user?.role,
    teamId: user?.teamId,
    isPendingAssignment: Boolean(user && (!user.role || !user.teamId)),
  };
}
