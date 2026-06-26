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
  tenantPotencia: string | null;
  isLoading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  setTenantPotencia: (id: string | null) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  tenantPotencia: null,
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
  setTenantPotencia: async (id: string | null) => {
    if (id) {
      await saveSecureToken('tenantPotencia', id);
    } else {
      await deleteSecureToken('tenantPotencia');
    }
    set({ tenantPotencia: id });
  },
  hydrate: async () => {
    const token = await getSecureToken('userToken');
    const userData = await getSecureToken('userData');
    const tenantPotencia = await getSecureToken('tenantPotencia');
    if (token && userData) {
      set({ token, user: JSON.parse(userData), tenantPotencia, isLoading: false });
    } else {
      set({ tenantPotencia, isLoading: false });
    }
  },
}));
