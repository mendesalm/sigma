import api from './client';

export interface DashboardStats {
  total_members: number;
  next_session: {
    id: number;
    title: string;
    session_date: string;
    start_time?: string;
  } | null;
  active_notices_count: number;
  lodge_info: {
    id: number;
    name: string;
    number: number;
  } | null;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};
