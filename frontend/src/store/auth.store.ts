'use client';

import { create } from 'zustand';
import {
  authService,
  type AuthResponse,
  type ConfirmRegistrationInput,
  type MessageResponse,
  type RegisterInput,
} from '../services/auth.service';
import { getErrorMessage } from '../lib/error';
import type { User } from '../types/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (data: RegisterInput) => Promise<AuthResponse>;
  confirmRegistration: (
    data: ConfirmRegistrationInput,
  ) => Promise<MessageResponse>;
  resendConfirmationCode: (email: string) => Promise<MessageResponse>;
  logout: () => void;
  fetchMe: () => Promise<User | null>;
  hydrateFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  idToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  async login(email, password) {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password);
      set({
        user: data.user,
        accessToken: data.accessToken || null,
        idToken: data.idToken || null,
        refreshToken: data.refreshToken || null,
        isAuthenticated: true,
        isLoading: false,
      });
      return data;
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Authentication failed');
      set({ error: message, isLoading: false, isAuthenticated: false });
      throw error;
    }
  },

  async register(data) {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(data);
      set({ isLoading: false });
      return response;
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Registration failed');
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  async confirmRegistration(data) {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.confirmRegistration(data);
      set({ isLoading: false });
      return response;
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Could not confirm account');
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  async resendConfirmationCode(email) {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.resendConfirmationCode(email);
      set({ isLoading: false });
      return response;
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Could not resend confirmation code');
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout() {
    authService.logout();
    set({
      user: null,
      accessToken: null,
      idToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  async fetchMe() {
    if (!get().idToken) return null;

    set({ isLoading: true, error: null });
    try {
      const user = await authService.me();
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Authentication failed');
      get().logout();
      set({ error: message, isLoading: false });
      return null;
    }
  },

  hydrateFromStorage() {
    if (typeof window === 'undefined') return;
    const hydrated = authService.hydrate();
    if (hydrated.user?.role) {
      document.cookie = `role=${hydrated.user.role}; path=/; SameSite=Lax`;
    }
    set({
      user: hydrated.user,
      accessToken: hydrated.accessToken,
      idToken: hydrated.idToken,
      refreshToken: hydrated.refreshToken,
      isAuthenticated: Boolean(hydrated.idToken && hydrated.user),
    });
  },
}));
