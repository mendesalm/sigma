import api from './api';

export interface Permission {
  id: number;
  action: string;
  description: string;
  min_credential: number;
}

export interface Role {
  id: number;
  name: string;
  role_type: 'Loja' | 'Obediência' | 'Subobediência';
  level: number;
  base_credential: number;
  applicable_rites?: string;
  permissions: Permission[];
}

export interface RoleCreate {
  name: string;
  role_type: 'Loja' | 'Obediência' | 'Subobediência';
  level: number;
  base_credential: number;
  applicable_rites?: string;
  permission_ids: number[];
}

export interface RoleUpdate {
  name?: string;
  role_type?: 'Loja' | 'Obediência' | 'Subobediência';
  level?: number;
  base_credential?: number;
  applicable_rites?: string;
  permission_ids?: number[];
}

const roleService = {
  getAll: async () => {
    const response = await api.get<Role[]>('/roles/');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Role>(`/roles/${id}`);
    return response.data;
  },

  create: async (data: RoleCreate) => {
    const response = await api.post<Role>('/roles/', data);
    return response.data;
  },

  update: async (id: number, data: RoleUpdate) => {
    const response = await api.put<Role>(`/roles/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<Role>(`/roles/${id}`);
    return response.data;
  },

  getPermissions: async () => {
    const response = await api.get<Permission[]>('/permissions/');
    return response.data;
  },
};

export default roleService;
