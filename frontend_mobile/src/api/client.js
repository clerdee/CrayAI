import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// 1. Get the IP Address automatically
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localhost = debuggerHost?.split(':')[0] || 'localhost';

// --- URL 1: MAIN BACKEND (Node.js / MongoDB) ---
// This stays on Port 5000
const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${localhost}:5000/api`;

// --- URL 2: AI BACKEND (Python / Vision / Chatbot) ---
// This points to Port 5001
const AI_URL = process.env.EXPO_PUBLIC_AI_URL || `http://${localhost}:5001/api`;

console.log('[Client] Main API:', API_URL);
console.log('[Client] AI API:', AI_URL);

// --- CLIENT 1: For Standard App Features ---
const client = axios.create({
  baseURL: API_URL,
});

// --- CLIENT 2: For AI Features ---
export const aiClient = axios.create({
  baseURL: AI_URL,
});

// ... Keep your existing Interceptors for the main client ...
client.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[Axios] Error reading token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[Axios Error]', error.config?.url, error.response?.status);
    return Promise.reject(error);
  }
);

// Export 'client' as default, but also export 'aiClient'
export default client;