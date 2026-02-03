import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BASE_URL} from '../constants/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log API calls for debugging
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
    return config;
  },
  error => Promise.reject(error),
);

api.interceptors.response.use(
  response => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.baseURL}${response.config.url} - ${response.status}`);
    return response;
  },
  async error => {
    const fullUrl = error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown';
    console.log(`❌ API Error: ${error.config?.method?.toUpperCase()} ${fullUrl} - ${error.response?.status || 'NO_RESPONSE'}`);
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  },
);

export default api;

