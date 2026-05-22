import {create} from 'zustand';

import type {User} from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setSession: (user: User, token: string) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
  setHydrating: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrating: true,
  setSession: (user, token) =>
    set({
      user,
      token,
      isAuthenticated: true,
    }),
  setUser: user =>
    set(state => ({
      ...state,
      user,
    })),
  clearSession: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    }),
  setHydrating: value => set({isHydrating: value}),
}));
