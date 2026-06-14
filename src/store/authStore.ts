import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'admin' | 'waiter' | null;

interface AuthState {
  token: string | null;
  role: Role;
  userName: string | null;
  login: (token: string, role: Role, userName?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      userName: null,
      login: (token, role, userName) => set({ token, role, userName: userName || null }),
      logout: () => set({ token: null, role: null, userName: null }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
    }
  )
);
