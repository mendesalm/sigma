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

export const startSession = (sessionId: number) => {
  return api.post(`/masonic-sessions/${sessionId}/start`);
};

export const endSession = (sessionId: number) => {
  return api.post(`/masonic-sessions/${sessionId}/end`);
};

export const cancelSession = (sessionId: number) => {
  return api.post(`/masonic-sessions/${sessionId}/cancel`);
};

export const deleteSession = (sessionId: number) => {
  return api.delete(`/masonic-sessions/${sessionId}`);
};

export const generateBalaustre = (sessionId: number) => {
  return api.post(`/masonic-sessions/${sessionId}/generate-balaustre`);
};

export const generateEdital = (sessionId: number) => {
  return api.post(`/masonic-sessions/${sessionId}/generate-edital`);
};

// --- Document Management ---
export const uploadDocument = (formData: FormData) => {
  return api.post('/documents/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const downloadDocument = (documentId: number) => {
  return api.get(`/documents/${documentId}/download`, {
    responseType: 'blob', // Important for file downloads
  });
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

export const registerVisitorAttendance = (sessionId: number, visitorData: any) => {
  return api.post(`/masonic-sessions/${sessionId}/attendance/visitor`, visitorData);
};


export default api;
