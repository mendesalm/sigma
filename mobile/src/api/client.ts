import axios from 'axios';
import { getSecureToken } from '../utils/secureStore';

const api = axios.create({
  baseURL: 'http://192.168.77.41:8000', // TODO: Update with environment variable or production URL
  timeout: 10000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await getSecureToken('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., trigger sign out)
      // useAuth.getState().signOut(); // Can be integrated later
      console.warn('Unauthorized access - 401');
    }
    return Promise.reject(error);
  }
);

export default api;
