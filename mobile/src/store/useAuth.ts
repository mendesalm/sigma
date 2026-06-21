import { create } from 'zustand';
import { saveSecureToken, getSecureToken, deleteSecureToken } from '../utils/secureStore';

export interface User {
  id: number;
  email: string;
  name: string;
  cim: string;
  role: string;
  lodge_id?: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  signIn: async (token, user) => {
    await saveSecureToken('userToken', token);
    await saveSecureToken('userData', JSON.stringify(user));
    set({ token, user });
  },
  signOut: async () => {
    await deleteSecureToken('userToken');
    await deleteSecureToken('userData');
    set({ token: null, user: null });
  },
  hydrate: async () => {
    const token = await getSecureToken('userToken');
    const userData = await getSecureToken('userData');
    if (token && userData) {
      set({ token, user: JSON.parse(userData), isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));
