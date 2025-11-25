import { createContext, useState, ReactNode, useEffect } from 'react';
import api from '../services/api';
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
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  selectAssociation: (association: Association) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [requiresSelection, setRequiresSelection] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedUser = jwtDecode(token) as any;
      setUser(decodedUser);
      if (decodedUser.requires_selection) {
        setAssociations(decodedUser.associations);
        setRequiresSelection(true);
      }
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', pass);

    const response = await api.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setAssociations([]);
    setRequiresSelection(false);
  };

  return (
    <AuthContext.Provider value={{ user, associations, requiresSelection, login, logout, selectAssociation }}>
      {children}
    </AuthContext.Provider>
  );
};
