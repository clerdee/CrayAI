import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';

const { NETWORK_IP } = config;
const DEFAULT_API_ORIGIN = 'https://crayai-node-api.onrender.com';
const API_ORIGIN = (NETWORK_IP || DEFAULT_API_ORIGIN).replace(/\/$/, '');

if (!NETWORK_IP) {
  console.warn(`⚠️ WARNING: NETWORK_IP is missing in config.js! Falling back to ${DEFAULT_API_ORIGIN}`);
}

// 1. URLs 
const API_URL = `${API_ORIGIN}/api/`;
const AI_URL = `${API_ORIGIN}/api/`;

// 2. AXIOS CLIENTS
const client = axios.create({
  baseURL: API_URL,
  timeout: 60000, 
});

export const aiClient = axios.create({
  baseURL: AI_URL,
  timeout: 120000,
});

// 3. REQUEST INTERCEPTOR 
client.interceptors.request.use(
  async (requestConfig) => {
    const API_URL = `${API_ORIGIN}/api/`;
    const AI_URL = `${API_ORIGIN}/api/`;

    const skipAuth = requestConfig.url && (
      requestConfig.url.endsWith('auth/login') ||
      requestConfig.url.endsWith('auth/social-login')
    );
    if (skipAuth) {
      return requestConfig;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[Axios] Error reading token:', error);
    }
    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// 4. RESPONSE INTERCEPTOR 
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🚨 API ERROR:', error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

aiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🤖 AI SCAN ERROR:', error.response?.status || error.message);
    return Promise.reject(error);
  }
);

export default client;