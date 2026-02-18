import api from './api';

export interface DashboardStats {
  total_members: number;
  next_events: Array<{
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    location?: string;
  }>;
  upcoming_birthdays: Array<{
    name: string;
    date: string;
    type: string;
  }>;
  active_notices_count: number;
  next_session: {
    id: number;
    title: string;
    session_date: string;
    start_time?: string;
  } | null;
  classifieds_count: number;
  dining_scale: Array<{
    id: number;
    date: string;
    position: string;
    member_id: number;
    name: string;
  }>;
  lodge_members_stats: {
    total: number;
    masters: number;
    fellows: number;
    apprentices: number;
    members_list: Array<{
      id: number;
      full_name: string;
      cim?: string;
      email: string;
      phone?: string;
      profile_picture_path?: string;
      degree?: string;
    }>;
  };
}

export interface CalendarEvent {
  date: number;
  title: string;
  type: 'sessao' | 'evento' | 'aniversario' | 'iniciacao' | 'elevacao' | 'exaltacao' | 'aniversario_familiar' | 'casamento';
  full_date: string;
  status?: string;
  situacao?: string;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getCalendarEvents = async (month: number, year: number): Promise<CalendarEvent[]> => {
  const response = await api.get('/dashboard/calendar', {
    params: { month, year }
  });
  return response.data;
};

export const getClassifieds = async (): Promise<any[]> => {
  const response = await api.get('/classifieds/');
  return response.data;
};
