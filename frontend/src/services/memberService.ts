import api from './api';

export interface Member {
  id: number;
  full_name: string;
  email: string;
  cim?: string;
  degree?: string;
  status?: string;
  registration_status: string;
  // Add other fields as needed based on MemberResponse
}

export const getMembers = async (skip = 0, limit = 100): Promise<Member[]> => {
  const response = await api.get<Member[]>('/members/', {
    params: { skip, limit },
  });
  return response.data;
};

export const createMember = async (memberData: any) => {
  const response = await api.post('/members/', memberData);
  return response.data;
};

export const updateMember = async (id: number, memberData: any) => {
  const response = await api.put(`/members/${id}`, memberData);
  return response.data;
};

export const deleteMember = async (id: number) => {
  const response = await api.delete(`/members/${id}`);
  return response.data;
};
