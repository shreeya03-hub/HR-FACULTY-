import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'HR_MANAGER' | 'PRINCIPAL' | 'DEAN' | 'HOD' | 'FACULTY' | 'ACCOUNTS_OFFICER' | 'NAAC_COORDINATOR' | 'RECRUITMENT_OFFICER';
  firstName: string;
  lastName: string;
  phone?: string;
  facultyId?: string;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Safe window checkout for Next.js SSR
  const isClient = typeof window !== 'undefined';
  
  const savedUser = isClient ? localStorage.getItem('user') : null;
  const savedAccess = isClient ? localStorage.getItem('accessToken') : null;
  const savedRefresh = isClient ? localStorage.getItem('refreshToken') : null;

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    accessToken: savedAccess || null,
    refreshToken: savedRefresh || null,
    setAuth: (user, accessToken, refreshToken) => {
      if (isClient) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      }
      set({ user, accessToken, refreshToken });
    },
    clearAuth: () => {
      if (isClient) {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      set({ user: null, accessToken: null, refreshToken: null });
    }
  };
});
