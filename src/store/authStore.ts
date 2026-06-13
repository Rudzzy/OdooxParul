import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'admin' | 'waiter' | null;

interface AuthState {
  token: string | null;
  role: Role;
  login: (token: string, role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      login: (token, role) => set({ token, role }),
      logout: () => set({ token: null, role: null }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
    }
  )
);
