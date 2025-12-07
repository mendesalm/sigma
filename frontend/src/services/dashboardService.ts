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
