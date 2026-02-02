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
  async (config) => {
    // WEB SPECIFIC: Use localStorage instead of AsyncStorage
    const token = localStorage.getItem('crayai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default client;