import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// const API_URL = 'https://crayai-production.up.railway.app/api';
// const API_URL = 'http://localhost:5000/api';
// const API_URL = process.env.EXPO_PUBLIC_API_URL;

// 1. Get the IP Address automatically from Expo
// This finds the IP of the machine running the Expo packager (e.g., 192.168.1.5)
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localhost = debuggerHost?.split(':')[0] || 'localhost';

// 2. Define the API URL
// Priority: 
// A. Use EXPO_PUBLIC_API_URL if it exists (great for Production/Release builds)
// B. If not, construct the URL using the detected IP and your backend port (5000)
const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${localhost}:5000/api`;

console.log('[Client] API URL set to:', API_URL);

const client = axios.create({
  baseURL: API_URL,
});

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
  (error) => {
    console.error('[Axios] Request error:', error);
    return Promise.reject(error);
  }
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[Axios Error]', error.config?.url, '- Status:', error.response?.status, '-', error.response?.data?.message);
    return Promise.reject(error);
  }
);

export default client;