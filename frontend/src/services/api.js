import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const chatAPI = {
  sendMessage: async (message, userData) => {
    try {
      const response = await api.post('/api/chat', { message, userData });
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.error('Chat API Error:', error);
      
      // Handle 429 (limit exceeded) specially
      if (error.response && error.response.status === 429) {
        return {
          success: false,
          status: 429,
          data: error.response.data,
          error: 'Daily limit exceeded'
        };
      }
      
      // Return fallback response if API fails
      return {
        success: false,
        status: error.response?.status || 500,
        data: {
          response: "Cosmic energies abhi thoda clouded hain, but main sense kar sakta hun ki aap guidance chahte hain. Please apne birth details complete kariye aur question fir se puchiye taki main accurate Vedic astrological insights de sakun.",
          timestamp: new Date().toISOString(),
          fallback: true
        },
        error: error.message
      };
    }
  },

  healthCheck: async () => {
    try {
      const response = await api.get('/api/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
};

export default api;
