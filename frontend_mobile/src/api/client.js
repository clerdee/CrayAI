import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';

const { NETWORK_IP } = config;

if (!NETWORK_IP) {
  console.warn('⚠️ WARNING: NETWORK_IP is missing in config.js!');
}

// 1. URLs (Cleaned up the console logs)
const API_URL = `${NETWORK_IP}/api/`;
const AI_URL = `${NETWORK_IP}/api/`;

// 2. AXIOS CLIENTS
const client = axios.create({
  baseURL: API_URL,
  timeout: 60000, 
});

export const aiClient = axios.create({
  baseURL: AI_URL,
  timeout: 20000,
});

// 3. REQUEST INTERCEPTOR (Kept the crucial Auth Token injection, removed all logs)
client.interceptors.request.use(
  async (requestConfig) => {
    const skipAuth = requestConfig.url && (
      requestConfig.url.endsWith('/auth/login') ||
      requestConfig.url.endsWith('/auth/social-login')
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

// 4. RESPONSE INTERCEPTOR (Removed the massive success/error logs, kept a simple error catch)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only prints a single line if something goes wrong, instead of 10 lines
    console.error('🚨 API ERROR:', error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

// (Optional) Add a tiny error interceptor for your AI client so you aren't blind if it fails
aiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🤖 AI SCAN ERROR:', error.response?.status || error.message);
    return Promise.reject(error);
  }
);

export default client;