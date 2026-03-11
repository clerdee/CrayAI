import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';

const { NETWORK_IP } = config;
const DEFAULT_API_ORIGIN = 'https://crayai-node-api.onrender.com';
const normalizeOrigin = (value) => {
  if (!value) return null;

  let normalized = String(value).trim().replace(/^['\"]|['\"]$/g, '');

  if (!/^https?:\/\//i.test(normalized)) {
    const looksLikeLocalHost = /^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(normalized);
    normalized = `${looksLikeLocalHost ? 'http' : 'https'}://${normalized}`;
  }

  normalized = normalized.replace(/\/$/, '').replace(/\/api$/i, '');
  return normalized;
};

const API_ORIGIN = normalizeOrigin(NETWORK_IP) || DEFAULT_API_ORIGIN;

if (!NETWORK_IP) {
  console.warn(`⚠️ WARNING: NETWORK_IP is missing in config.js! Falling back to ${DEFAULT_API_ORIGIN}`);
}

if (/https?:\/\/(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(API_ORIGIN)) {
  console.warn(`⚠️ WARNING: API origin is local (${API_ORIGIN}). APK builds cannot access local hosts unless the device is on the same network.`);
}

console.log(`[API] Using backend origin: ${API_ORIGIN}`);

// 1. URLs 
const API_URL = `${API_ORIGIN}/api`;
const AI_URL = `${API_ORIGIN}/api`;

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