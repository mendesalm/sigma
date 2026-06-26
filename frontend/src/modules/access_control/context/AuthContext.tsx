import { createContext, useState, ReactNode, useEffect } from 'react';
import api from '@/shared/services/api';
import { jwtDecode } from 'jwt-decode';

interface Association {
  id: number;
  name: string;
  type: 'lodge' | 'obedience';
}

interface AuthContextType {
  user: any;
  associations: Association[];
  requiresSelection: boolean;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void> | void;
  selectAssociation: (association: Association) => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(() => {
    const token = localStorage.getItem('token');
    return token ? jwtDecode(token) : null;
  });
  const [associations, setAssociations] = useState<Association[]>(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedUser = jwtDecode(token) as any;
      return decodedUser.requires_selection ? decodedUser.associations : [];
    }
    return [];
  });
  const [requiresSelection, setRequiresSelection] = useState(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedUser = jwtDecode(token) as any;
      return !!decodedUser.requires_selection;
    }
    return false;
  });


  useEffect(() => {
    // Escutar evento de logout forçado (vindo do Axios Interceptor)
    const handleForceLogout = () => {
      logout();
    };
    
    window.addEventListener('force_logout', handleForceLogout);
    return () => {
      window.removeEventListener('force_logout', handleForceLogout);
    };
  }, []);


  const login = async (email: string, pass: string) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', pass);

    const tenantPotencia = localStorage.getItem('tenant_potencia');
    const headers: any = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    
    if (tenantPotencia && tenantPotencia !== 'admin') {
      headers['x-tenant-potencia'] = tenantPotencia;
    }

    const response = await api.post('/auth/login', params, {
      headers: headers,
    });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    const decodedUser = jwtDecode(access_token) as any;
    setUser(decodedUser);

    if (decodedUser.requires_selection) {
      setAssociations(decodedUser.associations);
      setRequiresSelection(true);
    } else {
      setRequiresSelection(false);
      setAssociations([]);
    }
    return decodedUser;
  };

  const selectAssociation = async (association: Association) => {
    const response = await api.post('/auth/token/select-association', {
      association_id: association.id,
      association_type: association.type,
    });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    const decodedUser = jwtDecode(access_token);
    setUser(decodedUser);
    setRequiresSelection(false);
    setAssociations([]);
  };

  const logout = async () => {
    try {
      // Fire-and-forget: we try to logout on backend but proceed to clean local state regardless
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API failed, cleaning local session anyway', e);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setAssociations([]);
      setRequiresSelection(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, associations, requiresSelection, login, logout, selectAssociation }}>
      {children}
    </AuthContext.Provider>
  );
};
