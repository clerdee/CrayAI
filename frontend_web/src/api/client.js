import axios from 'axios';

// 1. Point to your Backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const client = axios.create({
  baseURL: API_BASE_URL,
});

// 2. Intercept requests to attach the Token
client.interceptors.request.use(
  (config) => {
    const skipAuth = config.url && (
      config.url.endsWith('/auth/login') ||
      config.url.endsWith('/auth/social-login')
    );
    if (skipAuth) {
      return config;
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default client;