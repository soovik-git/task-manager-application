import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Allows sending HTTP-only cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

// Request Interceptor: Attach Access Token to every request
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s and Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using the http-only cookie
        const res = await api.get('/auth/refresh');
        
        // Grab the new access token
        const newAccessToken = res.data.accessToken;
        setAccessToken(newAccessToken);

        // Update the header of the original request and retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token is expired or invalid. 
        // We will clear state in AuthContext via an event or the context will catch it
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
