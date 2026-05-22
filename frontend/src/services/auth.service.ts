import api from '../../lib/axios';
import type { User } from '../types/user';

export interface AuthTokens {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
  message?: string;
  userConfirmed?: boolean;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface ConfirmRegistrationInput {
  email: string;
  code: string;
}

export interface MessageResponse {
  message: string;
}

const TOKEN_KEYS = {
  accessToken: 'mini-jira.accessToken',
  idToken: 'mini-jira.idToken',
  refreshToken: 'mini-jira.refreshToken',
  user: 'mini-jira.user',
};

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    this.persistAuth(res.data);
    return res.data;
  },

  async register(data: RegisterInput): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  async confirmRegistration(
    data: ConfirmRegistrationInput,
  ): Promise<MessageResponse> {
    const res = await api.post<MessageResponse>('/auth/register/confirm', data);
    return res.data;
  },

  async resendConfirmationCode(email: string): Promise<MessageResponse> {
    const res = await api.post<MessageResponse>('/auth/register/resend-code', {
      email,
    });
    return res.data;
  },

  async me(): Promise<User> {
    const res = await api.get<User>('/auth/me');
    localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(res.data));
    return res.data;
  },

  logout() {
    Object.values(TOKEN_KEYS).forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem('token');
    document.cookie = 'token=; Max-Age=0; path=/';
    document.cookie = 'role=; Max-Age=0; path=/';
  },

  persistAuth(data: AuthResponse) {
    if (data.accessToken) {
      localStorage.setItem(TOKEN_KEYS.accessToken, data.accessToken);
    }
    if (data.idToken) {
      localStorage.setItem(TOKEN_KEYS.idToken, data.idToken);
      localStorage.setItem('token', data.idToken);
      document.cookie = `token=${data.idToken}; path=/; SameSite=Lax`;
    }
    if (data.refreshToken) {
      localStorage.setItem(TOKEN_KEYS.refreshToken, data.refreshToken);
    }
    localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(data.user));
    if (data.user.role) {
      document.cookie = `role=${data.user.role}; path=/; SameSite=Lax`;
    }
  },

  hydrate() {
    const user = localStorage.getItem(TOKEN_KEYS.user);
    return {
      accessToken: localStorage.getItem(TOKEN_KEYS.accessToken),
      idToken: localStorage.getItem(TOKEN_KEYS.idToken),
      refreshToken: localStorage.getItem(TOKEN_KEYS.refreshToken),
      user: user ? (JSON.parse(user) as User) : null,
    };
  },
};
