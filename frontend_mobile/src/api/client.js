import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_URL = 'crayai-production.up.railway.app';
const API_URL = 'https://crayai-production.up.railway.app/api';

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