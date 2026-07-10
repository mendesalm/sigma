import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('No token found in localStorage for Authorization header.');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if it's 401 Unauthorized and not already retrying
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // If we are already logging out, just reject the error to avoid loop
      if (originalRequest.url?.includes('/auth/logout')) {
         return Promise.reject(error);
      }

      // If we are calling refresh or login, dispatch force_logout
      if (
        originalRequest.url?.includes('/auth/refresh') || 
        originalRequest.url?.includes('/auth/login')
      ) {
        window.dispatchEvent(new Event('force_logout'));
        return Promise.reject(error);
      }
      
      try {
        // Try to get a new token
        const response = await api.post('/auth/refresh');
        const { access_token } = response.data;
        
        // Save new token
        localStorage.setItem('token', access_token);
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed (expired or revoked), force logout
        console.error('Session expired or revoked.');
        window.dispatchEvent(new Event('force_logout'));
        return Promise.reject(refreshError);
      }
    }
    
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

export const approveSessionMinutes = (sessionId: number) => api.post(`/masonic-sessions/${sessionId}/approve-minutes`);
export const reopenSession = (sessionId: number) => api.post(`/masonic-sessions/${sessionId}/reopen`);
export const getBalaustreData = (sessionId: number) => api.get(`/masonic-sessions/${sessionId}/balaustre-data`);
export const downloadBalaustre = (sessionId: number) => api.get(`/masonic-sessions/${sessionId}/download-balaustre`, { responseType: 'blob' });

export const cancelSession = (sessionId: number) => {
  return api.post(`/masonic-sessions/${sessionId}/cancel`);
};

export const deleteSession = (sessionId: number) => {
  return api.delete(`/masonic-sessions/${sessionId}`);
};

export const uploadBalaustre = (sessionId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/masonic-sessions/${sessionId}/upload-balaustre`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const uploadDocument = (formData: FormData) => {
  return api.post(`/masonic-sessions/${formData.get('session_id')}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
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

export const deleteClassifiedPhoto = (id: number, photoId: number) => {
  return api.delete(`/classifieds/${id}/photos/${photoId}`);
};

export const addClassifiedPhotos = (id: number, formData: FormData) => {
  return api.post(`/classifieds/${id}/photos/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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

export const generateAnnualCalendar = (year: number) => {
  return api.post('/masonic-sessions/generate-calendar', null, {
    params: { year }
  });
};

export const confirmMonthSessions = (startDate: string, endDate: string) => {
  return api.post('/masonic-sessions/confirm-month', null, {
    params: { start_date: startDate, end_date: endDate }
  });
};

export const resetLodgeSettings = (lodgeId: number) => {
  return api.post(`/lodges/${lodgeId}/settings/reset`);
};

export const restoreLodgeSettings = (lodgeId: number) => {
  return api.post(`/lodges/${lodgeId}/settings/restore`);
};

export const getLodgeRecesses = () => {
  return api.get('/masonic-sessions/recesses');
};

export const createLodgeRecess = (data: any) => {
  return api.post('/masonic-sessions/recesses', data);
};

export const deleteLodgeRecess = (id: number) => {
  return api.delete(`/masonic-sessions/recesses/${id}`);
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
