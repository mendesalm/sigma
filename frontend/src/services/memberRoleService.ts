import api from './api';

export interface MemberRoleAssign {
  role_id: number;
  lodge_id?: number;
  obedience_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface MemberPermissionExceptionCreate {
  permission_id: number;
  exception_type: 'Concedida' | 'Revogada';
  lodge_id?: number;
  obedience_id?: number;
}

const memberRoleService = {
  assignRole: async (memberId: number, data: MemberRoleAssign) => {
    const response = await api.post(`/members/${memberId}/roles`, data);
    return response.data;
  },

  managePermissionException: async (memberId: number, data: MemberPermissionExceptionCreate) => {
    const response = await api.post(`/members/${memberId}/permissions/exceptions`, data);
    return response.data;
  },
};

export default memberRoleService;
