import axios from 'axios';

// 1. Point to your Backend URL
// For local dev, use http://localhost:5000 
// For production, use your Cloud URL (e.g., Render/Heroku)
const baseURL = 'http://localhost:5000/api'; 

const client = axios.create({
  baseURL,
});

// 2. Intercept requests to attach the Token
client.interceptors.request.use(
  (config) => {
    // Skip adding Authorization for login and social-login endpoints
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