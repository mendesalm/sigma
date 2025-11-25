import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Sending Authorization header with token:', token.substring(0, 30) + '...'); // Log first 30 chars
    } else {
      console.log('No token found in localStorage for Authorization header.');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Session Management ---
export const getSessions = () => {
  return api.get('/masonic-sessions/');
};

export const getSessionDetails = (sessionId: number) => {
  return api.get(`/masonic-sessions/${sessionId}`);
};

// --- Attendance Management ---
export const getSessionAttendance = (sessionId: number) => {
  return api.get(`/masonic-sessions/${sessionId}/attendance`);
};

export const updateManualAttendance = (sessionId: number, memberId: number, status: string) => {
  return api.post(`/masonic-sessions/${sessionId}/attendance/manual`, {
    member_id: memberId,
    attendance_status: status,
  });
};


export default api;
