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
export const getSessions = (params?: { start_date?: string; end_date?: string; session_status?: string }) => {
  return api.get('/masonic-sessions/', { params });
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

export const approveSessionMinutes = (sessionId: number) => {
  return api.post(`/masonic-sessions/${sessionId}/approve-minutes`);
};

export const reopenSession = (sessionId: number) => {
  return api.post(`/masonic-sessions/${sessionId}/reopen`);
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


// --- Classifieds ---
export const getClassifieds = () => {
  return api.get('/classifieds/');
};

export const getMyClassifieds = () => {
  return api.get('/classifieds/my');
};

export const createClassified = (formData: FormData) => {
  return api.post('/classifieds/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteClassified = (id: number) => {
  return api.delete(`/classifieds/${id}`);
};

export const reactivateClassified = (id: number) => {
  return api.post(`/classifieds/${id}/reactivate`);
};

export const updateClassified = (id: number, data: any) => {
  return api.put(`/classifieds/${id}`, data);
};

export const uploadLodgeLogo = (lodgeId: number, formData: FormData) => {
  return api.post(`/lodges/${lodgeId}/logo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getLodgeAttendanceStats = (periodMonths: number = 12) => {
  return api.get('/masonic-sessions/stats/attendance', {
    params: { period_months: periodMonths }
  });
};

export const generateCertificate = (sessionId: number, memberId: number) => {
  return api.post(`/masonic-sessions/${sessionId}/generate-certificate/${memberId}`);
};

// --- Committees ---
export const getCommittees = () => {
  return api.get('/committees/');
};

export const createCommittee = (data: any) => {
  return api.post('/committees/', data);
};

export const updateCommittee = (id: number, data: any) => {
  return api.put(`/committees/${id}`, data);
};

export const deleteCommittee = (id: number) => {
  return api.delete(`/committees/${id}`);
};

export default api;
