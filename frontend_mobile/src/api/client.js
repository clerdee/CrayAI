import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// REPLACE '192.168.X.X' with your actual IPv4 Address!
// Keep the port :5000 at the end.
const API_URL = 'http://192.168.1.13:5000/api'; 

const client = axios.create({
  baseURL: API_URL,
});

// Add token to every request automatically
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

// Add response interceptor for errors only
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[Axios Error]', error.config?.url, '- Status:', error.response?.status, '-', error.response?.data?.message);
    return Promise.reject(error);
  }
);

export default client;